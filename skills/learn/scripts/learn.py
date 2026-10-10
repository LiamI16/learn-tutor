#!/usr/bin/env python3
"""Bookkeeping for the /learn tutor. Standard library only (Python 3.8+).

Only the steps where a model is error-prone live here: validating and aggregating
Progress lines (best level, review status), gathering session-start state, and
opening the session file. Readiness is a tutor judgment written at close, not computed here.

Usage (run from the workspace folder):
  learn.py start [<course or topic>]         session-start state in one call; no name: list courses and recent sessions
  learn.py log '<line>' ['<line>' ...]       validate, then append graded results to Progress.md (all or nothing)
  learn.py status <course> [--json|--write]  per-topic evidence + review status; --write updates Best level
  learn.py history <concept or course>       the Progress lines for one concept or context
  learn.py rename <old concept> <new>        rename a concept in existing Progress lines
  learn.py check                             validate Progress lines; lint Sessions/ for links and tags in wiki-link workspaces
  learn.py show <session file> [heading]     open the session file at the last heading containing [heading]
  learn.py scratch <session file>            create and print the session's scratch folder
  learn.py clean <session file> [--keep]     delete the scratch folder (--keep: leave keys.md and prefetch-*)
  --root <dir>      any command: the workspace (default: current directory)
  --sessions <dir>  any command: use another sessions folder (tests)

Config (optional): <workspace>/.learn/config.json
  { "sessions": "Sessions", "materials": ["Materials"], "open": "auto" }
"""
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

sys.dont_write_bytecode = True

SEP = " · "
RESULTS = ("correct", "partial", "wrong", "idk")
CONFS = ("high", "med", "low", "none")
NOTE_RE = re.compile(r"^L([1-5])( probe| retest)?:")
DATED = re.compile(r"^\d{4}-\d{2}-\d{2} ")
WEIGHT = {"H": 3, "M": 2, "L": 1}
EXAM_WINDOW = 21  # days: an exam this close suggests exam prep
ASK_AGAIN = 14    # days: re-ask "is an exam coming?" after a 'No exam scheduled' line this old
STALE = 14        # days without a test before a concept is stale (no exam date known)
OBSIDIAN_MAC = "/Applications/Obsidian.app/Contents/MacOS/Obsidian"

ROOT = Path.cwd()
SESSIONS = None
CONFIG = None


