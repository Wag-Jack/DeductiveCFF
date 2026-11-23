# data_prep — DetectBench case pool (Langhui)

Owner: Langhui · Task: prompting faithful / distorted AI analyses for correct (C) and not-correct (NC) cases,
including (1) how much case complexity we need and (2) whether distortions give too much away.

This folder covers the first step: **understanding and filtering the DetectBench cases** we will build analyses on.
Prompt templates for C / NC generation are the next step (see "Next steps").

## Decisions so far (Nov 22)

| Decision | Basis |
|---|---|
| Use DetectBench as the case source | group progress report |
| Pre-generate **every** advice type for **every** selected case; participant count, items per person and type ratios are decided later at assignment time | Langhui, Nov 22 |
| Classify cases by difficulty before writing prompts | Langhui, Nov 22 |
| Start from the full 1,625-case 1–3 arrow subset, not a keyword-filtered whodunit subset | Langhui, Nov 22 |
| Difficulty is only kept within a range (not a manipulated variable): no difficulty bins | Langhui, Nov 22 |
| Split the 241 usable cases into **main 164 / filler 42 / drop 35** (`data/pool_roles.json`) | Langhui, Nov 22 (agreed to Claude's proposal) |
| Keep all question types; tag each case with `question_type` and use type-specific distortion instructions at generation time | Langhui, Nov 22 |
| Include a 4th advice type, **C-distorted** (correct answer, distorted evidence); generated with the same shared prompt as the other types. How to measure it is still open | Langhui, Nov 22 |

## What was done

1. **Candidate subset.** From upstream `DetectBench_eng_v1.3` train/dev/test (3,328 cases), kept cases whose
   `multi_hop_reasoning` has 1–3 `->` arrows → **1,625 cases** (1 arrow: 144, 2: 266, 3: 1,215).
   Same numbers as the `candidates_1_to_3_arrows.jsonl` file shared on Nov 20.
2. **LLM labeling.** Split into 16 chunks (~101 each); 16 independent Claude agents each read every case in their chunk
   and labeled it per [`labeling/SPEC.md`](labeling/SPEC.md). Labels were written by reading, not by regex
   (only `answer_is_longest_option` is a mechanical word count).
3. **Reliability check.** A 17th agent independently relabeled a random 100-case sample (seed 7) without seeing the
   other labels → agreement table below.
4. **Filter → usable pool** of **241 cases** (`data/usable_pool_ids.json`).

## Findings

### Most of the 1,625 are not evidence-reasoning cases

| category | n |
|---|---|
| logic_or_word_puzzle | 581 |
| math_or_calculation | 423 |
| **evidence_deduction** | **376** |
| other (mostly broken cases) | 106 |
| science_or_physics | 102 |
| world_knowledge | 37 |

Upstream answer judged wrong for 153 cases and unclear for 416 (truncated contexts with the key clue missing,
several equally valid options, translation artifacts, duplicates).

### Filter funnel

| step | remaining |
|---|---|
| category = evidence_deduction | 376 |
| answer_supported = yes | 256 |
| labeler's own answer = upstream answer | 256 |
| no external knowledge needed | 242 |
| distortable (has a checkable evidence sentence an AI could alter) | **241** |

### The 241-case pool

- **Difficulty (LLM estimate):** easy 98 / medium 129 / hard 14 → realistically only two levels.
- **Difficulty tracks evidence explicitness**, not evidence count or hop count:

  | est_difficulty | explicit | mixed | implicit |
  |---|---|---|---|
  | 1 easy | 42 | 29 | 27 |
  | 2 medium | 12 | 7 | 110 |
  | 3 hard | 0 | 2 | 12 |

- **Key evidence count:** 1: 12 · 2: 142 · 3: 83 · 4: 4.
- **Upstream hop count is not informative:** 203 / 241 are 3 arrows.
- **Question type:** how/why 191 · who 30 · what-fact 18 · other 2.
- **Leaks to fix when building items:** correct option is the longest in 134 / 241 (56%; 66% across all 1,625);
  correct option is A in 134 / 241. Shuffle positions and control option length (or go binary with a length-matched distractor).
- Context length: 95–319 words, median 223.

### Label reliability (100-case independent relabel)

| label | raw agreement | Cohen's κ |
|---|---|---|
| is evidence_deduction | 0.92 | 0.79 |
| my_answer | 0.95 | 0.93 |
| question_type | 0.95 | 0.92 |
| needs_external_knowledge | 0.98 | 0.91 |
| distortable | 0.90 | 0.73 |
| category (6-way) | 0.79 | 0.71 |
| answer_supported | 0.85 | 0.70 |
| est_difficulty | 0.76 | 0.63 |
| strongest_distractor | 0.72 | 0.62 |
| distractor_plausibility | 0.77 | 0.59 |
| key_evidence_explicitness | 0.72 | **0.47** |

Filtering labels are trustworthy; stratification labels (difficulty, explicitness, distractor) are moderate —
use them for coarse bins and calibrate with a no-AI pilot.

### Difficulty range control → main / filler / drop

| role | rule | n | use |
|---|---|---|---|
| filler | est_difficulty = 1 **and** key evidence explicit | 42 | not in the main analysis; candidates for attention checks (obviously wrong AI advice) and for calibrating trust in the AI. Generate all advice types for these too. |
| drop | est_difficulty = 3, **or** distractor_plausibility = 1 (an NC argument for it can't persuade anyone) | 35 | excluded |
| main | everything else | 164 | main item pool |

Both ends use two signals because each label alone is only moderately reliable. Still to be checked with a no-AI pilot:
drop items whose unassisted accuracy is near 100% or near chance.

### Question types

Question types in `main`: how/why 124 · who 23 · what-fact 15 · other 2 (filler: how/why 38 · who 3 · what-fact 1).
Distortion prompts need a variant per type: for *who* the distortion shifts blame to another person; for *how/why*
it makes a wrong mechanism/explanation look supported (e.g. altering a physical detail or the order of actions).

## Open questions

1. **How to measure C-distorted:** the final answer is correct either way, so it needs a process measure —
   Verify-condition flags only, or an extra per-item question in all conditions (conflicts with one-question-per-case).
2. **Option format:** keep 4 options and fix length leakage, or convert to binary with a length-matched distractor?

## Next steps

- Sample a handful of `main` cases for the first prompt drafts.
- Write one shared prompt skeleton for C-faithful / NC-faithful / NC-distorted × {fabricated, altered detail, out of context}
  starting from `prompts/naive_prompt.txt`, with a who vs how/why variant of the distortion instruction.
- Automatic checks: faithful quotes match the context by string match; distorted versions change exactly the targeted evidence.
- "Giving too much away" check: style-blind test (can a judge tell which analysis is distorted without the case?).

## Reproduce

```bash
python data_prep/scripts/pipeline.py fetch   # DetectBench -> data_prep/raw/ (gitignored)
python data_prep/scripts/pipeline.py build   # 1,625 candidates
python data_prep/scripts/pipeline.py check   # label coverage + agreement table
python data_prep/scripts/pipeline.py pool    # 241 usable ids + main/filler/drop roles (+ raw/usable_pool.jsonl with full cases)
python data_prep/scripts/pipeline.py stats   # tables above
```

## Files

| path | what |
|---|---|
| `labeling/SPEC.md` | label schema given to every labeling agent |
| `labeling/AGENT_PROMPT.md` | the per-chunk instruction |
| `data/labels_1625.jsonl` | our labels for all 1,625 candidates (keyed by DetectBench `id`) |
| `data/agreement_100.labels.jsonl`, `data/agreement_100_ids.json` | independent relabel sample |
| `data/usable_pool_ids.json` | the 241 usable ids |
| `data/pool_roles.json` | main / filler / drop split of those ids |
| `scripts/pipeline.py` | everything above, end to end |

**License note:** the DetectBench repo has no license, so this branch commits only our labels and ids, not the case text.
Ask the authors before redistributing case content.
