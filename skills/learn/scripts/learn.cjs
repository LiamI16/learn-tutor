#!/usr/bin/env node
'use strict';
/* Bookkeeping for the /learn tutor. Node standard library only (Gemini CLI already needs Node).

Only the steps where a model is error-prone live here: validating and aggregating
Progress lines (best level, review status), gathering session-start state, and
opening the session file. Readiness is a tutor judgment written at close, not computed here.

Usage (run from the workspace folder):
  learn.cjs start [<course or topic>]         session-start state in one call; no name: list courses and recent sessions
  learn.cjs log '<line>' ['<line>' ...]       validate, then append graded results to Progress.md (all or nothing)
  learn.cjs status <course> [--json|--write]  per-topic evidence + review status; --write updates Best level
  learn.cjs history <concept or course>       the Progress lines for one concept or context
  learn.cjs rename <old concept> <new>        rename a concept in existing Progress lines
  learn.cjs check                             validate Progress lines; lint Sessions/ for links and tags in wiki-link workspaces
  learn.cjs show <session file> [heading]     open the session file at the last heading containing [heading]
  learn.cjs scratch <session file>            create and print the session's scratch folder
  learn.cjs clean <session file> [--keep]     delete the scratch folder (--keep: leave keys.md and prefetch-*)
  learn.cjs verify <brief file>               blind-verify a brief in a separate headless Gemini process
  --root <dir>      any command: the workspace (default: current directory)
  --sessions <dir>  any command: use another sessions folder (tests)

Config (optional): <workspace>/.learn/config.json
  { "sessions": "Sessions", "materials": ["Materials"], "open": "auto" }
*/
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SEP = ' · ';
const RESULTS = ['correct', 'partial', 'wrong', 'idk'];
const CONFS = ['high', 'med', 'low', 'none'];
const NOTE_RE = /^L([1-5])( probe| retest)?:/;
const WEIGHT = { H: 3, M: 2, L: 1 };
const EXAM_WINDOW = 21; // days: an exam this close suggests exam prep
const ASK_AGAIN = 14;   // days: re-ask "is an exam coming?" after a 'No exam scheduled' line this old
const STALE = 14;       // days without a test before a concept is stale (no exam date known)
const OBSIDIAN_MAC = '/Applications/Obsidian.app/Contents/MacOS/Obsidian';

let ROOT = process.cwd();
let SESSIONS = null;
let CONFIG = null;

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/') || '.';

function expand(p) {
  if (p === '~' || p.startsWith('~/') || p.startsWith('~\\')) p = path.join(os.homedir(), p.slice(1));
  return path.resolve(ROOT, p);
}

function loadConfig() {
  const cfg = { sessions: 'Sessions', materials: ['Materials'], open: 'auto' };
  const file = path.join(ROOT, '.learn', 'config.json');
  if (fs.existsSync(file)) {
    try {
      Object.assign(cfg, JSON.parse(read(file)));
    } catch (e) {
      die(`.learn/config.json is not valid JSON: ${e.message}`);
    }
  }
  if (typeof cfg.materials === 'string') cfg.materials = [cfg.materials];
  return cfg;
}

// ---------------------------------------------------------------- Dates

function localDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const today = () => process.env.LEARN_TODAY || localDate(new Date());
const validDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

// ---------------------------------------------------------------- Progress

const progressPath = () => path.join(SESSIONS, 'Progress.md');

/** Why a split Progress line is malformed (empty list = fine). */
function problems(f) {
  if (f.length !== 7) return [`${f.length} fields, needs 7 (never use ' · ' inside a field)`];
  const errs = [];
  if (!validDate(f[0])) errs.push('bad date');
  if (!f[1].trim()) errs.push('empty concept');
  if (!RESULTS.includes(f[2])) errs.push(`result '${f[2]}'`);
  if (!CONFS.includes(f[3])) errs.push(`confidence '${f[3]}'`);
  if (!NOTE_RE.test(f[5])) errs.push("note must start like 'L3:', 'L2 probe:', 'L2 retest:'");
  return errs;
}

function parseLine(line) {
  const f = line.replace(/^- /, '').trim().split(SEP);
  const errs = problems(f);
  if (errs.length) return { errs };
  const m = NOTE_RE.exec(f[5]);
  return {
    errs,
    row: { date: f[0], concept: f[1], result: f[2], conf: f[3], context: f[4], note: f[5], session: f[6],
           level: Number(m[1]), label: (m[2] || '').trim() },
  };
}