def die(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def read(p):
    return Path(p).read_text(encoding="utf-8").replace("\r\n", "\n")


def write(p, text):
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def rel(p):
    try:
        return Path(p).relative_to(ROOT).as_posix() or "."
    except ValueError:
        return str(p)


def expand(p):
    p = Path(str(p)).expanduser()
    return p if p.is_absolute() else (ROOT / p)


def load_config():
    cfg = {"sessions": "Sessions", "materials": ["Materials"], "open": "auto"}
    f = ROOT / ".learn" / "config.json"
    if f.exists():
        try:
            cfg.update(json.loads(read(f)))
        except ValueError as e:
            die(f".learn/config.json is not valid JSON: {e}")
    if isinstance(cfg["materials"], str):
        cfg["materials"] = [cfg["materials"]]
    return cfg


# ---------------------------------------------------------------- Dates

def today():
    env = os.environ.get("LEARN_TODAY")
    return dt.date.fromisoformat(env) if env else dt.date.today()


def as_date(s):
    try:
        return dt.date.fromisoformat(s) if re.match(r"^\d{4}-\d{2}-\d{2}$", s) else None
    except ValueError:
        return None


# ---------------------------------------------------------------- Progress

def progress_path():
    return SESSIONS / "Progress.md"


def problems(f):
    """Why a split Progress line is malformed (empty list = fine)."""
    if len(f) != 7:
        return [f"{len(f)} fields, needs 7 (never use ' · ' inside a field)"]
    errs = []
    if not as_date(f[0]):
        errs.append("bad date")
    if not f[1].strip():
        errs.append("empty concept")
    if f[2] not in RESULTS:
        errs.append(f"result '{f[2]}'")
    if f[3] not in CONFS:
        errs.append(f"confidence '{f[3]}'")
    if not NOTE_RE.match(f[5]):
        errs.append("note must start like 'L3:', 'L2 probe:', 'L2 retest:'")
    return errs


def parse_line(line):
    f = re.sub(r"^- ", "", line).strip().split(SEP)
    errs = problems(f)
    if errs:
        return errs, None
    m = NOTE_RE.match(f[5])
    return errs, {"date": f[0], "concept": f[1], "result": f[2], "conf": f[3], "context": f[4],
                  "note": f[5], "session": f[6], "level": int(m.group(1)), "label": (m.group(2) or "").strip()}


def read_progress():
    """All well-formed lines, plus (line number, text, problems) for malformed ones."""
    rows, bad = [], []
    if not progress_path().exists():
        return rows, bad
    for n, line in enumerate(read(progress_path()).split("\n"), 1):
        if not line.startswith("- 20"):
            continue
        errs, row = parse_line(line)
        if errs:
            bad.append((n, line, errs))
        else:
            rows.append(row)
    return rows, bad


def warn_bad(bad):
    for n, line, errs in bad:
        print(f"MALFORMED Progress.md line {n} (ignored until fixed): {'; '.join(errs)}\n  {line[:100]}")


def ensure_sessions():
    if not SESSIONS.is_dir():
        SESSIONS.mkdir(parents=True)
        print(f"created {rel(SESSIONS)}/ (first session in this workspace)")
    if not progress_path().exists():
        write(progress_path(),
              "---\ncssclasses:\n  - session-progress\n---\n## Progress\n---\n"
              "`date · concept · result · confidence · context · note · session` — one line per graded question, append-only.\n\n")


def cmd_log(lines):
    if not lines:
        die("log needs at least one line: 'date · concept · result · confidence · context · note · session'")
    ensure_sessions()
    parsed = [("- " + re.sub(r"^- ", "", l).strip(),) + parse_line(l) for l in lines]
    failed = [p for p in parsed if p[1]]
    if failed:
        for text, errs, _ in failed:
            print(f"REJECTED: {'; '.join(errs)}\n  {text}", file=sys.stderr)
        die(f"nothing was logged: fix the {len(failed)} line(s) above and log all {len(lines)} again")
    known = {r["concept"] for r in read_progress()[0]}
    body = read(progress_path())
    write(progress_path(), body + ("" if body.endswith("\n") or not body else "\n") + "\n".join(p[0] for p in parsed) + "\n")
    print(f"logged {len(parsed)} line(s) to {rel(progress_path())}")
    fresh = list(dict.fromkeys(p[2]["concept"] for p in parsed if p[2]["concept"] not in known))
    if fresh and known:
        print(f"new concept name(s): {', '.join(fresh)} (if one was meant to match an earlier concept, fix it with 'rename')")
    for s in dict.fromkeys(p[2]["session"] for p in parsed):
        if not (SESSIONS / f"{s}.md").exists():
            print(f"note: no session file named '{s}.md'")


def cmd_history(text):
    rows, bad = read_progress()
    warn_bad(bad)
    t = text.lower()
    hits = [r for r in rows if r["concept"].lower() == t or r["context"].lower() == t]
    if not hits:
        hits = [r for r in rows if t in r["concept"].lower()]
    for r in hits:
        print("- " + SEP.join([r["date"], r["concept"], r["result"], r["conf"], r["context"], r["note"], r["session"]]))
    print(f"{len(hits)} line(s) for '{text}'")


def cmd_rename(old, new):
    if SEP in new:
        die("the new name can't contain ' · '")
    n, out = 0, []
    for line in read(progress_path()).split("\n"):
        if line.startswith("- 20"):
            f = line[2:].split(SEP)
            if len(f) == 7 and f[1] == old:
                f[1] = new
                n += 1
                line = "- " + SEP.join(f)
        out.append(line)
    if n:
        write(progress_path(), "\n".join(out))
    print(f"renamed '{old}' to '{new}' in {n} line(s)")


# ---------------------------------------------------------------- Profile

def profile_path(course):
    return SESSIONS / f"{course}.md"


def cells_of(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def read_profile(course):
    p = profile_path(course)
    if not p.exists():
        return None
    text = read(p)
    topics, sections, in_topics, in_sections = [], [], False, False
    for line in text.split("\n"):
        if line.startswith("#### "):
            in_topics = line.strip() == "#### Topics"
            in_sections = line.strip() == "#### Sections"
            continue
        if in_sections and line.startswith("- "):
            sections.append(line[2:].strip())
        if in_topics and line.startswith("| ") and not line.startswith("| Topic"):
            cells = cells_of(line)
            if len(cells) >= 3 and cells[1] in WEIGHT:
                m = re.match(r"L([1-5])", cells[2])
                topics.append({"topic": cells[0], "weight": cells[1], "target": int(m.group(1)) if m else 1})
    exams = [{"name": m.group(1), "date": m.group(2)}
             for m in re.finditer(r"^- \*\*(.+?)\*\* · (\d{4}-\d{2}-\d{2})", text, re.M)]
    asked = re.findall(r"^- No exam scheduled · asked (\d{4}-\d{2}-\d{2})", text, re.M)
    manifest = re.findall(r"^- `(.+?)` · (.+?) · (\d{4}-\d{2}-\d{2})\s*$", text, re.M)
    return {"topics": topics, "sections": sections, "exams": [e for e in exams if as_date(e["date"])],
            "manifest": manifest, "no_exam_asked": max(asked) if asked else None}


def next_exam(profile):
    future = [e for e in profile["exams"] if as_date(e["date"]) >= today()]
    return min(future, key=lambda e: e["date"]) if future else None


# ---------------------------------------------------------------- Status

def group_by(rows):
    by = {}
    for r in rows:
        by.setdefault(r["concept"], []).append(r)
    return by


def summary(rows, topics):
    """Facts per topic for the tutor's readiness review: best level, counts, recent results."""
    mark = {"correct": "✓", "partial": "~", "wrong": "✗", "idk": "?"}
    by = group_by(rows)
    out = []
    for t in topics:
        rs = by.get(t["topic"], [])
        correct = [r for r in rs if r["result"] == "correct"]
        best = "none"
        if correct:
            lvl = max(r["level"] for r in correct)
            only_retest = all(r["label"] == "retest" for r in correct if r["level"] == lvl)
            best = f"L{lvl}" + (" (retest)" if only_retest else "")
        recent = "".join(mark[r["result"]] + ("r" if r["label"] == "retest" else "") for r in rs[-6:])
        out.append({**t, "best": best, "graded": len(rs), "recent": recent or "-",
                    "last": rs[-1]["date"] if rs else "-"})
    return out


def review(rows, exam_date):
    """Review status. Uses only each concept's first graded question in a session."""
    weak, stale, graduated = [], [], []
    limit = max(1, round(0.3 * (exam_date - today()).days)) if exam_date else STALE
    for concept, rs in group_by(rows).items():
        firsts = {}
        for r in rs:
            firsts.setdefault(r["session"], r)
        latest = firsts[rs[-1]["session"]]
        if latest["result"] != "correct":
            weak.append((concept, latest["conf"]))
        if sum(1 for r in firsts.values() if r["result"] == "correct") >= 3:
            graduated.append(concept)
        if (today() - as_date(max(r["date"] for r in rs))).days > limit:
            stale.append(concept)
    weak.sort(key=lambda x: CONFS.index(x[1]))
    return weak, stale, graduated


def print_review(rv, label):
    weak, stale, grad = rv
    print(f"{label}weak (worst first): " + (", ".join(f"{c} ({k})" for c, k in weak) or "none"))
    print("        stale: " + (", ".join(stale) or "none") + " · graduated: " + (", ".join(grad) or "none"))


def write_profile(course, summ):
    """Update only the factual Best level column; Readiness and Evidence are the tutor's."""
    by = {t["topic"]: t for t in summ}
    out, in_topics = [], False
    for line in read(profile_path(course)).split("\n"):
        if line.startswith("#### "):
            in_topics = line.strip() == "#### Topics"
        elif in_topics and line.startswith("| ") and not line.startswith("| Topic"):
            cells = cells_of(line)
            if cells[0] in by and len(cells) == 7:
                cells[4] = by[cells[0]]["best"]
                line = "| " + " | ".join(cells) + " |"
        out.append(line)
    write(profile_path(course), "\n".join(out))
    print(f"updated {profile_path(course).name}")


def cmd_status(course, as_json=False, do_write=False):
    profile = read_profile(course)
    if not profile:
        die(f"no profile at {rel(profile_path(course))} (calibrate first)")
    ex = next_exam(profile)
    all_rows, bad = read_progress()
    names = {t["topic"] for t in profile["topics"]}
    # evidence is shared by concept name: lines from topic sessions or other courses count too
    rows = [r for r in all_rows if r["concept"] in names or r["context"] == course]
    summ = summary(rows, profile["topics"])
    rv = review(rows, as_date(ex["date"]) if ex else None)
    unknown = sorted({r["concept"] for r in rows if r["context"] == course} - names)
    if do_write:
        write_profile(course, summ)
    if as_json:
        print(json.dumps({"topics": summ, "review": {"weak": rv[0], "stale": rv[1], "graduated": rv[2]},
                          "progress_concepts_not_in_profile": unknown,
                          "malformed_lines": [n for n, _, _ in bad]}, indent=1, ensure_ascii=False))
        return
    warn_bad(bad)
    if not profile["topics"]:
        print("no topic table in the profile yet (exam prep builds it)")
    else:
        print("Evidence for the readiness review (recent: last 6 results, oldest first; ✓ correct, ~ partial, ✗ wrong, ? idk, r = retest)")
        print(f"{'Topic':34} W  Target  Best          Graded  Last        Recent")
        for t in sorted(summ, key=lambda t: -WEIGHT[t["weight"]]):
            print(f"{t['topic'][:34]:34} {t['weight']}  L{t['target']}      {t['best']:13} {t['graded']:<7} {t['last']:11} {t['recent']}")
    print_review(rv, "Review: ")
    if unknown:
        print("Progress concepts not in the profile's topic table: " + ", ".join(unknown))


# ---------------------------------------------------------------- Start

def session_files(name=""):
    if not SESSIONS.is_dir():
        return []
    return sorted(f.name for f in SESSIONS.glob("*.md")
                  if DATED.match(f.name) and f.name[11:].lower().startswith(name.lower()))


def plan_state(name):
    lines = read(SESSIONS / name).split("\n")
    start = next((i for i, l in enumerate(lines) if l.strip() == "#### Plan"), None)
    if start is None:
        return 0, []
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("#### ")), len(lines))
    plan = lines[start + 1:end]
    return (sum(1 for l in plan if re.match(r"^- \[[xX]\] ", l)),
            [l[6:] for l in plan if l.startswith("- [ ] ")])


