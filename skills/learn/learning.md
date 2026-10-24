# Guided mode

The goal is **understanding**, not exam points: every result in scope follows from a few foundations the learner already accepts, and is connected into one picture. Two learners can give the same answers to the same questions, but one holds a pile of separate facts while the other holds a few core truths from which those facts follow. That connection *is* understanding, and it is what makes knowledge last. Aim for **the click**: the moment a pile of facts collapses into a few ideas that generate them.

Guided mode replaces a textbook: the tutor leads the learner through the material as a continuous, motivated argument, and the learner stays active at the few steps that matter. The learner keeps what they learn as **notes they write themselves**. Writing the note, and choosing what connects to what, is part of the learning, so you never write it for them.

The two principles are adapted from amosblomqvist/learn (`skills/teach/SKILL.md`). Its per-node quiz loop is replaced by the stretch loop below: in a file-based session each check costs minutes, not seconds, and stopping at every step breaks up the argument the learner is trying to see whole.

## Two principles (apply to every stretch)

**i. Unconditional truths first.** Start each strand from facts the learner can accept at face value, with no caveats: a real definition (not a list of properties dressed up as one), a universal statement ("every rigid motion preserves distances"), or a fact the sources agree on ("the Estates-General had not met since 1614"). These lock in at once, because nothing more basic will contradict them. If a fact needs "usually" or conditions, it isn't one yet: dig down, or state the model or claim with the conditions under which it holds (SKILL.md §5). Say "unconditional truth", and reserve "axiom" for facts that follow from nothing else.

**ii. "How could I have discovered this?"** Facts feel arbitrary when there's no visible reason they had to be this way, and arbitrary facts don't stick. Walk the learner through how they could have found the result themselves, and motivate every step: why are we doing this at all, why try this formula, why manipulate the equation this way, why did this event make the next one likely. Nothing appears from nowhere (3Blue1Brown is the model). This adds the edges of the graph.

## Start

1. **Scope and goal.**
   - **Course:** ask which chapters or sections (`AskUserQuestion`), suggesting the next ones in the materials' order after the profile's `#### Sections`. If the profile doesn't exist, create it with `#### Exams` (from the learner, may be empty), `#### Terminology`, `#### Answer style` and `#### Sections`; no topic table or inventory (that's exam prep).
   - **Topic:** ask what the learner wants out of it (the conceptual story / the key result or argument / a specific paper or text / background for a project) and the time budget, with `AskUserQuestion`. Interrogate a vague goal until it's concrete: "understand X" can mean ten different lessons.
   - **Always ask what they want to be able to do afterwards** (multi-select): *explain* it, *derive* or argue it, *compute* or apply it, *choose* between models, methods or interpretations. This sets the consolidation mix (below), so the skill needs no rules per subject.
2. **Sources.** Course: the textbook or reading sections in scope (extract them, SKILL.md §7), the lecture slides or notes for them, and the course's homework for setups and notation. Topic: whatever is in its materials folder; otherwise textbooks, papers and reputable references found on the web (WebSearch, WebFetch; the verifier can search too), preferring primary and well-established sources. Also read the learner's notes on the concepts in scope (knowledge signals, SKILL.md §2).
3. **Map the subject before planning.** From the sources, list the section's results and what each one rests on. This is where the real unconditional truths come from, so you don't plan around a half-remembered version.

## Opening questions (instead of a probe)

One short set, **3–4 conceptual questions, ungraded**, written under `#### Opening questions`. They give you context and prime the learner for the key ideas (prequestions help mostly for what they ask about, so aim them at the hinges of the material). Ask things like: what assumptions would you expect this to need? What should the answer depend on? What would go wrong without X? What do you already know that looks related? No calculations, no confidence boxes, no Progress lines, no verifier beyond checking the questions have defensible answers. Where no math is needed, ask them with `AskUserQuestion` instead (seconds, not minutes) and copy the answers into the file.

- **Don't correct the opening answers.** Acknowledge them in one terminal line at most. Every wrong belief they expose must be met later by a **pause point** in a stretch that resolves it (the learner confronts it with their own work; a correction that is only stated in the text gets read passively and never checked), and again by a consolidation question. Send the learner back to their own opening answer when the stretch settles it.
- Include one question asking what the learner thinks the central object *is* ("in your own words, what is X and where does it come from?"): it surfaces misconceptions that goal questions miss.
- At a later session on the same material, open instead with **2–3 graded retrieval questions** on last session's stretches (SKILL.md §6; these do go to Progress), including retests of last session's misses.
- If the opening answers show the learner already holds the material, offer to skip to consolidation.
- Don't run SKILL.md §3's binary search here. Prerequisites are not probed up front: they are handled inline (Recall boxes) and by the dial.
- **`probe` (control, or a word in the `/learn` line): the one case for the search.** When the learner wants to know where they stand before deciding what to study (e.g. "I took statistics two years ago and a course that leans on it starts next week: what do I need to review?"), run SKILL.md §3 over the topic's strands, graded and logged, and end with a short list of what is solid, what is rusty and what is missing, each rusty or missing item being a candidate `/learn` session. No plan or stretches follow unless the learner asks.

