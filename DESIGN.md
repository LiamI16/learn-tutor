# Design

How the `/learn` tutor works and why it is built this way. The behavior itself lives in `skills/learn/`: `SKILL.md` (shared core), `learning.md` and `exam.md` (the two modes). Those files are the source of truth; this document explains them.

## Philosophy

The tutor exists to find exactly where the learner's knowledge stops (the *frontier*) and push it outward. It rests on five principles:

1. **Notes record what you encountered. The tutor records what you can produce.** A note shows you've seen something, not that you know it. Only answered questions count as knowing.
2. **Retrieval is the learning event.** Notes and materials are reference. Learning happens when you produce an answer and get feedback.
3. **Grounded answers.** Every graded question has a worked answer and a cited source before you see it, and checkable questions are verified blind by a second agent. Wrong answers from a tutor get learned, so the tutor has to earn trust.
4. **Understanding over memorizing.** Connected knowledge lasts; separate facts fade. Learning mode builds each subject from *unconditional truths* (facts you can accept with no caveats) and walks every result as "how could I have discovered this?", so the facts follow from a few ideas instead of being memorized.
5. **Two layers, never mixed.** Your notes are knowledge. `Sessions/` is data about you. The tutor never edits notes and never links the two; it connects them only by matching concept names.

One test decides what the tutor may do for the learner: does it replace effort that builds understanding, or only the friction around it? Friction (finding the page, formatting, bookkeeping, scheduling a retest) is removed freely. Writing the explanation, choosing what connects to what, and finding your own mistakes are the learning, so the tutor never does them.