def visible(entries):
    return sorted(e for e in entries if not e.name.startswith("."))


def materials_folder(name):
    """The first folder named like the course or topic under a materials root (up to 4 levels down)."""
    def search(d, depth):
        for e in visible(d.iterdir()):
            if not e.is_dir():
                continue
            if e.name.lower() == name.lower():
                return e
            if depth > 0:
                hit = search(e, depth - 1)
                if hit:
                    return hit
        return None
    for root in map(expand, CONFIG["materials"]):
        if root.is_dir():
            hit = search(root, 3)
            if hit:
                return hit
    return None


def files_to_inventory(folder, profile):
    manifest = {f: d for f, _, d in profile["manifest"]}
    todo = []
    files = sorted(p for p in folder.rglob("*")
                   if p.is_file() and not any(part.startswith(".") for part in p.relative_to(folder).parts))
    for p in files:
        r = p.relative_to(folder).as_posix()
        if r not in manifest:
            todo.append(f"new: {r}")
        elif dt.date.fromtimestamp(p.stat().st_mtime).isoformat() > manifest[r]:
            todo.append(f"changed: {r}")
    todo += [f"missing on disk: {f}" for f in manifest if not (folder / f).exists()]
    return todo


def print_last_session(name):
    files = session_files(name)
    if not files:
        print("last session: none")
        return files
    done, open_steps = plan_state(files[-1])
    print(f"last session: {files[-1]} · plan: {done} done, {len(open_steps)} open")
    for step in open_steps:
        print(f"  open: {step}")
    return files