## Plan: the dependency graph, cut into stretches

Write the plan (SKILL.md §4) as a dependency graph:
- **Roots:** the unconditional truths. **Sink:** the goal (the section's main result, or the learner's goal).
- Each derived node hangs off exactly what it depends on.
- **Keep it small:** about 8–12 nodes, at most about 4 roots, short labels. Facts the learner already holds and that need no teaching stay off the graph, or are merged into one `known` node. A map, not the territory.
- **Stress-test the roots before showing it:** for each root, write (privately) the one-line reason it needs no derivation. If it follows from a simpler fact in a step or two (e.g. a velocity formula that comes from differentiating a position formula), it's a derived node: push it down. A wrong root corrupts everything built on it.
- **Labels don't answer pause points.** The learner sees the plan and the frame before the lesson, so a label or sentence there that states exactly what a Predict will ask ("rank + nullity = number of columns", when Stretch 3 asks the learner to find that pattern) gives it away. Either name the topic ("counting pivot and free columns") or aim the pause point at the how and why. Use plain words the learner already has.
- Below the graph, cut it into **stretches**: 3–6 for a typical section, each a checkbox `- [ ] Stretch 2 · <title> (<payoff kind>)`, each covering a connected run of nodes and ending in something the learner can newly do. Then `- [ ] Consolidation` and one `- [ ] write: <Note Name>` per note (use existing note names where they fit, so the learner extends a note rather than duplicating it). Add one italic line under the list saying what these are: stretches are read-and-respond, Consolidation is the graded part, `write:` lines are notes the learner writes afterwards.
- Color nodes by state: `classDef known fill:#10291f,stroke:#72e0a8,color:#e6fff1` (covered by a finished stretch whose pause points landed, or shown by a graded answer, SKILL.md hard rule 7) and `classDef todo fill:#0e1a26,stroke:#37495b,color:#9fb2c4`. Redraw it at close (in place, SKILL.md §4).
- Above the graph, two or three sentences on the approach.

Wait for the learner's OK (`##### Approve`, SKILL.md §4) before teaching. The plan and the opening questions can go out in the same turn. A wrong root or scope is cheap to fix now.

## Why this, and where it's going (before Stretch 1)

A plan lists topics; it doesn't make a first stretch feel like part of something. So before Stretch 1 (in the same turn), write `#### Why this, and where it's going`: a **motivating frame, not a layout**. Without it the first stretch doesn't fit in anywhere; a table of contents with the results filled in spoils the discovery instead.

One rule covers every subject: **state the thing to be explained; withhold the explanation.**

1. **The puzzle.** The thing to be explained, stated concretely: a measured phenomenon (physics, engineering), a pattern in examples or a problem nobody can yet solve (math), data, a trend or an anomaly (chemistry, economics), a function the system must perform, with its inputs and outputs (biology, computing), an outcome that needs explaining (history, the social sciences), a passage that resists the obvious reading (literature, philosophy). The learner should be able to see it and not yet account for it. If finding the pattern is itself a planned Predict, give only the examples.
2. **What makes it hard.** What the learner has to work with, and the gap between that and the puzzle.
3. **The route, as questions.** One question per stretch, the question that stretch answers ("how do you solve an equation whose unknown is inside an integral, and why does it have more than one answer?"), never the answer ("the equation becomes a Fourier series"). For a system with many parts, a low-resolution map of the stages and what each accomplishes is fine; the mechanism is not.

- Ground it like any teaching text (SKILL.md §7).
- Every stretch opens with a **`**Where we are.**`** line: which route question this is, what is already in hand, what this stretch adds. Every stretch's last fold answers its route question in a sentence, so the whole picture accumulates as the learner goes.

## A stretch is defined by its payoff

Every stretch opens with a question and ends when the learner can do something new. Classify each stretch by what it delivers, not by the subject: any course is a mix of these.

| The stretch ends in… | Shape | Typical pause points |
|---|---|---|
| a **result** (a formula, a derivation, a causal explanation) | question → motivated steps → result → check by an independent route | Predict the next move; Explain why a step is allowed |
| a **definition**, framework or postulate | 2–3 concrete instances first → what they share (or the experiment, failure or case that forces it) → the definition, as a model with its conditions → non-examples → a canonical example worked in the new language | Predict what the instances share; Do: build an example and a non-example |
| a **theorem** or general claim | examples suggest a pattern → state it → the proof's or argument's strategy in one line → the proof → use it on a concrete case | Predict the statement; Explain a line from earlier lines; "drop this condition: what breaks?" |
| a **method** | why it works → fully worked example → example with gaps → the learner's own | Do the next step; choose which method applies |
| an **interpretation** or position | the evidence or text → the competing readings → what each predicts or explains → which the sources favor, and why it is contested if it is | Predict what a reading implies; Explain which evidence decides between two readings |

Instances come before abstraction (principle ii applied to definitions). A postulate that can't be derived is stated as a model and motivated by what forces it. A long proof is split into lemmas, one stretch each, with the overall strategy stated first.

## Teach: one stretch per turn

Write the stretch as **one continuous, textbook-style piece** under `#### Stretch <n> · <title>`: narrated, every step motivated, each step with its check by an independent route. Ground it and run one verifier pass on the whole stretch before writing (SKILL.md §7), pause-point answers included.

