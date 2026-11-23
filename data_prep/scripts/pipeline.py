"""Rebuild the DetectBench case pool from upstream + our LLM labels.

Usage (from repo root):
    python data_prep/scripts/pipeline.py fetch     # download DetectBench train/dev/test into data_prep/raw/ (gitignored)
    python data_prep/scripts/pipeline.py build     # 1-3 arrow candidates -> data_prep/raw/candidates_1_to_3_arrows.jsonl
    python data_prep/scripts/pipeline.py chunks    # split candidates into 16 labeling chunks + 100-case agreement sample
    python data_prep/scripts/pipeline.py check     # validate labels, per-chunk sanity, inter-annotator agreement
    python data_prep/scripts/pipeline.py pool      # filter to usable pool -> data_prep/data/usable_pool_ids.json (+ raw/usable_pool.jsonl)
    python data_prep/scripts/pipeline.py stats     # print stratification tables for the usable pool

DetectBench content (context/question/options) is NOT committed: the upstream repo has no license.
Everything under data_prep/raw/ is regenerated locally. Only our own labels and id lists are committed.
"""
import collections
import json
import pathlib
import random
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
DATA = ROOT / "data"
UPSTREAM = "https://raw.githubusercontent.com/MikeGu721/DetectBench/main/DetectBench_eng_v1.3/{}.jsonl"
SPLITS = ["train", "dev", "test"]
LETTERS = "ABCD"
C = collections.Counter