/** All well-formed lines, plus {n, line, errs} for malformed ones. */
function readProgress() {
  const rows = [], bad = [];
  if (!fs.existsSync(progressPath())) return { rows, bad };
  read(progressPath()).split('\n').forEach((line, i) => {
    if (!line.startsWith('- 20')) return;
    const { errs, row } = parseLine(line);
    if (errs.length) bad.push({ n: i + 1, line, errs });
    else rows.push(row);
  });
  return { rows, bad };
}

function warnBad(bad) {
  for (const b of bad) {
    console.log(`MALFORMED Progress.md line ${b.n} (ignored until fixed): ${b.errs.join('; ')}\n  ${b.line.slice(0, 100)}`);
  }
}

function ensureSessions() {
  if (!isDir(SESSIONS)) {
    fs.mkdirSync(SESSIONS, { recursive: true });
    console.log(`created ${rel(SESSIONS)}/ (first session in this workspace)`);
  }
  if (!fs.existsSync(progressPath())) {
    fs.writeFileSync(progressPath(),
      '---\ncssclasses:\n  - session-progress\n---\n## Progress\n---\n' +
      '`date · concept · result · confidence · context · note · session` — one line per graded question, append-only.\n\n');
  }
}

function cmdLog(lines) {
  if (!lines.length) die("log needs at least one line: 'date · concept · result · confidence · context · note · session'");
  ensureSessions();
  const parsed = lines.map((l) => ({ text: '- ' + l.replace(/^- /, '').trim(), ...parseLine(l) }));
  const failed = parsed.filter((p) => p.errs.length);
  if (failed.length) {
    for (const p of failed) console.error(`REJECTED: ${p.errs.join('; ')}\n  ${p.text}`);
    die(`nothing was logged: fix the ${failed.length} line(s) above and log all ${lines.length} again`);
  }
  const known = new Set(readProgress().rows.map((r) => r.concept));
  const body = read(progressPath());
  fs.appendFileSync(progressPath(), (body.endsWith('\n') || !body ? '' : '\n') + parsed.map((p) => p.text).join('\n') + '\n');
  console.log(`logged ${parsed.length} line(s) to ${rel(progressPath())}`);
  const fresh = [...new Set(parsed.map((p) => p.row.concept).filter((c) => !known.has(c)))];
  if (fresh.length && known.size) {
    console.log(`new concept name(s): ${fresh.join(', ')} (if one was meant to match an earlier concept, fix it with 'rename')`);
  }
  for (const s of new Set(parsed.map((p) => p.row.session))) {
    if (!fs.existsSync(path.join(SESSIONS, s + '.md'))) console.log(`note: no session file named '${s}.md'`);
  }
}

function cmdHistory(text) {
  const { rows, bad } = readProgress();
  warnBad(bad);
  const t = text.toLowerCase();
  let hits = rows.filter((r) => r.concept.toLowerCase() === t || r.context.toLowerCase() === t);
  if (!hits.length) hits = rows.filter((r) => r.concept.toLowerCase().includes(t));
  for (const r of hits) console.log('- ' + [r.date, r.concept, r.result, r.conf, r.context, r.note, r.session].join(SEP));
  console.log(`${hits.length} line(s) for '${text}'`);
}

function cmdRename(from, to) {
  if (to.includes(SEP)) die("the new name can't contain ' · '");
  let n = 0;
  const out = read(progressPath()).split('\n').map((line) => {
    if (!line.startsWith('- 20')) return line;
    const f = line.slice(2).split(SEP);
    if (f.length === 7 && f[1] === from) {
      f[1] = to;
      n += 1;
      return '- ' + f.join(SEP);
    }
    return line;
  });
  if (n) fs.writeFileSync(progressPath(), out.join('\n'));
  console.log(`renamed '${from}' to '${to}' in ${n} line(s)`);
}

// ---------------------------------------------------------------- Profile

const profilePath = (course) => path.join(SESSIONS, `${course}.md`);