def wiki_root(start):
    for d in [start, *start.parents]:
        if (d / ".obsidian").is_dir():
            return d
    return None


def profiles():
    if not SESSIONS.is_dir():
        return []
    return sorted(f.stem for f in SESSIONS.glob("*.md")
                  if not DATED.match(f.name) and f.name != "Progress.md"
                  and re.search(r"^#### (Exams|Sections|Topics)\s*$", read(f), re.M))


def print_header():
    print(f"today: {today()} · workspace: {ROOT} · sessions: {rel(SESSIONS)}/")
    print("wiki-link workspace (Obsidian): yes → no [[ and no #tags anywhere in the sessions folder"
          if wiki_root(ROOT) else "wiki-link workspace: no")


def cmd_overview():
    print_header()
    ps = profiles()
    print("courses: " + ("" if ps else "none yet"))
    for c in ps:
        ex = next_exam(read_profile(c))
        print(f"  {c}" + (f" · next exam: {ex['name']} {ex['date']} ({(as_date(ex['date']) - today()).days} days)" if ex else ""))
    recent = session_files()[-5:]
    print("recent sessions: " + ("" if recent else "none yet"))
    for f in recent:
        print(f"  {f}")


def cmd_start(arg):
    if not arg:
        return cmd_overview()
    print_header()
    ensure_sessions()
    profile = read_profile(arg)
    folder = materials_folder(arg)
    no_folder = f"none found (looked for a folder named '{arg}' under: {', '.join(CONFIG['materials'])})"
    found = f"{rel(folder)}/" if folder else None
    if not profile:
        files = session_files(arg)
        if not files:
            print(f"source: NEW ('{arg}' has no profile and no earlier sessions)")
            print("  → a course if the learner studies it over time with materials or exams (then create its profile); "
                  "otherwise a topic. Ask only if their message leaves it unclear (SKILL.md §1)")
            print(f"materials: {found or no_folder}")
            print("suggested mode: learning")
            return
        print(f"source: topic ('{arg}' has sessions but no course profile) · mode: learning")
        print(f"materials: {found or no_folder}")
        print_last_session(arg)
        stems = {f[:-3] for f in files}
        rows, bad = read_progress()
        warn_bad(bad)
        concepts = {r["concept"] for r in rows if r["session"] in stems}
        if concepts:
            print_review(review([r for r in rows if r["concept"] in concepts], None), "review: ")
        return
    print(f"source: course · profile: {rel(profile_path(arg))}")
    ex = next_exam(profile)
    days = (as_date(ex["date"]) - today()).days if ex else None
    if ex:
        print(f"next exam: {ex['name']} {ex['date']} ({days} days)")
    elif profile["no_exam_asked"] and (today() - as_date(profile["no_exam_asked"])).days < ASK_AGAIN:
        print(f"next exam: none scheduled (asked {profile['no_exam_asked']}; don't ask again yet)")
    else:
        print("next exam: none recorded → ask whether one is coming (SKILL.md §1 step 2)")
    print("suggested mode: " + (f"exam prep (exam within {EXAM_WINDOW} days; confirm)" if ex and days <= EXAM_WINDOW else "learning"))
    print("sections covered: " + ("" if profile["sections"] else "none yet"))
    for sec in profile["sections"][-5:]:
        print(f"  {sec}")
    print(f"materials: {found or no_folder + ' → remind the learner (exam.md start)'}")
    if folder:
        todo = files_to_inventory(folder, profile)
        print("inventory (exam prep): " + ("none yet → build it if exam prep" if not profile["manifest"]
                                           else "up to date" if not todo else "to update:"))
        if profile["manifest"]:
            for t in todo:
                print(f"  {t}")
    print_last_session(arg)
    if profile["topics"]:
        print("---")
        cmd_status(arg)


