# learn-tutor

A tutor for [Claude Code](https://claude.com/claude-code). It finds exactly where your knowledge stops and pushes it outward, for any subject, in plain Markdown files you own.

```
/tutor:learn BIO 101                    learn the next chapters of a course
/tutor:learn BIO 101 exam               prepare for the course's next exam
/tutor:learn the French Revolution      learn any topic
```

What makes it different from asking a chatbot to explain something:

- **You produce, it grades.** Learning happens when you attempt an answer and get feedback. The tutor asks, you answer in a file, it grades against a key.
- **Grounded.** Every graded question has a worked answer and a cited source before you see it, and a second agent that never sees the key solves it independently. Disagreements are fixed before the question reaches you.
- **Understanding over memorizing.** Learning mode builds each subject from a few facts you can accept without caveats and walks every result as "how could I have discovered this?".
- **You write your own notes.** The tutor critiques them against the sources. It never writes or edits them.
- **It remembers what you can do**, not what you've read: one line per graded question in `Sessions/Progress.md`, used to pick up at your frontier next time and to bring back what's weak or stale.

Why it is built this way, and the research behind it: [DESIGN.md](DESIGN.md).

## Install

Needs Claude Code and Python 3 (already on most Macs and Linux machines; on Windows, install it from python.org).

In Claude Code:

```
/plugin marketplace add LiamI16/learn-tutor
/plugin install tutor@learn-tutor
```

Update later with `/plugin marketplace update learn-tutor`.

<details>
<summary>Prefer a plain <code>/learn</code> command? Install without the plugin system</summary>

Copy the skill and the verifier into your Claude folder:

```bash
git clone https://github.com/LiamI16/learn-tutor
mkdir -p ~/.claude/skills ~/.claude/agents
cp -R learn-tutor/skills/learn ~/.claude/skills/learn
cp learn-tutor/agents/verifier.md ~/.claude/agents/verifier.md
```

The command is then `/learn`. This skips the hook that keeps `Progress.md` append-only (the tutor is told to follow that rule either way).
</details>

## Set up a study folder

Pick one folder for everything you study and always start Claude Code from it:

```
Study/
  Materials/
    BIO 101/            textbook, slides, homework, past exams (PDF or text)
      Held Out/         practice exams you haven't taken yet (see below)
  Sessions/             created by the tutor: session files, course profiles, Progress.md
  ...your own notes, anywhere else, as Markdown
```

Only the folder itself is required. The tutor creates `Sessions/` on first use, and works without materials (it then uses the web and asks you for sources), but it is much better with them.

A good editor matters, because everything with math, tables or diagrams happens in the session file, not the terminal. **[Obsidian](https://obsidian.md) is recommended** (free): open the study folder as a vault and questions, math, diagrams and collapsible feedback all render, and the tutor scrolls the file to what's new. Any Markdown editor works; feedback callouts then show as quote blocks.

```bash
cd ~/Documents/Study
claude
```

Press Shift+Tab to switch to "accept edits", so the tutor can write to the session file without asking each time. When it first runs its bookkeeping script (`python3 …/learn.py`), choose "don't ask again".

## A session

1. `/tutor:learn <course or topic>`. The tutor asks what's in scope (and, for a course, whether an exam is coming).
2. It opens a session file. **Answer there**, tick a confidence box *before* seeing any feedback, then type `next` in the terminal.

   ```markdown
   #### ==Q2== Glycolysis `L3` `Campbell §9.2`
   Why does glycolysis need NAD⁺ to be regenerated to keep running?

   ##### Answer
   (type here)

   ###### Confidence
   - [ ] high
   - [x] med
   - [ ] low
   ```
3. Feedback appears under each answer with the key and its source, so you can check the tutor too.
4. Results are logged after every batch, so stopping early loses nothing.

**Learning mode** (default): a short probe to find your edge, then a small map of the section (a few foundations at the top, the main result at the bottom). One idea per turn: why we need it, you try to work it out (or it's shown, your choice), how it connects, then one or two graded checks. When a cluster of ideas is done, you write the note from memory and the tutor critiques it.

**Exam prep** (`/tutor:learn <course> exam`, or offered when an exam is within three weeks): the first session reads every file in the course's materials and builds a topic table weighted by what the homework and past exams actually ask. Batches of exam-sized questions go after the most points first. Each session ends with a readiness review per topic and an estimated score range. Ask for a mock exam any time.

**Held-out exams.** Put a practice exam you want to save in `Materials/<Course>/Held Out/`. The tutor uses it only to weight topics and match question style. It never shows or adapts its problems, until you ask to take it as a mock exam.

### Controls

| Type | Effect |
|---|---|
| `next` | grade / continue |
| `skip` | skip the current item |
| `stop` | grade what's filled in, then close the session |
| `defer` | learning mode: write the current note later |
| `narrate` / `let me try` | be shown each step, or attempt it first |
| `explain more` | more depth on the current step |
| anything else | a plain question |

## How it works

A session, start to close. Each session starts from what the previous ones recorded.

```mermaid
flowchart TD
    cmd(["/tutor:learn BIO 101"]) --> start["<b>Start</b><br/>learn.py reads Progress.md and the course profile:<br/>next exam, unfinished plan, what is weak or stale"]
    start --> review["<b>Review offer</b><br/>weak and stale concepts, confident misses first"]
    review --> mode{"Mode"}

    mode -- "learning (default)" --> l1["<b>Scope and sources</b><br/>pick the sections, map what each result rests on"]
    l1 --> l2["<b>Probe</b><br/>one or two batches to find your edge"]
    l2 --> l3["<b>Plan</b><br/>dependency graph: foundations at the top,<br/>main result at the bottom. You approve it"]
    l3 --> l4["<b>Teach one idea per turn</b><br/>motivate, you try it, connect,<br/>then 1-2 graded checks"]
    l4 --> l5["<b>Write</b><br/>you write the note from memory,<br/>the tutor critiques it"]
    l5 -- "next cluster of ideas" --> l4

    mode -- "exam prep" --> e1["<b>Calibrate</b><br/>exam date, scope, format"]
    e1 --> e2["<b>Inventory</b><br/>one agent per file lists every problem,<br/>giving a weighted topic table"]
    e2 --> e3["<b>Batches</b><br/>4-6 exam-sized questions, most points first.<br/>Misses are retested two batches later"]
    e3 -- "next batch" --> e3
    e3 --> e4["<b>Readiness review</b><br/>ready / shaky / not ready per topic,<br/>estimated score range"]

    l5 --> close["<b>Close</b><br/>redrawn map, Next session, Suggestions for your notes"]
    e4 --> close
    close -.-> data[("Sessions/<br/>Progress.md, course profile")]
    data -.-> start
```

Every question and teaching step goes through the same loop before and after you see it:

```mermaid
flowchart TD
    draft["<b>Draft</b><br/>the tutor works out each answer from a source.<br/>Keys stay in .learn/scratch/, out of the session file"]
    draft --> verify["<b>Blind check</b><br/>the verifier agent gets only the questions<br/>and solves them from the sources"]
    verify --> agree{"Agrees with<br/>the key?"}
    agree -- "no" --> fix["re-derive, then fix or drop the question"]
    fix --> draft
    agree -- "yes" --> write["<b>Session file</b><br/>the questions are written for you"]
    write --> answer["<b>You</b><br/>answer in the file, tick a confidence,<br/>type next"]
    answer --> grade["<b>Grade</b><br/>read from the file, graded against the key.<br/>Key and source are revealed"]
    grade --> log["<b>Log</b><br/>learn.py validates each line, then appends it"]
    log --> progress[("Progress.md<br/>append-only, guarded by a hook")]
    grade -- "next turn" --> draft
    write -.-> prefetch["<b>Prefetch</b><br/>while you answer, a background agent drafts<br/>and verifies the next items"]
    prefetch -.-> draft
```

## Files

| File | What it is |
|---|---|
| `Sessions/YYYY-MM-DD <name>.md` | one per session: questions, your answers, feedback |
| `Sessions/<Course>.md` | course profile: exams, terminology, answer style, sections covered, topic table. Edit it freely |
| `Sessions/Progress.md` | one line per graded question. Append-only |
| `.learn/scratch/` | the tutor's temporary files (answer keys, text extracts). Safe to delete between sessions |
| `.learn/config.json` | optional settings, below |

`Sessions/` holds data about you; your notes hold knowledge. The tutor keeps them separate: it never edits your notes, and in an Obsidian vault it writes no links or tags in `Sessions/`, so your graph stays clean.

### Settings

Optional `.learn/config.json` in the study folder:

```json
{
  "sessions": "Sessions",
  "materials": ["Materials", "~/Documents/School"],
  "open": "auto"
}
```

- `materials`: folders searched for one named like the course or topic. Folders outside the study folder also need to be allowed in Claude Code (`claude --add-dir ~/Documents/School`).
- `open`: how the session file is opened. `auto` (Obsidian if the folder is a vault, VS Code inside its terminal, else the system default), `system`, `none`, or a command such as `"code -g {file}:{line}"`.

### Obsidian extras

- Scroll-to-what's-new uses Obsidian's command line interface: turn it on in Settings → General → Advanced. Without it the file opens at the top.
- Optional theme for session files: copy [`extras/obsidian/learn-sessions.css`](extras/obsidian/learn-sessions.css) to `<vault>/.obsidian/snippets/` and enable it in Settings → Appearance → CSS snippets.
- For PDFs, installing `poppler` (`brew install poppler`, `apt install poppler-utils`) lets the tutor read just the chapters in scope instead of whole books.

## What's in this repo

```
.claude-plugin/                 plugin and marketplace manifests
skills/learn/SKILL.md           shared core: rules, probe, question format, grounding, grading, Progress, close
skills/learn/learning.md        learning mode
skills/learn/exam.md            exam prep mode
skills/learn/scripts/learn.py   bookkeeping: session-start state, Progress validation, review status
agents/verifier.md              the blind solver: gets the questions, never the answer keys
hooks/                          keeps Progress.md append-only
extras/obsidian/                optional theme
tests/                          python3 -m unittest discover tests
```

The behavior is all in the three Markdown files under `skills/learn/`. To change how the tutor acts, edit those; see "Changing the tool" in [DESIGN.md](DESIGN.md). To develop locally: `claude --plugin-dir .`.

## Status

Generalized from a Claude Code skill that has been used for real course work. The bookkeeping script and hook are covered by tests and the plugin passes `claude plugin validate`. The generalized version has not yet been through full live sessions, so expect to tune wording in `skills/learn/` after the first few.

A Gemini CLI version of the same tutor is on the [`gemini` branch](https://github.com/LiamI16/learn-tutor/tree/gemini).

## Credits

Learning mode's two principles and its one-idea-per-turn loop are adapted from [amosblomqvist/learn](https://github.com/amosblomqvist/learn).
