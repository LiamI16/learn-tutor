# Learning mode

The goal is **understanding**, not exam points: every result in scope follows from a few foundations the learner already accepts, and is connected into one picture. Two learners can give the same answers to the same questions, but one holds a pile of separate facts while the other holds a few core truths from which those facts follow. That connection *is* understanding, and it is what makes knowledge last. Aim for **the click**: the moment a pile of facts collapses into a few ideas that generate them.

The learner keeps what they learn as **notes they write themselves**. Writing the note, and choosing what connects to what, is part of the learning, so you never write it for them.

Adapted from amosblomqvist/learn (`skills/teach/SKILL.md`), with grounding, the Progress record and notes added.

## Two principles (apply to every teaching step)

**i. Unconditional truths first.** Start each strand from facts the learner can accept at face value, with no caveats: a real definition (not a list of properties dressed up as one), a universal statement ("every rigid motion preserves distances"), or a fact the sources agree on ("the Estates-General had not met since 1614"). These lock in at once, because nothing more basic will contradict them. If a fact needs "usually" or conditions, it isn't one yet: dig down, or state the model or claim with the conditions under which it holds (SKILL.md §5). Say "unconditional truth", and reserve "axiom" for facts that follow from nothing else.

**ii. "How could I have discovered this?"** Facts feel arbitrary when there's no visible reason they had to be this way, and arbitrary facts don't stick. Walk the learner through how they could have found the result themselves, and motivate every step: why are we doing this at all, why try this formula, why manipulate the equation this way, why did this event make the next one likely. Nothing appears from nowhere (3Blue1Brown is the model). This adds the edges of the graph.

**Socratic or narrated, per step.** Default to letting the learner attempt the discovery first (`##### Try`) when they can plausibly reason their way there. Narrate it when the step is beyond reach from cold, or when the learner is low on energy or asks (`narrate`). The learner can switch with `narrate` / `let me try` at any time.

## Start

1. **Scope.**
   - **Course:** ask which chapters or sections (`AskUserQuestion`), suggesting the next ones in the materials' order after the profile's `#### Sections` (what earlier learning sessions covered). If the profile doesn't exist, create it with `#### Exams` (from the learner, may be empty), `#### Terminology`, `#### Answer style` and `#### Sections`; no topic table or inventory (that's exam prep).
   - **Topic:** ask preference questions (no right answer) with `AskUserQuestion`: what the learner wants out of it (the conceptual story / derive or argue the key result / read a specific paper or text / background for a project), depth, and time budget. Interrogate a vague goal until it's concrete: "understand X" can mean ten different lessons.
2. **Sources.** Course: the textbook or reading sections in scope (extract them, SKILL.md §7), the lecture slides or notes for them, and the course's homework for setups and notation. Topic: whatever is in its materials folder; otherwise textbooks, papers and reputable references found on the web (WebSearch, WebFetch; the verifier can search too), preferring primary and well-established sources. Also read the learner's notes on the concepts in scope (knowledge signals, SKILL.md §2).
3. **Map the subject before planning.** From the sources, list the section's results and what each one rests on. This is where the real unconditional truths come from, so you don't plan around a half-remembered version.

## Probe

Short: one batch, two at most (SKILL.md §3). The plan doesn't exist yet, so take the strands from the subject map (Start step 3): the prerequisites the sections in scope rest on. Bracket each one (a floor and a ceiling) and skip strands that Progress already brackets. The two-batch cap wins over bracketing: a strand still without a ceiling gets one later from the checks. Questions here can be any size the concept needs: there is no exam-size limit, and derivations and explanations (L3) count as evidence.

## Plan: the dependency graph

Write the plan (SKILL.md §4) as a dependency graph:
- **Roots:** the unconditional truths. **Sink:** the goal (the section's main result, or the learner's goal).
- Each derived node hangs off exactly what it depends on. The graph is the teaching order.
- **Keep it small:** about 8–12 nodes, at most about 4 roots, short labels. Facts the learner already holds and that need no teaching stay off the graph, or are merged into one `known` node. A map, not the territory.
- **Stress-test the roots before showing it:** for each root, write (privately) the one-line reason it needs no derivation. If it follows from a simpler fact in a step or two (e.g. a velocity formula that comes from differentiating a position formula), it's a derived node: push it down and teach it. A wrong root corrupts everything built on it.
- Group the nodes into **notes**: each cluster that will become one note gets a plan checkbox `- [ ] write: <Note Name>`. Use existing note names where they fit (so the learner extends a note rather than duplicating it).
- Color nodes by state: `classDef known fill:#10291f,stroke:#72e0a8,color:#e6fff1` (shown by a direct answer: a graded question on it, or a correct answer whose work visibly applies it, SKILL.md hard rule 7) and `classDef todo fill:#0e1a26,stroke:#37495b,color:#9fb2c4` (to teach). Redraw it at close (in place, SKILL.md §4).
- Above the graph, two or three sentences on the approach: what we'll cover, in what order, and why, given where the learner's edge is.

