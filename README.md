# learn-tutor

A tutor for [Gemini CLI](https://github.com/google-gemini/gemini-cli). It finds exactly where your knowledge stops and pushes it outward, for any subject, in plain Markdown files you own.

```
/learn BIO 101                    learn the next chapters of a course
/learn BIO 101 exam               prepare for the course's next exam
/learn the French Revolution      learn any topic
```

What makes it different from asking a chatbot to explain something:

- **You produce, it grades.** Learning happens when you attempt an answer and get feedback. The tutor asks, you answer in a file, it grades against a key.
- **Grounded.** Every graded question has a worked answer and a cited source before you see it, and a second agent that never sees the key solves it independently. Disagreements are fixed before the question reaches you.
- **Understanding over memorizing.** Learning mode builds each subject from a few facts you can accept without caveats and walks every result as "how could I have discovered this?".
- **You write your own notes.** The tutor critiques them against the sources. It never writes or edits them.
- **It remembers what you can do**, not what you've read: one line per graded question in `Sessions/Progress.md`, used to pick up at your frontier next time and to bring back what's weak or stale.

Why it is built this way, and the research behind it: [DESIGN.md](DESIGN.md).

## Install

Needs Gemini CLI (which brings Node.js, the only dependency).

```bash
gemini extensions install https://github.com/LiamI16/learn-tutor
```

Then turn on subagents, which the blind verifier uses. In `~/.gemini/settings.json`:

```json
{ "experimental": { "enableAgents": true } }
```

(Newer Gemini CLI versions may have this on already. Without it the tutor still verifies, by running the same checker in a separate background Gemini process, which is slower.)

Update later with `gemini extensions update learn-tutor`.

## Set up a study folder

Pick one folder for everything you study and always start Gemini CLI from it:

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
gemini --approval-mode auto_edit
```

`auto_edit` lets the tutor write to the session file without asking each time. When it first runs its bookkeeping script (`node …/learn.cjs`), choose "allow always".

## A session

1. `/learn <course or topic>`. The tutor asks what's in scope (and, for a course, whether an exam is coming).
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

**Exam prep** (`/learn <course> exam`, or offered when an exam is within three weeks): the first session reads every file in the course's materials and builds a topic table weighted by what the homework and past exams actually ask. Batches of exam-sized questions go after the most points first. Each session ends with a readiness review per topic and an estimated score range. Ask for a mock exam any time.

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

- `materials`: folders searched for one named like the course or topic. Folders outside the study folder also need to be allowed in Gemini CLI (`gemini --include-directories ~/Documents/School`).
- `open`: how the session file is opened. `auto` (Obsidian if the folder is a vault, VS Code inside its terminal, else the system default), `system`, `none`, or a command such as `"code -g {file}:{line}"`.

### Obsidian extras

- Scroll-to-what's-new uses Obsidian's command line interface: turn it on in Settings → General → Advanced. Without it the file opens at the top.
- Optional theme for session files: copy [`extras/obsidian/learn-sessions.css`](extras/obsidian/learn-sessions.css) to `<vault>/.obsidian/snippets/` and enable it in Settings → Appearance → CSS snippets.
- For PDFs, installing `poppler` (`brew install poppler`, `apt install poppler-utils`) lets the tutor read just the chapters in scope instead of whole books.

## What's in this repo

```
gemini-extension.json           extension manifest
commands/learn.toml             the /learn command
skills/learn/SKILL.md           shared core: rules, probe, question format, grounding, grading, Progress, close
skills/learn/learning.md        learning mode
skills/learn/exam.md            exam prep mode
skills/learn/verifier.md        the blind solver's instructions
skills/learn/scripts/learn.cjs  bookkeeping: session-start state, Progress validation, review status
agents/verifier.md              the blind solver as a subagent (same text; a test keeps them identical)
hooks/                          keeps Progress.md append-only
extras/obsidian/                optional theme
tests/                          node --test tests/learn.test.cjs
```

The behavior is all in the three Markdown files under `skills/learn/`. To change how the tutor acts, edit those; see "Changing the tool" in [DESIGN.md](DESIGN.md). To develop locally: `gemini extensions link .`.

## Status

Ported from a Claude Code skill that has been used for real course work. The bookkeeping script and hook are covered by tests, and the skill and subagent files load with Gemini CLI's own loaders. The Gemini port has not yet been through full live sessions, so expect to tune wording in `skills/learn/` after the first few.

## Credits

Learning mode's two principles and its one-idea-per-turn loop are adapted from [amosblomqvist/learn](https://github.com/amosblomqvist/learn).