function readProfile(course) {
  const p = profilePath(course);
  if (!fs.existsSync(p)) return null;
  const text = read(p);
  const topics = [], sections = [];
  let inTopics = false, inSections = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('#### ')) {
      inTopics = line.trim() === '#### Topics';
      inSections = line.trim() === '#### Sections';
      continue;
    }
    if (inSections && line.startsWith('- ')) sections.push(line.slice(2).trim());
    if (inTopics && line.startsWith('| ') && !line.startsWith('| Topic')) {
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.length >= 3 && WEIGHT[cells[1]]) {
        const m = /^L([1-5])/.exec(cells[2]);
        topics.push({ topic: cells[0], weight: cells[1], target: m ? Number(m[1]) : 1 });
      }
    }
  }
  const all = (re) => [...text.matchAll(re)];
  const asked = all(/^- No exam scheduled · asked (\d{4}-\d{2}-\d{2})/gm).map((m) => m[1]).sort();
  return {
    topics, sections,
    exams: all(/^- \*\*(.+?)\*\* · (\d{4}-\d{2}-\d{2})/gm).map((m) => ({ name: m[1], date: m[2] })),
    manifest: all(/^- `(.+?)` · (.+?) · (\d{4}-\d{2}-\d{2})\s*$/gm).map((m) => ({ file: m[1], size: m[2], date: m[3] })),
    noExamAsked: asked.length ? asked[asked.length - 1] : null,
  };
}

function nextExam(profile) {
  const future = profile.exams.filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date));
  return future[0] || null;
}

// ---------------------------------------------------------------- Status

function groupBy(rows) {
  const by = new Map();
  for (const r of rows) {
    if (!by.has(r.concept)) by.set(r.concept, []);
    by.get(r.concept).push(r);
  }
  return by;
}

/** Facts per topic for the tutor's readiness review: best level, counts, recent results. */
function summary(rows, topics) {
  const mark = { correct: '✓', partial: '~', wrong: '✗', idk: '?' };
  const by = groupBy(rows);
  return topics.map((t) => {
    const rs = by.get(t.topic) || [];
    const correct = rs.filter((r) => r.result === 'correct');
    let best = 'none';
    if (correct.length) {
      const lvl = Math.max(...correct.map((r) => r.level));
      const onlyRetest = correct.filter((r) => r.level === lvl).every((r) => r.label === 'retest');
      best = `L${lvl}` + (onlyRetest ? ' (retest)' : '');
    }
    const recent = rs.slice(-6).map((r) => mark[r.result] + (r.label === 'retest' ? 'r' : '')).join('');
    return { ...t, best, graded: rs.length, recent: recent || '-', last: rs.length ? rs[rs.length - 1].date : '-' };
  });
}

/** Review status. Uses only each concept's first graded question in a session. */
function review(rows, examDate) {
  const weak = [], stale = [], graduated = [];
  const limit = examDate ? Math.max(1, Math.round(0.3 * daysBetween(today(), examDate))) : STALE;
  for (const [concept, rs] of groupBy(rows)) {
    const firsts = new Map();
    for (const r of rs) if (!firsts.has(r.session)) firsts.set(r.session, r);
    const latest = firsts.get(rs[rs.length - 1].session);
    if (latest.result !== 'correct') weak.push([concept, latest.conf]);
    if ([...firsts.values()].filter((r) => r.result === 'correct').length >= 3) graduated.push(concept);
    const last = rs.map((r) => r.date).sort().pop();
    if (daysBetween(last, today()) > limit) stale.push(concept);
  }
  const order = { high: 0, med: 1, low: 2, none: 3 };
  weak.sort((a, b) => order[a[1]] - order[b[1]]);
  return { weak, stale, graduated };
}

function printReview(rv, label) {
  console.log(`${label}weak (worst first): ` + (rv.weak.map(([c, k]) => `${c} (${k})`).join(', ') || 'none'));
  console.log('        stale: ' + (rv.stale.join(', ') || 'none') + ' · graduated: ' + (rv.graduated.join(', ') || 'none'));
}

/** Update only the factual Best level column; Readiness and Evidence are the tutor's. */
function writeProfile(course, summ) {
  const by = new Map(summ.map((t) => [t.topic, t]));
  let inTopics = false;
  const out = read(profilePath(course)).split('\n').map((line) => {
    if (line.startsWith('#### ')) {
      inTopics = line.trim() === '#### Topics';
    } else if (inTopics && line.startsWith('| ') && !line.startsWith('| Topic')) {
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (by.has(cells[0]) && cells.length === 7) {
        cells[4] = by.get(cells[0]).best;
        return '| ' + cells.join(' | ') + ' |';
      }
    }
    return line;
  });
  fs.writeFileSync(profilePath(course), out.join('\n'));
  console.log(`updated ${path.basename(profilePath(course))}`);
}

