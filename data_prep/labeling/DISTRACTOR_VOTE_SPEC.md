# Distractor vote spec

Each line is a multiple-choice detective case with its `correct_answer` given.
Task: imagine a typical college student reading the context carefully, without AI help. Among the three WRONG options,
which would they most likely pick? Judge from the case text yourself.

Output one JSON object per input line (JSONL, same order):
- `source_id`: same as input
- `strongest_distractor`: letter of the most tempting WRONG option (never the correct_answer)
- `runner_up`: letter of the second most tempting wrong option
- `plausibility`: 1–3 for the strongest distractor (1 = obviously wrong, 3 = genuinely tempting)
- `why`: ≤ 15 words

Valid JSON only. Every source_id exactly once. No regex/heuristics: each label from reading the case.
