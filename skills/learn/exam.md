# Exam prep mode

The goal is the next exam's score: find the frontier on every topic the exam can ask about, weighted by how much each topic is worth, and size practice to the exam. Guided and companion sessions build the understanding; this mode adds problem variety and timing on top of it. Probes start from the frontier that earlier sessions logged in Progress.

"Exam" means any assessment with a date: a midterm, a final, a quiz, a certification test, an oral.

## Start

1. **Profile.** The **profile's topic table is the scope**, not the learner's notes or the syllabus headings (both are often incomplete). If the profile has no topic table, or is missing something below, calibrate.
2. **Calibration** (first exam-prep session for this exam, or when something is missing): ask for the exam date, the sections in scope, the format (duration; the kinds of question: problems, short answer, essay, multiple choice; allowed aids: formula sheet, notes, open book) and, if the course has labs, practicals or other hands-on work, **how much of the exam comes from it** (none / a little / a lot). Then build the **problem inventory** before writing any question.
3. **Materials.** `learn start` lists materials that are new or changed since the manifest; inventory only those. The inventory is re-read each session, so nothing depends on remembering an earlier skim. If there is no materials folder or it's empty, say once: "No homework or past exams in Materials/<Course>/ — questions will come from the textbook's problems. Drop problem sets and old exams there for exam-style questions." If the profile or syllabus links a course website, it may be fetched.
4. Also read the learner's notes on the chapters in scope and the textbook or reading sections (in the materials folder).

## Problem inventory

Never skim the materials yourself. Spawn **one `general-purpose` subagent per file** in the materials folder (all in parallel), each told to:
- read **every page** (text extraction for the whole file; page images only for figures). Get the page count first (`pdfinfo` when installed);
- list **every problem and subpart** as `<file short name> <id> · <kind: homework / worksheet / practical / exam> · <topic> · <level L1–L5> · <size: subparts, estimated minutes> · <what a complete answer contains>`, e.g. `HW4 P1(b) · homework · Inverse Kinematics · L3 · 1 part, ~25 min · reduce to the two subproblems, name the points, no numeric angles`, or `PS2 Q3 · homework · Price Elasticity · L2 · 2 parts, ~10 min · compute from the table, say elastic or inelastic and why`;
- end with `pages read: N of N` and the full list of problem ids found;
- for **lab manuals, practical handouts and other procedural material**: don't list steps. List each **testable concept** once, as `<file short name> <section> · practical · <topic> · <level> · core|peripheral · <the concept>`. **core** = named in the handout's stated goals or objectives, its checkoff, quiz or discussion questions, or explicitly flagged as important; **peripheral** = everything else (explanations, setup, logistics, copy-paste commands). The list is for choosing *which* practical concepts to ask (prefer core); it does not drive weight;
- for **readings** (a novel, a paper, a primary source) that carry no problems: list the themes, arguments or passages the course's questions and prompts point at, as `<file short name> <section> · reading · <topic> · <level> · <what the course asks about it>`;
- for files under `Held Out/`: list only `<file short name> <id> · exam · <topic> · <level> · <size>`, **no problem text and no answer content**;
- use the current topic table's names where a topic fits, so reports from different files agree.

Save each report to `<scratch>/inv-<n>.txt` and check it: its `pages read` must equal the file's page count, and its problem ids must have no gaps. Re-run any file that fails. Write the result into the profile under `#### Problem inventory`, starting with a manifest line per file in exactly this form: ``- `<path relative to the materials folder>` · <size, e.g. 12 pages> · <YYYY-MM-DD>``.

## Topic table

`#### Topics` in the profile (columns: Topic | Weight | Target | Problem types | Best level | Readiness | Evidence). One row per kind of exam question, granular enough that one row is one skill (e.g. "Elasticity calculations" separate from "Elasticity and tax incidence").
- **Weight** is computed from the inventory, not estimated: each topic's share of weighted inventory items (H ≥ 10%, M 4–10%, L < 4%). Item weights by source: held-out or past **exam ×2**, **homework ×1.5**, **worksheet ×1**. **Practical and procedural handouts are not counted** (how wordy a manual is says nothing about the exam). Instead the learner's calibration answer sets the combined share of practical-only topics directly: *none* → 0, *a little* → ~10%, *a lot* → ~25%, split across those topics in proportion to their core concepts; other items share the rest. The answer also sets **depth**: with *a little*, practical questions stay basic (concepts, choosing between two tools or methods, reading a result, diagnosing "why did this step fail?"), never reproducing a whole procedure from scratch. A topic that appears in both practicals and homework keeps its homework weight. If one topic still exceeds ~25% of the weight, ask the learner.
- **Target** = the most common level among the topic's most exam-like items (below). Each topic also lists its **exam-sized problem types**. Target and problem types come from those exam-like items.
- **Size to the exam, not the homework.** Homework decides *what* is tested (topics, conventions, what a complete answer contains). The most exam-like items decide *how big* a question is, preferring held-out or past exams, then worksheets, then homework cut down to its core ask (e.g. a six-part homework problem becomes its two central parts). Exam time budget = exam minutes ÷ number of exam problems (from the profile, or the held-out inventory); an exam-sized question should fit in about that time.
- **Answer style comes from the exam-like items first.** Where homework and past exams ask differently (e.g. homework wants a full derivation, the exam asks for the final expression and one justification), record both in `#### Answer style` and practice the exam's version too. If the exam is multiple choice or essay, practice in that format, and still use short produced answers for diagnosis.
- **Long derivations and long-form assignments** (a multi-part derivation, a term paper) are **teaching material**: use them as worked examples with explain-back prompts. They count as exam evidence only where the exam-like items show questions of that kind for the topic, and then only at exam size.
- **Topic name** = the learner's note name when one fits, else a short free-text name; it is the Progress concept name. Show the table to the learner and adjust it before probing.
- Record terminology and answer style in the profile, and follow them in every question, hint and feedback.