function cmdStatus(course, flags) {
  const profile = readProfile(course);
  if (!profile) die(`no profile at ${rel(profilePath(course))} (calibrate first)`);
  const ex = nextExam(profile);
  const { rows: allRows, bad } = readProgress();
  const names = new Set(profile.topics.map((t) => t.topic));
  // evidence is shared by concept name: lines from topic sessions or other courses count too
  const rows = allRows.filter((r) => names.has(r.concept) || r.context === course);
  const summ = summary(rows, profile.topics);
  const rv = review(rows, ex ? ex.date : null);
  const unknown = [...new Set(rows.filter((r) => r.context === course && !names.has(r.concept)).map((r) => r.concept))].sort();
  if (flags.write) writeProfile(course, summ);
  if (flags.json) {
    console.log(JSON.stringify({ topics: summ, review: rv, progress_concepts_not_in_profile: unknown,
                                 malformed_lines: bad.map((b) => b.n) }, null, 1));
    return;
  }
  warnBad(bad);
  if (!profile.topics.length) {
    console.log('no topic table in the profile yet (exam prep builds it)');
  } else {
    console.log('Evidence for the readiness review (recent: last 6 results, oldest first; ✓ correct, ~ partial, ✗ wrong, ? idk, r = retest)');
    console.log(`${'Topic'.padEnd(34)} W  Target  Best          Graded  Last        Recent`);
    for (const t of [...summ].sort((a, b) => WEIGHT[b.weight] - WEIGHT[a.weight])) {
      console.log(`${t.topic.slice(0, 34).padEnd(34)} ${t.weight}  L${t.target}      ${t.best.padEnd(13)} ${String(t.graded).padEnd(7)} ${t.last.padEnd(11)} ${t.recent}`);
    }
  }
  printReview(rv, 'Review: ');
  if (unknown.length) console.log("Progress concepts not in the profile's topic table: " + unknown.join(', '));
}

// ---------------------------------------------------------------- Start

function sessionFiles(name) {
  if (!isDir(SESSIONS)) return [];
  const prefix = /^\d{4}-\d{2}-\d{2} /;
  return fs.readdirSync(SESSIONS)
    .filter((f) => f.endsWith('.md') && prefix.test(f) && (!name || f.slice(11).toLowerCase().startsWith(name.toLowerCase())))
    .sort();
}

function planState(file) {
  const lines = read(path.join(SESSIONS, file)).split('\n');
  const start = lines.findIndex((l) => l.trim() === '#### Plan');
  if (start < 0) return { done: 0, open: [] };
  let end = lines.findIndex((l, i) => i > start && l.startsWith('#### '));
  if (end < 0) end = lines.length;
  const plan = lines.slice(start + 1, end);
  return {
    done: plan.filter((l) => /^- \[[xX]\] /.test(l)).length,
    open: plan.filter((l) => l.startsWith('- [ ] ')).map((l) => l.slice(6)),
  };
}

function walk(dir, depth, onDir, onFile) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (onDir && onDir(p) === false) continue;
      if (depth > 0) walk(p, depth - 1, onDir, onFile);
    } else if (onFile) {
      onFile(p);
    }
  }
}

/** The first folder named like the course or topic under a materials root. */
function materialsFolder(name) {
  let hit = null;
  for (const root of CONFIG.materials.map(expand)) {
    if (!isDir(root) || hit) continue;
    walk(root, 3, (p) => {
      if (!hit && path.basename(p).toLowerCase() === name.toLowerCase()) hit = p;
      return !hit;
    });
  }
  return hit;
}

function filesToInventory(folder, profile) {
  const manifest = new Map(profile.manifest.map((m) => [m.file, m.date]));
  const todo = [];
  const files = [];
  walk(folder, 6, null, (p) => files.push(p));
  for (const p of files.sort()) {
    const r = path.relative(folder, p).split(path.sep).join('/');
    if (!manifest.has(r)) todo.push(`new: ${r}`);
    else if (localDate(fs.statSync(p).mtime) > manifest.get(r)) todo.push(`changed: ${r}`);
  }
  for (const f of manifest.keys()) if (!fs.existsSync(path.join(folder, f))) todo.push(`missing on disk: ${f}`);
  return todo;
}

