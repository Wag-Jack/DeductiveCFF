# Unified AI-analysis generation prompt (DRAFT v0 — Langhui, Nov 22)

One prompt skeleton generates every advice type, so that all versions of a case differ only in the manipulated part
(minimal pairs). Only the `MODE` block and the `TARGET` change between types.

## Advice types

| type | TARGET | evidence | reasoning |
|---|---|---|---|
| C-faithful | correct answer | all items verbatim from context | sound |
| NC-faithful | voted distractor | all items verbatim from context | flawed (one wrong inference / one key clue ignored) |
| NC-distorted:{fabricated, altered, ooc} | voted distractor | exactly one item distorted, rest verbatim | sound *given* the distorted item |
| C-distorted:{fabricated, altered, ooc} | correct answer | exactly one item distorted, rest verbatim | sound *given* the distorted item |

C-distorted is generated for the item bank only, not used in the main experiment (Langhui, Nov 22).
An alternative definition — correct answer + verbatim evidence + flawed reasoning (mirror of NC-faithful) — is still under consideration.

Distortions (from the progress report):
- **fabricated** — the item is modified so it changes the meaning of the story
- **altered** — a small detail is changed (time, place, number, who did what)
- **ooc** (out of context) — a real sentence is quoted but its qualifier or surrounding context is dropped (e.g. a time limit,
  a condition, "according to X", "usually"), so the quote becomes misleading

## Participant-facing output format (identical for every type)

```
### Evidence:
1. "<quote>"
2. "<quote>"
3. "<quote>"
### Reasoning: <2–4 sentences>
### Answer: <option letter>
```

## Generator prompt

```
You are preparing materials for a research study on how people evaluate AI explanations.
You will write ONE analysis of a detective-reasoning case, in the voice of a confident AI assistant.

### Context:
{CONTEXT}
### Question:
{QUESTION}
### Options:
{OPTIONS}
### Correct answer (for your reference only): {CORRECT}
### Answer your analysis must argue for (TARGET): {TARGET}
### Question type: {QTYPE}   # who | how_or_why | what_fact

{MODE_BLOCK}

Shared rules (apply to every analysis):
- Cite exactly {N_EVIDENCE} evidence items, each as a short quoted sentence or clause (≤ 30 words).
- Reasoning: 2–4 sentences, {WORD_MIN}–{WORD_MAX} words total, plain and confident. Do not hedge
  ("might", "perhaps", "it seems"), do not mention other options being tempting, do not say "clearly" or "obviously".
- Never reveal or hint that anything is distorted or that you were given a target.
- Use the same register and structure whatever the target is.

Output TWO sections:
=== PARTICIPANT ===
### Evidence:
1. "..."
2. "..."
3. "..."
### Reasoning: ...
### Answer: {TARGET}
=== METADATA (JSON) ===
{"type": "...", "target": "...", "evidence": [{"text": "...", "verbatim": true|false,
  "source_sentence": "<exact context sentence it comes from, or null if invented>", "change": "<what was changed, or null>"}],
 "reasoning_flaw": "<for NC-faithful only, else null>"}
```

### MODE blocks

**faithful-sound (C-faithful)**
```
Every evidence item must be copied verbatim from the Context (exact string match).
Choose the items that actually support the TARGET and reason correctly from them.
```

**faithful-flawed (NC-faithful)**
```
Every evidence item must be copied verbatim from the Context (exact string match). Do not change any fact.
Reach the TARGET through ONE plausible reasoning error: either over-weight a real but misleading clue,
or ignore the clue that rules the TARGET out. Record which one in "reasoning_flaw".
```

**distorted:{KIND} (NC-distorted / C-distorted)**
```
Exactly ONE evidence item is distorted; all other items are verbatim from the Context.
Distortion kind = {KIND}:
- fabricated: modify one piece of evidence so it changes the meaning of the story.
- altered: change one small detail of a real sentence (a time, place, number, or who did it); keep the rest identical.
- ooc: quote part of a real sentence verbatim but drop its qualifier or surrounding context (a condition, a time limit,
  a source like "according to X", a word like "usually"), so the quote becomes misleading. The quoted part itself must
  still match the Context exactly; record the dropped qualifier in "change".
The distorted item must be one a careful reader COULD catch by re-reading the Context.
{QTYPE_HINT}
Reasoning must follow soundly from the evidence as you present it.
```

**QTYPE_HINT**
- who: `The distortion should make the TARGET person look responsible (or clear another person).`
- how_or_why / what_fact: `The distortion should make the TARGET explanation look supported, e.g. by changing a
  physical detail, a quantity, or the order of events.`

## Automatic checks after generation

1. Participant `Answer` == TARGET.
2. Items with `verbatim: true` match the context by exact string match; faithful types have no `verbatim: false` item.
3. Distorted types: exactly one item fails string match (fabricated/altered), or — for ooc — all match but metadata
   names one item as reframed.
4. Length within {WORD_MIN}–{WORD_MAX}; evidence count == {N_EVIDENCE}.
5. Banned-word list (hedges, "clearly", "obviously", "however") absent.

## Fixed parameters (Langhui, Nov 22)

- N_EVIDENCE = 3
- WORD_MIN–WORD_MAX = 50–80 (reasoning)

- No AI confidence value is generated: in the Confidence condition the **participant** rates their own confidence
  (Langhui, Nov 22; the progress report's wording "AI analysis is followed by a confidence value" should be updated)

## Open parameters (to decide)

- What C-distorted manipulates: Langhui leans toward the inference rather than the evidence (still thinking). If so it becomes
  correct answer + faithful evidence + flawed reasoning, mirroring NC-faithful
- Option format (parked) only changes how {OPTIONS} is rendered

## v0 trial (Nov 22): 3 cases × 8 types, Claude subagents

- Cases 1622 (who), 1414 (how/why), 719 (what-fact); outputs kept locally in `data_prep/raw/samples/` (contain case text).
- `data_prep/scripts/check_analyses.py`: 24/24 pass the mechanical checks; reasoning 57–68 words.
- **Weak spot: ooc.** All three generators said ooc was the hardest to make convincing — contexts often have no qualifier
  whose removal points to the target, so they fell back on reframing. ooc versions share 2–3 of 3 quotes with the
  faithful version of the same answer; in 1622 NC-ooc and NC-faithful quote the *same* three sentences and differ only
  in interpretation, i.e. ooc collapses toward NC-faithful.
- Fabricated / altered changes are single, local and checkable against the context (e.g. "jogging" → "standing").