- **Opening lines:** one italic sentence with the question this stretch answers, then `**Where we are.**` (see Why this, and where it's going).
- **Recall boxes.** A prerequisite appears where it is used, as a short `> [!formula] Recall · <Concept>` callout: the fact in one or two lines, the learner's note that holds it (plain text, by name), and nothing more. No detours, no questions on it.
- **Figures.** Where geometry or structure carries the idea, add one figure: a PNG in the sessions folder named like the session, embedded with Markdown image syntax, or Mermaid for structure.
- **Terms.** A term the learner hasn't shown they own (in opening answers or notes) gets a one-line gloss at first use.
- **Pause points: 2–4 per stretch plus the closing bridge, only at the hinges** (the steps where the argument turns; never every step, which lowers the benefit). Three types:
  - `##### Predict` before a hinge: what's the next move, what should the theorem say, what will this case do, what condition are we still missing?
  - `##### Explain` after a hinge: why is this step allowed, what does this assumption buy, what breaks without it?
  - `##### Do`: carry out this step, or build an example, yourself. Where a quick check exists, tell the learner to check their answer before unfolding (it becomes a habit that catches later slips).

  Rules, each from a failure seen in testing:
  - **Where they go:** at every belief the opening answers got wrong, and at the payoff of the stretch (the passage that answers its opening question must not be pure reading). **End each stretch with a bridge**: a Do or Predict that uses the payoff in a changed setup where the tools so far *fall just short*, so the learner runs into the next stretch's route question by their own work (the theorem's converse, the case the method can't handle, the regime where the model disagrees with the data, the case the explanation doesn't cover, the step the system still lacks). Its fold says what went wrong and that the next stretch takes it up. The next stretch then opens from the learner's own attempt. Where no honest bridge exists (a parallel topic, or the last stretch), end with a plain transfer Do instead. Either way the graded part is never the first place a new trap appears.
  - **The prompt is an open ask.** Don't hand over the structure of the answer ("which point do they all contain?") or say where to look; hints belong inside the fold. One italic ask; if it has parts, list them as bold lettered subparts in the prompt, then repeat the bare labels (`**(a)**`) on their own lines below as answer slots, each followed by an empty line.
  - **Everything after the first pause point is folded.** Each pause point is followed by a collapsed callout, `> [!reveal]- Continue` after a Predict or Do, `> [!reveal]- Compare` after an Explain, that holds the answer **and all teaching text up to the next pause point**. The last fold of the stretch also holds Connect and What to take away. Only headings, pause prompts and the Questions area stay visible, so nothing below an unanswered prompt can give its answer away. The learner writes, unfolds, and reads on at their own pace: no tutor round trip inside a stretch. (In an editor without callouts the folds show as open quote blocks; tell the learner once to answer each prompt before reading on.)
  - **Self-contained.** The prompt restates, in a phrase or with the equation itself, any symbol or result it depends on that was introduced inside a fold. A symbol defined once at the end of a long fold ("with constants $a$, $b$") is easy to miss, and the learner then meets a question about something they never registered.
  - **Answerable from what's unfolded.** A pause point may ask only for what the learner can reach from the text above it plus what they know. An Explain about something the text never showed (why a quantity is *absent*, when the text never showed where it would have appeared) cannot be answered; show the thing first, then ask.
  - Pause points must discriminate (SKILL.md §6): choose the case where the likely wrong belief gives a different answer than the right idea.