function printLastSession(name) {
  const files = sessionFiles(name);
  if (!files.length) {
    console.log('last session: none');
    return files;
  }
  const last = files[files.length - 1];
  const { done, open } = planState(last);
  console.log(`last session: ${last} · plan: ${done} done, ${open.length} open`);
  for (const step of open) console.log(`  open: ${step}`);
  return files;
}

const wikiRoot = (from) => {
  for (let d = from; ; d = path.dirname(d)) {
    if (isDir(path.join(d, '.obsidian'))) return d;
    if (path.dirname(d) === d) return null;
  }
};

function profiles() {
  if (!isDir(SESSIONS)) return [];
  return fs.readdirSync(SESSIONS)
    .filter((f) => f.endsWith('.md') && !/^\d{4}-\d{2}-\d{2} /.test(f) && f !== 'Progress.md')
    .filter((f) => /^#### (Exams|Sections|Topics)\s*$/m.test(read(path.join(SESSIONS, f))))
    .map((f) => f.slice(0, -3));
}

function printHeader() {
  console.log(`today: ${today()} · workspace: ${ROOT} · sessions: ${rel(SESSIONS)}/`);
  console.log(wikiRoot(ROOT)
    ? 'wiki-link workspace (Obsidian): yes → no [[ and no #tags anywhere in the sessions folder'
    : 'wiki-link workspace: no');
}

function cmdOverview() {
  printHeader();
  const ps = profiles();
  console.log('courses: ' + (ps.length ? '' : 'none yet'));
  for (const c of ps) {
    const ex = nextExam(readProfile(c));
    console.log(`  ${c}` + (ex ? ` · next exam: ${ex.name} ${ex.date} (${daysBetween(today(), ex.date)} days)` : ''));
  }
  const recent = sessionFiles('').slice(-5);
  console.log('recent sessions: ' + (recent.length ? '' : 'none yet'));
  for (const f of recent) console.log(`  ${f}`);
}

function cmdStart(arg) {
  if (!arg) return cmdOverview();
  printHeader();
  ensureSessions();
  const profile = readProfile(arg);
  const folder = materialsFolder(arg);
  const noFolder = `none found (looked for a folder named '${arg}' under: ${CONFIG.materials.join(', ')})`;
  if (!profile) {
    const files = sessionFiles(arg);
    if (!files.length) {
      console.log(`source: NEW ('${arg}' has no profile and no earlier sessions)`);
      console.log('  → a course if the learner studies it over time with materials or exams (then create its profile); otherwise a topic. Ask only if their message leaves it unclear (SKILL.md §1)');
      console.log(`materials: ${folder ? rel(folder) + '/' : noFolder}`);
      console.log('suggested mode: learning');
      return;
    }
    console.log(`source: topic ('${arg}' has sessions but no course profile) · mode: learning`);
    console.log(`materials: ${folder ? rel(folder) + '/' : noFolder}`);
    printLastSession(arg);
    const stems = new Set(files.map((f) => f.slice(0, -3)));
    const { rows, bad } = readProgress();
    warnBad(bad);
    const concepts = new Set(rows.filter((r) => stems.has(r.session)).map((r) => r.concept));
    if (concepts.size) printReview(review(rows.filter((r) => concepts.has(r.concept)), null), 'review: ');
    return;
  }
  console.log(`source: course · profile: ${rel(profilePath(arg))}`);
  const ex = nextExam(profile);
  const days = ex ? daysBetween(today(), ex.date) : null;
  if (ex) console.log(`next exam: ${ex.name} ${ex.date} (${days} days)`);
  else if (profile.noExamAsked && daysBetween(profile.noExamAsked, today()) < ASK_AGAIN) {
    console.log(`next exam: none scheduled (asked ${profile.noExamAsked}; don't ask again yet)`);
  } else console.log('next exam: none recorded → ask whether one is coming (SKILL.md §1 step 2)');
  console.log('suggested mode: ' + (ex && days <= EXAM_WINDOW ? `exam prep (exam within ${EXAM_WINDOW} days; confirm)` : 'learning'));
  console.log('sections covered: ' + (profile.sections.length ? '' : 'none yet'));
  for (const s of profile.sections.slice(-5)) console.log(`  ${s}`);
  console.log(`materials: ${folder ? rel(folder) + '/' : noFolder + ' → remind the learner (exam.md start)'}`);
  if (folder) {
    const todo = filesToInventory(folder, profile);
    console.log('inventory (exam prep): ' + (!profile.manifest.length ? 'none yet → build it if exam prep'
      : !todo.length ? 'up to date' : 'to update:'));
    if (profile.manifest.length) for (const t of todo) console.log(`  ${t}`);
  }
  printLastSession(arg);
  if (profile.topics.length) {
    console.log('---');
    cmdStatus(arg, {});
  }
}

// ---------------------------------------------------------------- Check

/** Lines with a wiki link or tag, ignoring code and math (where [[ and # are ordinary characters). */
function linkHits(text) {
  const hits = [];
  let fenced = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return;
    }
    if (fenced) return;
    const bare = line.replace(/`[^`]*`/g, '').replace(/\$[^$]*\$/g, '');
    if (bare.includes('[[') || /(^|\s)#[A-Za-z][\w/-]*/.test(bare)) hits.push(i + 1);
  });
  return hits;
}

function cmdCheck() {
  const { rows, bad } = readProgress();
  warnBad(bad);
  console.log(`Progress: ${rows.length} valid lines, ${bad.length} malformed`);
  if (!wikiRoot(ROOT) || !isDir(SESSIONS)) return;
  let n = 0;
  for (const f of fs.readdirSync(SESSIONS).filter((x) => x.endsWith('.md')).sort()) {
    const hits = linkHits(read(path.join(SESSIONS, f)));
    if (hits.length) console.log(`LINK OR TAG in ${f}: line ${hits.join(', ')} (remove it, unless it's math or code)`);
    n += hits.length;
  }
  console.log(`Links and tags in ${rel(SESSIONS)}/: ${n}`);
}