def read_jsonl(p):
    with open(p, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def write_jsonl(p, rows):
    with open(p, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def fetch():
    RAW.mkdir(exist_ok=True)
    for s in SPLITS:
        urllib.request.urlretrieve(UPSTREAM.format(s), RAW / f"{s}.jsonl")
        print("fetched", s)


def iter_upstream():
    # Some upstream lines hold more than one JSON object.
    dec = json.JSONDecoder()
    for s in SPLITS:
        for i, line in enumerate(open(RAW / f"{s}.jsonl", encoding="utf-8")):
            line = line.strip()
            pos = 0
            while pos < len(line):
                obj, pos = dec.raw_decode(line, pos)
                while pos < len(line) and line[pos].isspace():
                    pos += 1
                yield s, i, obj


def build():
    rows = []
    for s, i, c in iter_upstream():
        cg = c.get("clue_graph", {})
        mhr = cg.get("multi_hop_reasoning", "") or ""
        ev = cg.get("evidence", "") or ""
        if isinstance(ev, list):
            ev = " ".join(map(str, ev))
        rows.append(dict(source_file=s, source_line=i, source_id=c.get("id"),
                         reasoning_arrows=mhr.count("->"), evidence_arrows=ev.count("->"),
                         context_words=len(c["context"].split()), source_case=c))
    cand = [r for r in rows if 1 <= r["reasoning_arrows"] <= 3]
    print("upstream", len(rows), "| 1-3 arrows", len(cand), sorted(C(r["reasoning_arrows"] for r in cand).items()))
    write_jsonl(RAW / "candidates_1_to_3_arrows.jsonl", cand)


def slim(r):
    c = r["source_case"]
    return dict(source_id=r["source_id"], context=c["context"], question=c["question"],
                options={LETTERS[i]: o for i, o in enumerate(c["options"])},
                labeled_answer=LETTERS[c["answer"]],
                evidence=c["clue_graph"].get("evidence"),
                multi_hop_reasoning=c["clue_graph"].get("multi_hop_reasoning"))


def chunks(k=16, seed=7):
    s = [slim(r) for r in read_jsonl(RAW / "candidates_1_to_3_arrows.jsonl")]
    out = RAW / "chunks"
    out.mkdir(exist_ok=True)
    n = len(s)
    for j in range(k):
        write_jsonl(out / f"chunk_{j:02d}.jsonl", s[j * n // k:(j + 1) * n // k])
    random.seed(seed)
    write_jsonl(out / "agreement_100.jsonl", random.sample(s, 100))
    print("wrote", k, "chunks +", "agreement_100")


def load():
    cand = {r["source_id"]: r for r in read_jsonl(RAW / "candidates_1_to_3_arrows.jsonl")}
    lab = {r["source_id"]: r for r in read_jsonl(DATA / "labels_1625.jsonl")}
    return cand, lab


def kappa(pairs):
    n = len(pairs)
    po = sum(a == b for a, b in pairs) / n
    ca, cb = C(a for a, _ in pairs), C(b for _, b in pairs)
    pe = sum(ca[x] * cb[x] for x in set(ca) | set(cb)) / n / n
    return round(po, 2), (round((po - pe) / (1 - pe), 2) if pe < 1 else None)


def check():
    cand, lab = load()
    assert set(cand) == set(lab), "label ids != candidate ids"
    agree = sum(lab[i]["my_answer"] == LETTERS[cand[i]["source_case"]["answer"]] for i in cand)
    print(f"labels cover all {len(cand)} candidates; my_answer==upstream answer: {agree}/{len(cand)}")
    A = read_jsonl(DATA / "agreement_100.labels.jsonl")
    print("independent relabel of 100 (raw agreement, Cohen's kappa):")
    for key in ["category", "answer_supported", "my_answer", "question_type", "key_evidence_explicitness",
                "distortable", "est_difficulty", "distractor_plausibility", "strongest_distractor",
                "needs_external_knowledge"]:
        print(f"  {key:28s}", kappa([(a[key], lab[a["source_id"]][key]) for a in A]))
    print(f"  {'is_evidence_deduction':28s}",
          kappa([(a["category"] == "evidence_deduction", lab[a["source_id"]]["category"] == "evidence_deduction") for a in A]))


def usable(c, v):
    return (v["category"] == "evidence_deduction" and v["answer_supported"] == "yes"
            and v["my_answer"] == LETTERS[c["source_case"]["answer"]]
            and not v["needs_external_knowledge"] and v["distortable"])


def pool():
    cand, lab = load()
    ids = [i for i in cand if usable(cand[i], lab[i])]
    json.dump(ids, open(DATA / "usable_pool_ids.json", "w"))
    write_jsonl(RAW / "usable_pool.jsonl",
                [dict(source_id=i, labels=lab[i], reasoning_arrows=cand[i]["reasoning_arrows"],
                      context_words=cand[i]["context_words"], source_case=cand[i]["source_case"]) for i in ids])
    print("usable pool:", len(ids))


def stats():
    cand, lab = load()
    print("category (all 1625):", C(v["category"] for v in lab.values()).most_common())
    P = [(cand[i], lab[i]) for i in cand if usable(cand[i], lab[i])]
    print("usable:", len(P))
    for name, f in [("est_difficulty", lambda c, v: v["est_difficulty"]),
                    ("question_type", lambda c, v: v["question_type"]),
                    ("key_evidence_count", lambda c, v: v["key_evidence_count"]),
                    ("explicitness", lambda c, v: v["key_evidence_explicitness"]),
                    ("distractor_plausibility", lambda c, v: v["distractor_plausibility"]),
                    ("reasoning_arrows", lambda c, v: c["reasoning_arrows"]),
                    ("answer_is_longest_option", lambda c, v: v["answer_is_longest_option"]),
                    ("answer_position", lambda c, v: c["source_case"]["answer"])]:
        print(f"  {name}:", sorted(C(f(c, v) for c, v in P).items(), key=str))
    print("  est_difficulty x explicitness (explicit, mixed, implicit):")
    for d in (1, 2, 3):
        print("   ", d, [sum(1 for c, v in P if v["est_difficulty"] == d and v["key_evidence_explicitness"] == e)
                         for e in ("explicit", "mixed", "implicit")])


if __name__ == "__main__":
    {"fetch": fetch, "build": build, "chunks": chunks, "check": check, "pool": pool, "stats": stats}[sys.argv[1]]()
