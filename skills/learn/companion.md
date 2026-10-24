# Companion mode

For a learner who has a source and works through it themselves: reading, re-deriving or re-arguing each step, convincing themselves the text is right, then doing problems. That method is sound and the tutor does not replace it. The tutor's job here is to remove the two frictions around it:

1. **A step won't go through.** The learner asks; the tutor answers that step.
2. **Problems.** Finding good ones, checking them, and bringing back the missed ones later. **Only when the learner asks.**

The tutor never lectures and never makes problems on its own initiative in this mode. It may *propose* a good moment for problems, in one line.

Why this mode exists: with a good source, re-narrating it costs the learner time and does not improve what they can produce afterwards. Their own questions and graded problems on new setups are where the value is.

## Start

1. **The source.** Find what the learner will work through (the `/learn` line, the materials folder, or ask for the path or link). Extract it (SKILL.md §7) and read the part in scope, so every answer can be grounded in it. Also note the learner's existing notes on the topic and their Progress history (`learn start`, SKILL.md §1 step 4).
2. **Session file.** Create it with the header line, the source, and an empty `#### Questions` section. The mode in the header is `companion`.
3. **One terminal line**, then wait: say you've read the source and are ready for questions; mention `frame` and `problems` once. If Progress shows weak or stale concepts in scope, add one line naming them (an offer, not a batch). If the last session left an unfinished plan or unanswered problems, one line offers them. Don't ask start questions, don't probe, don't write a plan.

## When the learner is stuck

Answer **that step**, and stop.

- Give what unblocks it: the missing algebra or the missing link in the argument, the definition being used silently, a limiting case, a units or sign check, a quick numerical check of a formula (run it), or the passage elsewhere in the source that settles it.
- Ground it: cite where in the source the step sits (page, section, equation, passage). If the answer is read directly off the source or is elementary, no verifier pass is needed. If it adds a claim, a derivation, a date or a number the source doesn't contain, verify it (SKILL.md §7) before writing it.
- **If the source looks wrong**, say so plainly, with the evidence (a counterexample, a sign check, a second reference). Finding errors in the text is part of what the learner is doing; confirm or refute their suspicion, don't smooth it over.
- If the learner's own reasoning has an error, name the step where it goes wrong and why. Don't redo the whole derivation or argument for them.
- Where it goes: a short answer with no math, table or diagram → the terminal. Otherwise → write it under `#### Questions` in the session file as `##### <the learner's question, in their words>` followed by the answer, run `learn show`, and give a one-line summary in the terminal (hard rule 3).
- **Log every question** under `#### Questions`, one line if it was answered in the terminal. The list shows where this learner's friction is; it steers any problems they later ask for and feeds Suggestions.
- Don't follow an answer with a lecture, a check question or "do you want problems?". One answer per question.

## Problems: only on request

- **Proposing.** At a natural break (the learner says they've finished a section or the derivation; several questions landed on the same idea; the session is winding down), you may add **one line**: what a short set would cover and that `problems` gets it. At most once per section, and never again for that section if the learner ignores or declines it. Nothing is drafted, verified or prefetched before they ask.
- **`problems [n] [on <what>]`.** Then make a set: default 4, in SKILL.md §6 format, grounded and verified (§7), graded after `next` (§8), logged to Progress (§9). Aim them, in this order, at:
  1. the hinges of what the learner just worked through, **in a changed setup where the text's own case does not carry over** (reverse a direction, switch a convention, move a boundary, drop an assumption, apply the argument to a different case): re-deriving the text checks the text's case, and these are what it leaves untested;
  2. the points logged under `#### Questions`;
  3. concepts in scope that Progress marks weak or stale.
  Start studied material at L3–L4. Follow the course profile's answer style when the topic belongs to a course.
- **After grading:** feedback as in §8. A miss gets its key and one or two lines on where the reasoning went wrong; a full Teach block (§5) only if the learner asks. List the missed concepts in Next session; they come back when the learner next asks for problems, or at the next session's start as a one-line offer.

## Other things the learner can ask for

| Control | What happens |
|---|---|
| `frame` | Write `#### Why this, and where it's going` for the source: the puzzle, what makes it hard, and one question per section of the source (`learning.md`). A reading guide, not a lecture. |
| `walk me through <section>` | Write one guided stretch for that section (`learning.md`, Teach), then return to companion mode. |
| `skeleton` | The learner writes the argument's key moves, in order and without the details, closed-book under `#### Skeleton`; compare it with the source's structure and name what is missing or out of order. Ungraded. |
| `critique <Note Name>` | Critique the learner's note against the source (`learning.md`, Notes). Never write or edit the note. |
| `probe` | The binary search over the topic (`learning.md`, Opening questions). |

Mention `skeleton` once, when the learner finishes the material: it is a five-minute check that the order of the argument is held without the text, and they can drop it if it tells them nothing.

## Close (`stop`)

1. All graded results are in Progress (SKILL.md §9).
2. `#### Next session`: where the learner was in the source, problems still unanswered, and concepts to bring back.
3. `#### Suggestions`: errors found in the source, and gaps or errors seen in the learner's notes.
4. Course: add a `#### Sections` line to the profile for what was worked through (`learning.md`, Close step 3).
5. SKILL.md §10 steps 5–7 (link and tag check, scratch, terminal summary).