# ---------------------------------------------------------------- Check

def link_hits(text):
    """Lines with a wiki link or tag, ignoring code and math (where [[ and # are ordinary characters)."""
    hits, fenced = [], False
    for n, line in enumerate(text.split("\n"), 1):
        if re.match(r"^\s*(```|~~~)", line):
            fenced = not fenced
            continue
        if fenced:
            continue
        bare = re.sub(r"\$[^$]*\$", "", re.sub(r"`[^`]*`", "", line))
        if "[[" in bare or re.search(r"(^|\s)#[A-Za-z][\w/-]*", bare):
            hits.append(n)
    return hits


def cmd_check():
    rows, bad = read_progress()
    warn_bad(bad)
    print(f"Progress: {len(rows)} valid lines, {len(bad)} malformed")
    if not wiki_root(ROOT) or not SESSIONS.is_dir():
        return
    total = 0
    for f in sorted(SESSIONS.glob("*.md")):
        hits = link_hits(read(f))
        if hits:
            print(f"LINK OR TAG in {f.name}: line {', '.join(map(str, hits))} (remove it, unless it's math or code)")
        total += len(hits)
    print(f"Links and tags in {rel(SESSIONS)}/: {total}")


# ---------------------------------------------------------------- Show

def run(cmd, shell=False):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=10, shell=shell)
        return r.returncode == 0, r.stdout + r.stderr
    except (OSError, subprocess.SubprocessError):
        return False, ""


def system_open(target):
    if sys.platform == "darwin":
        return run(["open", target])[0]
    if sys.platform == "win32":
        return run(f'start "" "{target}"', shell=True)[0]
    return run(["xdg-open", target])[0]


