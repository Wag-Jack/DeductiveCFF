# DetectBench labeling spec

Context: a human-subject study. College students read a short case (`context`), answer a multiple-choice `question`, then see an AI analysis that may be faithful, wrong, or adversarial (it distorts a piece of case evidence: fabricates/modifies an evidence item, alters a small detail like a time, or takes evidence out of context). We need to know which cases are usable and how hard they are.

Each input line is one case: `source_id, context, question, options{A..D}, labeled_answer, evidence, multi_hop_reasoning`.

Judge each case yourself by reading the context. Do not trust `labeled_answer` blindly — check it.

Output exactly one JSON object per input case, one per line (JSONL), with these keys:

| key | type | meaning |
|---|---|---|
| `source_id` | same as input | |
| `category` | one of `evidence_deduction`, `math_or_calculation`, `logic_or_word_puzzle`, `science_or_physics`, `world_knowledge`, `other` | `evidence_deduction` = answer follows from reasoning about facts/events/people stated in the story (detective-style). Use the others when the core of solving is arithmetic, a riddle/pattern/wordplay, physics/science principles, or outside facts. |
| `needs_external_knowledge` | bool | true if a typical college student needs facts not in the context (chemistry, law, history, specialised trivia) to get the answer |
| `answer_supported` | `yes` / `no` / `unclear` | does the context actually support `labeled_answer` as the best option? |
| `my_answer` | `A`-`D` | the option you think is best |
| `question_type` | `who` / `how_or_why` / `what_fact` / `other` | `who` = identify a person (culprit, liar, etc.) |
| `key_evidence_count` | int | number of distinct context facts a solver must combine to reach the answer |
| `key_evidence_explicitness` | `explicit` / `implicit` / `mixed` | are those facts stated plainly, or must they be noticed/inferred from subtle details? |
| `strongest_distractor` | `A`-`D` | wrong option a solver would most likely pick |
| `distractor_plausibility` | 1–3 | 1 = obviously wrong, 3 = genuinely tempting |
| `distortable` | bool | true if there is at least one concrete evidence sentence in the context (a time, place, object, statement) that an AI could alter/fabricate/misquote to argue for a wrong option, and a reader could check against the context |
| `est_difficulty` | 1–3 | for a typical college student without AI help, reading carefully: 1 = most get it right, 2 = mixed, 3 = most get it wrong |
| `answer_is_longest_option` | bool | labeled answer has the most words among options (ties count true) |
| `note` | string ≤ 20 words | anything notable (ambiguity, broken question, translation issues) |

Rules:
- Valid JSON only, no comments, no trailing text. Every input `source_id` must appear exactly once in your output.
- Be consistent and calibrated; don't default to the middle value.
- Write output with the Write tool (or a Python script that writes the JSON you produced). Do NOT auto-generate labels with heuristics/regex — every label must come from you reading the case.