- **Close of the stretch** (inside the last fold): `**Connect.**` (rests on / makes possible; say so when several facts now follow from one idea: that's the click), then `**What to take away**` (the few generating ideas, one line each). After the fold, visible: `##### Questions` with empty lines, where the learner may write anything that lost them.
- After writing: `learn show "<session file>" "Stretch <n>"`, tell the learner in one line, launch the prefetch for the next stretch, end the turn.

**After `next`:** read the pause-point answers and questions from the file. Reply in one `> [!feedback] Stretch <n>` callout below the stretch (expanded, no `-`: a folded one gets scrolled past): for each pause point, one or two lines against what the step requires; answer every question (grounded). Nothing here is graded or logged. Tick the stretch's plan checkbox, then write the next stretch in the same turn.

**The dial: one adjustment instead of cases.** Each stretch sits somewhere between "tutor narrates everything" and "learner does everything".
- Pause points landed → hand over more in the next stretch (more Predict and Do, bigger gaps; for a method, move quickly to the learner doing a whole problem).
- Pause points missed, or the learner wrote "lost me" → narrate more, shorter steps, add Recall boxes.
- **A miss never blocks.** Note it in the feedback and continue. Only if the same prerequisite sinks pause points in two stretches running, offer a short detour stretch on it (`AskUserQuestion`); the learner decides.
- `narrate` / `let me try` move the dial by hand.

**Prefetch:** while the learner reads stretch k, the background agent drafts and verifies stretch k+1 (SKILL.md §7). Adjust its pause points to the dial after reading k's answers.

## Consolidation: the graded part

After the last stretch (or at a natural midpoint of a long plan), write `#### Consolidation`: a set of graded questions in SKILL.md §6 format, verified (§7), graded (§8) and logged to Progress (§9). This is where retrieval happens, after the learner has seen the whole picture. Size it to the material, typically 4–6 questions, mixed by the learner's goal:

| Goal | Questions |
|---|---|
| explain | conceptual questions, limiting cases, "what changes if…" |
| derive or argue | re-derive or reconstruct a hinge from memory (L3), a modified setup (L4) |
| compute or apply | several full problems, interleaved so the learner must choose the method |
| choose | cases where the learner picks a model, method or reading and defends it, graded against stated criteria |

- **Cover what the session found.** At least one question for each goal the learner picked (an "explain" goal needs a question answered in words), and one for each wrong belief from the opening answers. Don't repeat a pause point or a worked case nearly word for word; a consolidation question should need the idea in a setup the stretches didn't show.
- Open the section with one line saying what "graded" means here: results go to the learner's Progress record and set what gets reviewed; the header chips are the level and the source.
- **Proofs and arguments are graded against required steps, not a single key.** List the logical steps any valid proof or argument needs (verified), and check the learner's for gaps against that list. In a proof-based course, always include one proof the learner writes.
- A miss here gets SKILL.md §5's treatment by kind (slip, gap, misconception) and a retest at the next session's opening.

## Notes

When a note's stretches are done (often right after consolidation), prompt for it in the file:

~~~markdown
#### Write · <Note Name>
*Write `<Note Name>.md` from memory: the definition, the derivation or argument in your own order, and where it connects. Then type next.*
~~~

- The learner writes it, in their own notes and in their own words, following the workspace's conventions if it has any. Never create the file, write text for them to paste, or edit it.
- **Where the note lives is the learner's choice.** If they keep no notes in the workspace (paper, another app), they write the note directly under the `#### Write` heading in the session file, or write it elsewhere and paste it there. The prompt is never skipped: writing it from memory is the point.
- After `next`, read the note and critique it in `> [!feedback]- Note · <Note Name>`, against the sources. Check: errors (with the source); missing nodes or edges from the graph; every implication ("so", "hence", "therefore", $\Rightarrow$) has its reason; definitions come after what they depend on; terms and symbols are defined before use; the workspace's conventions. Don't supply the missing text; name what's missing and where it fits. The learner fixes it.
- Teaching continues while the learner fixes it. Tick `write: <Note Name>` once the note has no errors left (smaller points may remain); re-read it at the next turn after the learner says it's fixed.
- The learner can `defer`: then list it under `#### Notes to write` in the session file. The next session critiques it first (SKILL.md §1 step 5).

## Close (guided)

1. **Connections.** One `##### Connect` prompt: ask the learner to explain how two or three pairs of nodes relate, at least one pair reaching back to an earlier section or note. Critique in `> [!feedback]- Connect`. Choosing the connections is the learner's work: you may suggest which pairs to explain, never the links themselves. **The Connect prompt is its own turn and is not optional:** write it (it may share a turn with the last note critique), end the turn, and critique the answer after `next`. Only then run steps 2–5. Don't close in the same turn as the prompt; the session closes early only on `stop`, and then the prompt stays open for next session (step 3).
2. Redraw the graph in place under `#### Plan` (known / todo) and tick the plan.
3. Course: add one line per section covered to the profile's `#### Sections` (create the heading if the profile lacks it): `- <book or source> §<n> <title> · <YYYY-MM-DD> · notes: <Note Name>, …`, marking each note `(to write)` or `(fix pending)` until it's done. If the learner stopped before consolidation or the Connect prompt, leave it open for next session and say so in Next session.
4. Write `#### Notes to write` (anything deferred) before Next session.
5. Terminal headline: the stretches covered, whether consolidation was done, the notes written or still to write, and where the next session starts.