It is deliberately small: one skill (a shared core plus one file per mode), one verifier, a small bookkeeping script, and plain Markdown files. Modeled on [amosblomqvist/learn](https://github.com/amosblomqvist/learn).

## How a session runs

1. **Start.** `learn.py start` reports whether the name is a course or a topic, the next exam, what was covered, any unfinished plan, and what's weak or stale.
2. **Review offer.** Weak or stale concepts, confident misses first.
3. **Probe.** A binary search for the frontier (below).
4. **Plan.** A Mermaid map plus checkboxes, approved before teaching.
5. **Teach.** For each step: motivate → establish → connect → check, with an explain-back ("why does this step follow?").
6. **Close.** A redrawn map, a *Next session* note, and *Suggestions* for the learner's notes.

Results are appended to `Progress.md` after every graded batch, so stopping early loses nothing. While the learner answers, a background agent drafts and verifies the next items that don't depend on those answers, so there is little waiting after `next`.

### Finding the frontier

Each concept starts on a ladder: *unseen* → *aware* → *studied* → *tested*, from the learner's notes, what they say they've covered, and Progress. Questions have five levels: L1 recall, L2 apply, L3 explain (derive or justify), L4 extend (edge cases, modified setups), L5 transfer.

The probe is a **binary search in batches**: each batch is one bisection step for every strand at once.
- **Over difficulty:** a correct answer jumps up a level, a miss drops down. 2–3 rounds find the edge. The edge counts as found only when bracketed: something right below it, something missed above it.
- **Over the map:** downstream concepts are tested first. A correct answer skips that concept's prerequisites. A miss sends the next round down to them, to find which link broke.
- **Inferred ≠ shown:** a skipped prerequisite steers the search but never counts as evidence.

Each miss is classified and taught accordingly:
- **Slip:** knew it, executed wrong. Just retest.
- **Gap:** never learned it. A worked example if it's far past the frontier, an attempt first if it's near.
- **Misconception:** believed something false. Refutation first: state the belief, show what it predicts, show what contradicts it.

### Learning mode

The tutor maps the sections in scope, probes briefly where they rest on earlier material, then shows a small dependency graph (about 8–12 nodes, a few stress-tested roots): unconditional truths at the top, the main result at the bottom, grouped into the notes the learner will write. Teaching goes one node per turn. When a note's nodes are done, the learner writes that note from memory; the tutor critiques it against the sources (errors, missing steps, unjustified implications) but never writes or edits it. The session ends with a *Connect* prompt where the learner explains how the new material links to earlier sections.

### Exam prep

The first session for an exam **calibrates**: date, scope, format, and how much comes from practical work. Every file in the course's materials is read in full (one subagent per file) and every problem listed, checked mechanically (page counts, problem numbering), and saved as a **problem inventory** in the course profile. Topic weights are computed from it by source: exams ×2, homework ×1.5, worksheets ×1. Procedural handouts aren't counted, because a long manual says nothing about the exam. Question size and target levels come from the most exam-like items.

Batches go **breadth before depth**: untested high-weight topics first, at most two retests per batch. Retests come two batches after a miss, which lets them be prepared in advance and helps a correction stick. Each session ends with a **readiness review** written the way a tutor would rather than computed: each topic is *ready*, *shaky*, *not ready* or *untested*, with one line of evidence, plus an estimated score range. (A computed coverage percentage was tried first and dropped: its all-or-nothing rules reported 3% after a 66% mock exam.)

### Progress.md

One line per graded question, exactly 7 fields:

```
- 2026-10-14 · Debye Model · partial · med · PHYS 141A · L3: missed the ω_d link · 2026-10-14 PHYS 141A Ch2-4
```

`date · concept · result · confidence · context · note · session`

Review status (decides what a session offers to review; exam readiness is separate):
- **Weak:** the latest session's *first* attempt on the concept was a miss.
- **Stale:** untested for 14 days, or ~30% of the time left until a known exam date.
- **Graduated:** first attempt correct in 3 sessions. It leaves the review list but still appears in mixed batches.

Evidence is shared by concept name, so something learned in a topic session counts toward a course that lists it.

## Grounding

Before a batch is shown:
1. The tutor works out each answer from a source (textbook section, homework, paper).
2. The verifier gets **only the questions** and solves them independently. A disagreement means the question gets fixed or dropped before the learner sees it. It also flags questions where the likely wrong method gives the same answer, compound asks, and hints that give the answer away. It never opens `Held Out/`.
3. After grading, the key and citation are revealed so the learner can check them.

The verifier is a Claude Code subagent (`agents/verifier.md`) with read, search, shell and web tools. It starts with a fresh context, which is what makes the check blind.

## Research basis

| Technique | Evidence | Source |
|---|---|---|
| Retrieval practice | High utility | Dunlosky et al. 2013; Roediger & Karpicke 2006 |
| Spacing | High utility; the best gap is ~20–40% of the time until the test | [Cepeda et al. 2008](https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf) |
| Successive relearning | >10% higher exam scores on practiced concepts | [Rawson, Dunlosky & Sciartelli 2013](https://link.springer.com/article/10.1007/s10648-013-9240-4) |
| Short answer > multiple choice | Most reliable retention with feedback | [Kang, McDermott & Roediger 2007](https://www.researchgate.net/publication/224943432_Test_format_and_corrective_feedback_modify_the_effect_of_testing_on_long-term_retention) |
| Pretesting | Trying before study helps, even when wrong | [Richland, Kornell & Kao 2009](https://pubmed.ncbi.nlm.nih.gov/19751074/) |
| Hypercorrection | Confident errors are corrected best, but can return unless retested | [Butterfield & Metcalfe 2001](https://www.researchgate.net/publication/11641193_Errors_Committed_With_High_Confidence_Are_Hypercorrected); [Butler, Fazio & Marsh 2011](https://link.springer.com/article/10.3758/s13423-011-0173-y) |
| Interleaving | g = 0.42, mainly for confusable concepts | [Brunmair & Richter 2019](https://www.semanticscholar.org/paper/Similarity-matters:-A-meta-analysis-of-interleaved-Brunmair-Richter/bb5392e8eaf53a38cc0d147f301cce74cecb4436) |
| Self-explanation | g = 0.55 | [Bisra et al. 2018](https://link.springer.com/article/10.1007/s10648-018-9434-x) |
| Productive failure | Problem first helps conceptual learning, g = 0.36 | [Sinha & Kapur 2021](https://journals.sagepub.com/doi/10.3102/00346543211019105) |
| Expertise reversal | Worked examples help novices, and the benefit fades with expertise | Kalyuga et al. 2003 |
| Retrieval vs. concept mapping | Retrieval produced more learning | [Karpicke & Blunt 2011](https://www.science.org/doi/10.1126/science.1199327) |
| Learning wrong information | Wrong multiple-choice options can be learned as facts | Roediger & Marsh 2005 |
| Perceived difficulty | Interleaving and spacing feel less effective than they are | Kornell & Bjork 2008 |

Sources without links are cited from memory and still need checking.

**Limits:**
- Most of this evidence is about facts and text. The evidence for derivations and long arguments is more indirect.
- Blind verification can't catch a mistake that both solvers make.
- The tutor grades its own questions and may be lenient. If that shows up, add a separate grader.
- The tool was developed on STEM courses. The method is subject-neutral, but open-ended subjects (essays, interpretation) lean on rubrics, which are harder to verify than a calculation.

## Changing the tool

- **Bookkeeping lives in `learn.py`; judgment stays with the model.** The script does only what a model gets wrong: validating and aggregating many Progress lines (best level, per-topic evidence, review status) and gathering session-start state. Everything else (reading answers, formatting, readiness) is left to the model. Script parsers of model-written markup proved brittle and were removed. If a *counting* rule changes (the stale threshold, review status), change `learn.py` and `SKILL.md` together, and run `python3 -m unittest discover tests`.
- **Behavior:** edit `SKILL.md` for anything both modes share, `learning.md` or `exam.md` for one mode.
- **What was deliberately left out**, and is worth revisiting only if a real problem shows up:
  - separate `/review` and `/exam` commands (a mock exam is just a request in a session)
  - a spaced-repetition scheduler such as FSRS
  - syncing with a learning-management system
  - photo answers
  - a database, or progress stored inside the notes
- **Open settings to tune with use:** the stale threshold, the graduation count, and the turn signal (`next` vs. a checkbox in the file).

## Where it came from

The tutor began as a skill written for one person's Obsidian notes and STEM courses. This version keeps the method and drops the assumptions:

| First version | Here |
|---|---|
| One fixed folder layout for notes, courses and materials | Any folder. A course is anything with a profile; materials are found by folder name under `Materials/` or configured roots |
| Notes follow one fixed template | Notes follow the workspace's own conventions if it states any; a learner with no notes folder writes the note in the session file |
| Obsidian required | Obsidian recommended; any Markdown editor works |
| Shell one-liners for the Progress file (`printf >>`, `sed`, `find`) | `learn.py log` validates before appending, and the other commands replace the rest, so it also works on Windows |
| Temp files in `/tmp` | `.learn/scratch/` inside the workspace |
| STEM examples and a "lab material" question | Subject-neutral wording, rubric-keyed open-ended questions, readings in the inventory |