Wait for the learner's OK (`##### Approve`, SKILL.md §4) before teaching. A wrong root or scope is cheap to fix now. A root confirmed by an explain-back goes green too.

## Teach: one node per turn

For **every node**, foundations included, write one `#### Teach · <node>` block (SKILL.md §5 format) and run:

1. **Motivate.** What problem sends us here, or what gap this node closes. Applies to unconditional truths too: why *this* truth, *now*.
2. **Establish.**
   - A root: state it plainly, at face value. Briefly check it reads as obviously true to the learner (an explain-back or one L1 question); if it doesn't, fix the foundation before building on it.
   - A derived node, Socratic: before the attempt, write only the italic motivating line and the `##### Try` (prompt in italics, then empty lines); anything more would give it away. The learner attempts it and types `next`. Critique the attempt in `> [!feedback]- Try · <node>`, then complete **only what the attempt lacks**, motivating each step: a correct attempt needs no re-derivation, just the missing motivation, checks or counterexample. Then Connect, What to take away and the checks. An attempt is a pretest, not evidence: it isn't graded into Progress (but a correct one can turn the node green, hard rule 7).
   - A derived node, narrated: the motivated derivation or argument, every step with its "why this move".
3. **Connect.** In the block's `**Connect.**` line (SKILL.md §5): which earlier nodes this one rests on, and what it makes possible next. When several facts now follow from one idea, say so: that's the click.
4. **Check.** 1–2 graded questions (SKILL.md §6) that confirm the node landed, ideally at L3–L4 (derive or argue it again in a modified setup, find the edge case). Log them to Progress. A miss means the node isn't solid: fix it (SKILL.md §5, by kind of miss) before building on it.

Write the teach block and its `Try` or check in one turn; the next node comes after `next`. Ground every block before writing it (SKILL.md §7), derivation steps included. **Prefetch:** while the learner works on node k, the background agent drafts and verifies node k+1 (it rarely depends on k's answers; discard it if k's check shows a broken foundation). Retest a high-confidence miss after the next node, and again next session.

## Notes

When a note's cluster of nodes is done, prompt for it in the file:

~~~markdown
#### Write · <Note Name>
*Write `<Note Name>.md` from memory: the definition, the derivation or argument in your own order, and where it connects. Then type next.*
~~~

- The learner writes it, in their own notes and in their own words, following the workspace's conventions if it has any. Never create the file, write text for them to paste, or edit it.
- **Where the note lives is the learner's choice.** If they keep no notes in the workspace (paper, another app), they write the note directly under the `#### Write` heading in the session file, or write it elsewhere and paste it there. The prompt is never skipped: writing it from memory is the point.
- After `next`, read the note and critique it in `> [!feedback]- Note · <Note Name>`, against the sources. Check: errors (with the source); missing nodes or edges from the graph; every implication ("so", "hence", "therefore", $\Rightarrow$) has its reason; definitions come after what they depend on; terms and symbols are defined before use; the workspace's conventions. Don't supply the missing text; name what's missing and where it fits. The learner fixes it.
- Teaching continues while the learner fixes it. Tick `write: <Note Name>` once the note has no errors left (smaller points may remain); re-read it at the next turn after the learner says it's fixed.
- The learner can `defer`: then list it under `#### Notes to write` in the session file. The next session critiques it first (SKILL.md §1 step 5).

## Close (learning)

1. **Connections.** One `##### Connect` prompt: ask the learner to explain how two or three pairs of nodes relate, at least one pair reaching back to an earlier section or note. Critique in `> [!feedback]- Connect`. Choosing the connections is the learner's work: you may suggest which pairs to explain, never the links themselves.
2. Redraw the graph in place under `#### Plan` (known / todo) and tick the plan.
3. Course: add one line per section covered to the profile's `#### Sections` (create the heading if the profile lacks it): `- <book or source> §<n> <title> · <YYYY-MM-DD> · notes: <Note Name>, …`, marking each note `(to write)` or `(fix pending)` until it's done. If the learner stopped before the Connect prompt, leave it open for next session.
4. Write `#### Notes to write` (anything deferred) before Next session.
5. Terminal headline: the sections covered, the notes written or still to write, and where the next session starts.
