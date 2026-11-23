# Per-chunk labeling instruction

Each of 16 agents got this, with `NN` = its chunk number (00–15). The agreement agent got the same text with
`agreement_100.jsonl` as input and an extra line telling it not to open other agents' outputs.

```
You are labeling detective-reasoning benchmark cases for a research study. Read the spec at SPEC.md first and follow it exactly.

Input: chunks/chunk_NN.jsonl (~100 cases, one JSON per line). Read it in parts if needed (e.g. 20–25 lines at a time).
Output: out/chunk_NN.labels.jsonl — one JSON object per input case, in the same order.

Every label must come from you actually reading each case; do not use regex/keyword heuristics to produce labels.
You may write the output incrementally. When done, verify with a quick Python check that the output parses, has the
same number of lines as the input, and covers every source_id. Then reply with: number labeled, counts of `category`,
and any cases you found broken or ambiguous (ids only).
```

Note for re-runs: agents running in parallel overwrote each other's helper scripts in a shared folder; several
noticed and moved to private folders. Outputs were validated afterwards (ids match input order in every chunk;
per-chunk agreement with upstream answers 81–97%, no chunk looks like it labeled another chunk's content).
Next time, give each agent its own working directory.