def open_obsidian(file, heading, vault):
    vault_path = file.relative_to(vault).as_posix()
    # fixed script; inputs are JSON-quoted
    js = (f"const f=app.vault.getAbstractFileByPath({json.dumps(vault_path)});"
          "const hs=(app.metadataCache.getFileCache(f)||{}).headings||[];"
          f"const h=hs.filter(x=>x.heading.includes({json.dumps(heading)})).pop();"
          "const line=h?h.position.start.line:0;app.workspace.getLeaf(false).openFile(f,{eState:{line:line}});'line '+line")
    for binary in (OBSIDIAN_MAC, shutil.which("obsidian")):
        if binary and Path(binary).exists():
            ok, out = run([binary, "eval", f"code={js}"])
            if ok and "line" in out:
                return "in Obsidian, scrolled to the heading"
    if system_open(f"obsidian://open?path={quote(str(file), safe='')}"):
        return "in Obsidian at the top (turn on the Obsidian CLI in Settings → General → Advanced to scroll to the heading)"
    return None


def cmd_show(name, heading=""):
    file = (SESSIONS / (name if name.endswith(".md") else name + ".md")).resolve()
    if not file.exists():
        die(f"no session file {rel(file)}")
    line = 1
    for n, l in enumerate(read(file).split("\n"), 1):
        if heading and l.startswith("#") and heading in l:
            line = n
    where = f"{rel(file)}:{line}"
    mode, how = CONFIG["open"], None
    if mode == "none":
        how = 'not opened (open is "none")'
    elif "{file}" in mode:
        cmd = mode.replace("{file}", f'"{file}"').replace("{line}", str(line))
        how = f"with: {cmd}" if run(cmd, shell=True)[0] else None
    else:
        vault = wiki_root(file.parent)
        if vault and mode != "system":
            how = open_obsidian(file, heading, vault)
        if not how and os.environ.get("TERM_PROGRAM") == "vscode" and shutil.which("code") \
                and run(f'code -g "{file}:{line}"', shell=True)[0]:
            how = "in VS Code"
        if not how and system_open(str(file)):
            how = "in the system's default app for .md files"
    print(f"opened {where} {how}" if how else f"could not open an editor: tell the learner to open {where}")


# ---------------------------------------------------------------- Scratch

def scratch_dir(name):
    return ROOT / ".learn" / "scratch" / re.sub(r"\.md$", "", Path(name).name)


def cmd_scratch(name):
    d = scratch_dir(name)
    d.mkdir(parents=True, exist_ok=True)
    ignore = d.parent / ".gitignore"
    if not ignore.exists():
        write(ignore, "*\n")
    print(rel(d) + "/")


def cmd_clean(name, keep):
    d = scratch_dir(name)
    if not d.is_dir():
        print("nothing to clean")
        return
    kept = removed = 0
    for f in d.iterdir():
        if keep and (f.name == "keys.md" or f.name.startswith("prefetch-")):
            kept += 1
        elif f.is_dir():
            shutil.rmtree(f)
            removed += 1
        else:
            f.unlink()
            removed += 1
    if not kept:
        d.rmdir()
    print(f"removed {removed} scratch file(s), kept {kept}")


# ---------------------------------------------------------------- Main

def main(argv):
    global ROOT, SESSIONS, CONFIG
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass

    def take(flag):
        if flag not in argv:
            return None
        i = argv.index(flag)
        if i + 1 >= len(argv):
            die(f"{flag} needs a value")
        value = argv[i + 1]
        del argv[i:i + 2]
        return value

    def has(flag):
        found = flag in argv
        if found:
            argv.remove(flag)
        return found

    root = take("--root")
    if root:
        ROOT = Path(root).expanduser().resolve()
    CONFIG = load_config()
    SESSIONS = expand(take("--sessions") or CONFIG["sessions"])
    as_json, do_write, keep = has("--json"), has("--write"), has("--keep")
    cmd = argv[0] if argv else ""
    a = argv[1] if len(argv) > 1 else None
    b = argv[2] if len(argv) > 2 else None
    if cmd == "start":
        cmd_start(a)
    elif cmd == "log":
        cmd_log(argv[1:])
    elif cmd == "status" and a:
        cmd_status(a, as_json, do_write)
    elif cmd == "history" and a:
        cmd_history(a)
    elif cmd == "rename" and a and b:
        cmd_rename(a, b)
    elif cmd == "check":
        cmd_check()
    elif cmd == "show" and a:
        cmd_show(a, b or "")
    elif cmd == "scratch" and a:
        cmd_scratch(a)
    elif cmd == "clean" and a:
        cmd_clean(a, keep)
    else:
        die(__doc__.strip())


if __name__ == "__main__":
    main(sys.argv[1:])