## Probe and batches

- Start untested topics at their **target level**; the search only goes below it to find a broken prerequisite. Otherwise SKILL.md §3. Bracketing a strand and probing around a miss happen within breadth before depth and the retest cap below: when they conflict, breadth wins and the extra probe waits for a later batch.
- Batches of 4–6 questions, exam-sized: at most about 4 subparts. If a question needs more, it is bigger than an exam problem (time budget above): trim it to the asks the course's exam-like items make, or split it into two questions.
- **Timing.** Under each exam-prep question's confidence boxes, add a line `Minutes:` for the learner to fill in (they may leave it blank; don't ask). When grading, compare it with the exam time budget (above) and say so in the feedback when it's well over: a correct answer that took more than about 1.5× the budget is evidence for *shaky*, not *ready*, in the readiness review.
- **Breadth before depth.** Choose each batch by exam weight × readiness gap: untested H topics first, then not ready H, then untested M, not ready M, shaky H/M, then L. **At most 2 retests per batch** (hypercorrection retests included), unless the learner asks for review.
- Match the examiner's style from homework and past exams, and the profile's answer style. Course style wins over discrimination (SKILL.md §6).
- **Formula hints** (when the profile allows a formula sheet or notes): under the question, a collapsed `> [!formula]- Formula` callout with only the base form the learner would have on their sheet, never a step specific to this question. A hint may only give formulas **upstream** of what is asked: if the hint would contain the formula or fact the question tests, omit it. Also omit it for retests of high-confidence misses.
- **Formula review** (on request): a `#### Formula review` section of `[!formula]-` callouts, grounded like questions (SKILL.md §7). **Never before the first probe batch**: a review shown first turns probe questions into copying. Offer it after batch 1, covering what the probe showed was missing; later questions must then not test recalling a formula that is on a review card.
- **Prefetch** (SKILL.md §7): the next batch's questions that don't depend on the batch just written: untested topics by exam weight, second exam-sized questions for topics seen only once, planned teaching examples, and delayed retests, with keys, sources and named misconceptions. Drop prefetched questions whose topic the learner just showed is weak at a lower level.
- **Delayed retests.** A miss graded after batch N is retested in batch **N+2**, not N+1. By the time batch N+1 is written, N's results are known, so N+2's retests can be prefetched and verified while the learner answers N+1. The gap is also better for learning: corrected confident errors tend to return unless they are retested after a delay. Misses in the session's last batch are retested first thing next session (Next session + review offer). The cap of 2 retests per batch still applies.

## Map

The plan map's nodes are the profile topics, colored by readiness: `ready` green, `shaky` amber, `notready` red, `untested` gray. Redraw it at close, in place under `#### Plan` (SKILL.md §4). A concept whose same-session retest passed gets `(retest ✓)` in its label; a same-session retest alone rarely makes a topic `ready`.

```
classDef ready fill:#10291f,stroke:#72e0a8,color:#e6fff1
classDef shaky fill:#2a230e,stroke:#ffd36b,color:#fff6dc
classDef notready fill:#2e1219,stroke:#ff7b8a,color:#ffe6ea
classDef untested fill:#0e1a26,stroke:#37495b,color:#9fb2c4
```

## Mock exam (on request)

A closed-book batch in the examiner's style and format, weighted like the real exam. If the learner asks to take a held-out exam, copy its problems verbatim into the session file (no solutions), and grade against its solutions afterwards. It then stops being held out: ask the learner to move it out of `Held Out/` once graded. Write `Started: HH:MM · Time limit: N min` at the top; on `next`, write `Ended: HH:MM · Elapsed: N min · Score: X/Y` under it and grade (the score is filled in after grading). Each mock problem also gets a `Minutes:` line, which readiness weighs against the exam's time per problem. Mock exam answers are first attempts at full exam problems: the strongest readiness evidence. Before grading, get a confidence for each problem (from the file, or with `AskUserQuestion` if the learner took it on paper), always before revealing any result. Grade every subpart with point estimates, and log one Progress line per problem under its topic.

## Readiness review (close)

Run `learn status "<Course>" --write`, which updates the Best level column (the highest level ever answered correctly, retests included, suffixed `(retest)` if only on a retest, or `none`) and prints each topic's evidence. Then judge each topic the way a tutor writing a review would, not by formula:
- `ready`: would likely get full or near-full marks on an exam-sized problem today;
- `shaky`: gets the method, loses points to slips or a recurring gap;
- `not ready`: can't set up the problem type yet;
- `untested`.

Weigh all the evidence, most-exam-like first: mock problems, then first attempts at exam-sized questions, then retests from a later session, then same-session retests and select-all or true/false items (weak evidence). Count partial credit, recency, confidence, and whether a misconception recurred (e.g. the same swap twice). Write the Readiness and Evidence columns, one line of evidence per topic, e.g. `mock P6(d) set up both subproblems but missed the parallel-axis case; Q7 retest ✓ after the lesson`. Above the table, replace the review paragraph: an estimated exam score range if the exam were today, the strongest areas, and the 2–3 topics with the most points at stake. The readiness labels are the tutor's judgment and can be revised by the learner. Progress stays the source of truth. Redraw the colored map in place under `#### Plan`.

Terminal headline: the estimated score range and the top priorities.

## After the exam

Once the exam date passes, offer a guided or companion session for the topics the review left shaky or not ready: those are the notes worth writing next.