// ---------------------------------------------------------------- Show

function sessionFile(name) {
  const file = path.join(SESSIONS, name.endsWith('.md') ? name : name + '.md');
  if (!fs.existsSync(file)) die(`no session file ${rel(file)}`);
  return file;
}

function run(cmd, args, opts) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 10000, ...opts });
  return { ok: !r.error && r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

function systemOpen(target) {
  if (process.platform === 'darwin') return run('open', [target]).ok;
  if (process.platform === 'win32') return run(`start "" "${target}"`, [], { shell: true }).ok;
  return run('xdg-open', [target]).ok;
}

function openObsidian(file, heading, vault) {
  const vaultPath = path.relative(vault, file).split(path.sep).join('/');
  // fixed script; inputs are JSON-quoted
  const js = `const f=app.vault.getAbstractFileByPath(${JSON.stringify(vaultPath)});` +
    'const hs=(app.metadataCache.getFileCache(f)||{}).headings||[];' +
    `const h=hs.filter(x=>x.heading.includes(${JSON.stringify(heading)})).pop();` +
    "const line=h?h.position.start.line:0;app.workspace.getLeaf(false).openFile(f,{eState:{line:line}});'line '+line";
  for (const bin of [OBSIDIAN_MAC, 'obsidian']) {
    if (path.isAbsolute(bin) && !fs.existsSync(bin)) continue;
    const r = run(bin, ['eval', `code=${js}`]);
    if (r.ok && r.out.includes('line')) return 'in Obsidian, scrolled to the heading';
  }
  if (systemOpen(`obsidian://open?path=${encodeURIComponent(file)}`)) {
    return 'in Obsidian at the top (turn on the Obsidian CLI in Settings → General → Advanced to scroll to the heading)';
  }
  return null;
}

function cmdShow(name, heading) {
  const file = sessionFile(name);
  const lines = read(file).split('\n');
  let line = 1;
  lines.forEach((l, i) => {
    if (heading && l.startsWith('#') && l.includes(heading)) line = i + 1;
  });
  const where = `${rel(file)}:${line}`;
  const mode = CONFIG.open;
  let how = null;
  if (mode === 'none') {
    how = 'not opened (open is "none")';
  } else if (mode.includes('{file}')) {
    const cmd = mode.replace('{file}', `"${file}"`).replace('{line}', String(line));
    how = run(cmd, [], { shell: true }).ok ? `with: ${cmd}` : null;
  } else {
    const vault = wikiRoot(path.dirname(file));
    if (vault && mode !== 'system') how = openObsidian(file, heading, vault);
    if (!how && process.env.TERM_PROGRAM === 'vscode' && run('code', ['-g', `${file}:${line}`], { shell: process.platform === 'win32' }).ok) {
      how = 'in VS Code';
    }
    if (!how && systemOpen(file)) how = "in the system's default app for .md files";
  }
  console.log(how ? `opened ${where} ${how}` : `could not open an editor: tell the learner to open ${where}`);
}

// ---------------------------------------------------------------- Scratch

function scratchDir(name) {
  const stem = path.basename(name).replace(/\.md$/, '');
  return path.join(ROOT, '.learn', 'scratch', stem);
}

function cmdScratch(name) {
  const dir = scratchDir(name);
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(ROOT, '.learn', 'scratch', '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '*\n');
  console.log(rel(dir) + '/');
}

function cmdClean(name, keep) {
  const dir = scratchDir(name);
  if (!isDir(dir)) return console.log('nothing to clean');
  let kept = 0, removed = 0;
  for (const f of fs.readdirSync(dir)) {
    if (keep && (f === 'keys.md' || f.startsWith('prefetch-'))) {
      kept += 1;
      continue;
    }
    fs.rmSync(path.join(dir, f), { recursive: true, force: true });
    removed += 1;
  }
  if (!kept) fs.rmdirSync(dir);
  console.log(`removed ${removed} scratch file(s), kept ${kept}`);
}

// ---------------------------------------------------------------- Verify

/** Fallback for when the `verifier` subagent isn't available: the same prompt in a fresh headless Gemini. */
function cmdVerify(briefFile) {
  const brief = read(expand(briefFile));
  const prompt = read(path.join(__dirname, '..', 'verifier.md')) + '\n\n---\n\n# Brief from the tutor\n\n' + brief;
  const outside = CONFIG.materials.map(expand).filter((d) => isDir(d) && path.relative(ROOT, d).startsWith('..'));
  const args = ['-p', 'Follow the instructions on stdin and answer the brief.', '-o', 'text'];
  if (outside.length) args.push('--include-directories', outside.join(','));
  const win = process.platform === 'win32';
  const r = spawnSync(process.env.LEARN_GEMINI || 'gemini', win ? args.map((a) => (/\s/.test(a) ? `"${a}"` : a)) : args,
    { input: prompt, cwd: ROOT, encoding: 'utf8', timeout: 15 * 60 * 1000, shell: win, maxBuffer: 16 * 1024 * 1024 });
  if (r.error || r.status !== 0) {
    die(`verifier run failed (${r.error ? r.error.message : 'exit ' + r.status}): ${(r.stderr || '').trim().slice(-400)}\n` +
        '→ mark the items unverified, or drop them');
  }
  console.log(r.stdout.trim());
}

// ---------------------------------------------------------------- Main

function main(argv) {
  const take = (flag) => {
    const i = argv.indexOf(flag);
    if (i < 0) return null;
    if (i + 1 >= argv.length) die(`${flag} needs a value`);
    return argv.splice(i, 2)[1];
  };
  const has = (flag) => {
    const i = argv.indexOf(flag);
    if (i >= 0) argv.splice(i, 1);
    return i >= 0;
  };
  const root = take('--root');
  if (root) ROOT = path.resolve(root.replace(/^~(?=$|[\\/])/, os.homedir()));
  CONFIG = loadConfig();
  const sessions = take('--sessions');
  SESSIONS = expand(sessions || CONFIG.sessions);
  const flags = { json: has('--json'), write: has('--write'), keep: has('--keep') };
  const [cmd, a, b] = argv;
  const usage = () => die(read(__filename).split('/*')[1].split('*/')[0].trim());
  if (cmd === 'start') cmdStart(a);
  else if (cmd === 'log') cmdLog(argv.slice(1));
  else if (cmd === 'status' && a) cmdStatus(a, flags);
  else if (cmd === 'history' && a) cmdHistory(a);
  else if (cmd === 'rename' && a && b) cmdRename(a, b);
  else if (cmd === 'check') cmdCheck();
  else if (cmd === 'show' && a) cmdShow(a, b || '');
  else if (cmd === 'scratch' && a) cmdScratch(a);
  else if (cmd === 'clean' && a) cmdClean(a, flags.keep);
  else if (cmd === 'verify' && a) cmdVerify(a);
  else usage();
}

main(process.argv.slice(2));
