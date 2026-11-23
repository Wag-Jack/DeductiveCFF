"""Automatic checks for generated AI analyses (see prompts/unified_analysis_prompt.md).

Usage: python data_prep/scripts/check_analyses.py CASE.json ANALYSES.json [CASE.json ANALYSES.json ...]
CASE.json: {source_id, context, question, options, correct, distractor, question_type}
ANALYSES.json: list of {type, kind, participant, metadata}
"""
import json
import re
import sys

N_EVIDENCE = 3
WORD_MIN, WORD_MAX = 50, 80
BANNED = ["might", "perhaps", "possibly", "it seems", "maybe", "clearly", "obviously", "however", "tempting"]


def norm(s):
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s).strip()


def parse(participant):
    ev = re.findall(r'^\s*\d+\.\s*"(.*)"\s*$', participant, re.M)
    m = re.search(r"### Reasoning:\s*(.*?)\s*### Answer:", participant, re.S)
    a = re.search(r"### Answer:\s*([A-D])", participant)
    return ev, (m.group(1).strip() if m else ""), (a.group(1) if a else None)


def check(case, items):
    ctx = norm(case["context"])
    rows = []
    for it in items:
        t, k = it["type"], it.get("kind")
        target = case["correct"] if t.startswith("C-") else case["distractor"]
        ev, reasoning, ans = parse(it["participant"])
        problems = []
        if ans != target:
            problems.append(f"answer {ans} != target {target}")
        if len(ev) != N_EVIDENCE:
            problems.append(f"{len(ev)} evidence items")
        match = [norm(e) in ctx for e in ev]
        nmiss = match.count(False)
        if t.endswith("faithful") and nmiss:
            problems.append(f"{nmiss} quote(s) not verbatim in a faithful type")
        if t.endswith("distorted"):
            if k in ("fabricated", "altered") and nmiss != 1:
                problems.append(f"{k}: expected exactly 1 non-verbatim quote, got {nmiss}")
            if k == "ooc" and nmiss:
                problems.append(f"ooc: expected all quotes verbatim, {nmiss} not")
        w = len(reasoning.split())
        if not WORD_MIN <= w <= WORD_MAX:
            problems.append(f"reasoning {w} words")
        low = reasoning.lower()
        bad = [b for b in BANNED if re.search(r"\b" + re.escape(b) + r"\b", low)]
        if bad:
            problems.append("banned: " + ",".join(bad))
        rows.append(dict(source_id=case["source_id"], type=t, kind=k, words=w, verbatim=f"{N_EVIDENCE - nmiss}/{len(ev)}",
                         ok=not problems, problems=problems))
    return rows


if __name__ == "__main__":
    args = sys.argv[1:]
    allrows = []
    for cp, ap in zip(args[::2], args[1::2]):
        allrows += check(json.load(open(cp)), json.load(open(ap)))
    for r in allrows:
        print(f"{r['source_id']:>5} {r['type']:13s} {str(r['kind']):10s} words={r['words']:>3} verbatim={r['verbatim']} "
              f"{'OK' if r['ok'] else 'FAIL: ' + '; '.join(r['problems'])}")
    print(f"\n{sum(r['ok'] for r in allrows)}/{len(allrows)} pass")
