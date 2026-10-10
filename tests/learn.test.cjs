'use strict';
// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const LEARN = path.join(REPO, 'skills', 'learn', 'scripts', 'learn.cjs');
const GUARD = path.join(REPO, 'hooks', 'progress-guard.cjs');
const TODAY = '2026-10-20';

function workspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'learn-test-'));
}

function learn(root, ...args) {
  const r = spawnSync('node', [LEARN, ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, LEARN_TODAY: TODAY, TERM_PROGRAM: '' } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

const line = (date, concept, result, conf, session, note = 'L3: x', ctx = 'BIO 101') =>
  [date, concept, result, conf, ctx, note, session].join(' · ');

const PROFILE = `---
cssclasses:
  - session
---
## BIO 101
---
#### Exams
- **Midterm 1** · 2026-10-30 · ch 1-4, 50 min, no aids

#### Sections
- Campbell §9.1 Glycolysis · 2026-10-12 · notes: Glycolysis

#### Topics
| Topic | Weight | Target | Problem types | Best level | Readiness | Evidence |
|---|---|---|---|---|---|---|
| Glycolysis | H | L3 | net ATP accounting | none | untested | |
| Krebs Cycle | M | L2 | inputs and outputs | none | untested | |

#### Problem inventory
- \`HW1.pdf\` · 3 pages · 2026-10-01
`;

test('start bootstraps a new workspace and reports a new name', () => {
  const ws = workspace();
  const r = learn(ws, 'start', 'the French Revolution');
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /today: 2026-10-20/);
  assert.match(r.out, /source: NEW/);
  assert.match(r.out, /wiki-link workspace: no/);
  assert.ok(fs.existsSync(path.join(ws, 'Sessions', 'Progress.md')));
});

test('log validates all lines before writing any', () => {
  const ws = workspace();
  const good = line('2026-10-12', 'Glycolysis', 'correct', 'high', '2026-10-12 BIO 101');
  const bad = [
    line('2026-10-12', 'Glycolysis', 'right', 'high', 's'),
    line('2026-10-12', 'Glycolysis', 'correct', 'sure', 's'),
    line('2026-10-12', 'Glycolysis', 'correct', 'high', 's', 'missed a step'),
    line('2026-13-45', 'Glycolysis', 'correct', 'high', 's'),
    line('2026-10-12', 'Glycolysis', 'correct', 'high', 's', 'L3: a · b'),
  ];
  for (const b of bad) {
    const r = learn(ws, 'log', good, b);
    assert.strictEqual(r.code, 1, b);
    assert.match(r.err, /REJECTED/);
  }
  assert.match(learn(ws, 'check').out, /Progress: 0 valid lines, 0 malformed/);
  const ok = learn(ws, 'log', good, '- ' + line('2026-10-12', 'Krebs Cycle', 'idk', 'none', '2026-10-12 BIO 101', 'L2 probe: blank'));
  assert.strictEqual(ok.code, 0, ok.err);
  assert.match(learn(ws, 'check').out, /Progress: 2 valid lines, 0 malformed/);
  assert.match(learn(ws, 'history', 'glycolysis').out, /1 line\(s\)/);
  assert.match(learn(ws, 'history', 'BIO 101').out, /2 line\(s\)/);
});

test('log flags new concept names and rename fixes them', () => {
  const ws = workspace();
  learn(ws, 'log', line('2026-10-12', 'Glycolysis', 'correct', 'high', 's1'));
  const r = learn(ws, 'log', line('2026-10-13', 'Glycolisis', 'wrong', 'low', 's2'));
  assert.match(r.out, /new concept name\(s\): Glycolisis/);
  assert.match(learn(ws, 'rename', 'Glycolisis', 'Glycolysis').out, /in 1 line/);
  assert.match(learn(ws, 'history', 'Glycolysis').out, /2 line\(s\)/);
});

test('course start: exam window, sections, inventory diff, review status', () => {
  const ws = workspace();
  fs.mkdirSync(path.join(ws, 'Sessions'));
  fs.mkdirSync(path.join(ws, 'Materials', 'Fall', 'BIO 101', 'Held Out'), { recursive: true });
  fs.writeFileSync(path.join(ws, 'Materials', 'Fall', 'BIO 101', 'HW2.pdf'), 'x');
  fs.writeFileSync(path.join(ws, 'Sessions', 'BIO 101.md'), PROFILE);
  fs.writeFileSync(path.join(ws, 'Sessions', '2026-10-12 BIO 101 Ch9.md'),
    '## BIO 101\n#### Plan\n- [x] Glycolysis\n- [ ] Krebs Cycle\n- [ ] write: Krebs Cycle\n');
  learn(ws, 'log',
    line('2026-10-01', 'Glycolysis', 'correct', 'med', 'a'),
    line('2026-10-05', 'Glycolysis', 'correct', 'med', 'b'),
    line('2026-10-12', 'Glycolysis', 'correct', 'high', '2026-10-12 BIO 101 Ch9', 'L4: edge case'),
    line('2026-10-12', 'Krebs Cycle', 'wrong', 'high', '2026-10-12 BIO 101 Ch9', 'L2: swapped inputs'),
    line('2026-10-12', 'Krebs Cycle', 'correct', 'med', '2026-10-12 BIO 101 Ch9', 'L2 retest: fixed'));
  const r = learn(ws, 'start', 'BIO 101');
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /source: course/);
  assert.match(r.out, /next exam: Midterm 1 2026-10-30 \(10 days\)/);
  assert.match(r.out, /suggested mode: exam prep/);
  assert.match(r.out, /Campbell §9\.1 Glycolysis/);
  assert.match(r.out, /materials: Materials\/Fall\/BIO 101\//);
  assert.match(r.out, /new: HW2\.pdf/);
  assert.match(r.out, /missing on disk: HW1\.pdf/);
  assert.match(r.out, /plan: 1 done, 2 open/);
  assert.match(r.out, /open: write: Krebs Cycle/);
  // weak = first attempt of the latest session missed, even though the retest passed
  assert.match(r.out, /weak \(worst first\): Krebs Cycle \(high\)/);
  // stale limit with an exam 10 days out is 3 days; both were last tested 8 days ago
  assert.match(r.out, /stale: Glycolysis, Krebs Cycle · graduated: Glycolysis/);

  learn(ws, 'status', 'BIO 101', '--write');
  const profile = fs.readFileSync(path.join(ws, 'Sessions', 'BIO 101.md'), 'utf8');
  assert.match(profile, /\| Glycolysis \| H \| L3 \| net ATP accounting \| L4 \| untested \|/);
  assert.match(profile, /\| Krebs Cycle \| M \| L2 \| inputs and outputs \| L2 \(retest\) \| untested \|/);
  const json = JSON.parse(learn(ws, 'status', 'BIO 101', '--json').out);
  assert.strictEqual(json.topics[0].graded, 3);

  assert.match(learn(ws, 'start').out, /BIO 101 · next exam: Midterm 1/);
});

test('a name with sessions but no profile is a topic', () => {
  const ws = workspace();
  fs.mkdirSync(path.join(ws, 'Sessions'));
  fs.writeFileSync(path.join(ws, 'Sessions', '2026-10-01 Fourier transforms.md'), '#### Plan\n- [ ] Convolution\n');
  learn(ws, 'log', line('2026-10-01', 'Convolution', 'partial', 'low', '2026-10-01 Fourier transforms', 'L3: x', 'general'));
  const r = learn(ws, 'start', 'Fourier transforms');
  assert.match(r.out, /source: topic/);
  assert.match(r.out, /open: Convolution/);
  assert.match(r.out, /weak \(worst first\): Convolution \(low\)/);
  assert.match(r.out, /stale: Convolution/);
});

test('check lints links and tags only in a wiki-link workspace, ignoring math and code', () => {
  const ws = workspace();
  fs.mkdirSync(path.join(ws, 'Sessions'));
  const body = 'See [[Glycolysis]] here\nand a #tag here\n$a #b$ and `[[x]]` are fine\n```mermaid\nclassDef k fill:#10291f\nA[[x]]\n```\n#### Heading\n';
  fs.writeFileSync(path.join(ws, 'Sessions', '2026-10-01 X.md'), body);
  assert.doesNotMatch(learn(ws, 'check').out, /LINK OR TAG/);
  fs.mkdirSync(path.join(ws, '.obsidian'));
  const r = learn(ws, 'check');
  assert.match(r.out, /LINK OR TAG in 2026-10-01 X\.md: line 1, 2\b/);
  assert.match(r.out, /: 2$/m);
  assert.match(learn(ws, 'start', 'X').out, /wiki-link workspace \(Obsidian\): yes/);
});

test('show finds the last matching heading; scratch and clean manage the scratch folder', () => {
  const ws = workspace();
  fs.mkdirSync(path.join(ws, 'Sessions'));
  fs.mkdirSync(path.join(ws, '.learn'));
  fs.writeFileSync(path.join(ws, '.learn', 'config.json'), '{"open": "none"}');
  fs.writeFileSync(path.join(ws, 'Sessions', '2026-10-01 X.md'), '## X\n#### ==Q1== A `L1` `s`\ntext ==Q2== not a heading\n#### ==Q2== B `L2` `s`\n');
  assert.match(learn(ws, 'show', '2026-10-01 X', '==Q2==').out, /Sessions\/2026-10-01 X\.md:4/);
  assert.match(learn(ws, 'show', '2026-10-01 X.md').out, /X\.md:1/);
  assert.strictEqual(learn(ws, 'show', 'nope').code, 1);

  assert.match(learn(ws, 'scratch', '2026-10-01 X.md').out, /^\.learn\/scratch\/2026-10-01 X\/$/m);
  const dir = path.join(ws, '.learn', 'scratch', '2026-10-01 X');
  for (const f of ['keys.md', 'prefetch-1.md', 'book-ch2.txt']) fs.writeFileSync(path.join(dir, f), 'x');
  assert.match(learn(ws, 'clean', '2026-10-01 X', '--keep').out, /removed 1 scratch file\(s\), kept 2/);
  assert.match(learn(ws, 'clean', '2026-10-01 X').out, /removed 2 scratch file\(s\), kept 0/);
  assert.ok(!fs.existsSync(dir));
});

test('config can move the sessions and materials folders', () => {
  const ws = workspace();
  const mats = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-mats-'));
  fs.mkdirSync(path.join(mats, 'CHEM 1A'));
  fs.mkdirSync(path.join(ws, '.learn'));
  fs.writeFileSync(path.join(ws, '.learn', 'config.json'), JSON.stringify({ sessions: 'Tutor', materials: [mats] }));
  const r = learn(ws, 'start', 'chem 1a');
  assert.match(r.out, /sessions: Tutor\//);
  assert.match(r.out, /materials: .*CHEM 1A\//);
  assert.ok(fs.existsSync(path.join(ws, 'Tutor', 'Progress.md')));
});

test('verify sends the verifier prompt and the brief to a headless process', () => {
  const ws = workspace();
  const fake = path.join(ws, 'fake-gemini.cjs');
  fs.writeFileSync(fake, "#!/usr/bin/env node\nconst s=require('fs').readFileSync(0,'utf8');console.log((s.includes('independent verifier')&&s.includes('Q1 what is 2+2'))?'Q1\\nAnswer: 4':'BAD');");
  fs.chmodSync(fake, 0o755);
  fs.writeFileSync(path.join(ws, 'brief.md'), 'Q1 what is 2+2');
  const r = spawnSync('node', [LEARN, 'verify', 'brief.md'], { cwd: ws, encoding: 'utf8', env: { ...process.env, LEARN_GEMINI: fake } });
  if (process.platform !== 'win32') assert.match(r.stdout, /Answer: 4/, r.stderr);
});

test('the progress guard blocks rewriting Progress.md and nothing else', () => {
  const guard = (file_path) => spawnSync('node', [GUARD], { input: JSON.stringify({ cwd: '/w', tool_name: 'write_file', tool_input: { file_path } }), encoding: 'utf8' });
  assert.strictEqual(guard('/w/Sessions/Progress.md').status, 2);
  assert.strictEqual(guard('Sessions/Progress.md').status, 2);
  assert.strictEqual(guard('/w/Sessions/2026-10-01 X.md').status, 0);
  assert.strictEqual(guard('/w/Notes/Progress.md').status, 0);
  assert.strictEqual(spawnSync('node', [GUARD], { input: 'not json', encoding: 'utf8' }).status, 0);
});

test('the verifier subagent and the skill copy of its prompt stay identical', () => {
  const agent = fs.readFileSync(path.join(REPO, 'agents', 'verifier.md'), 'utf8');
  const body = agent.split(/^---\s*$/m).slice(2).join('---').trim();
  assert.strictEqual(body, fs.readFileSync(path.join(REPO, 'skills', 'learn', 'verifier.md'), 'utf8').trim());
});
