#!/usr/bin/env node
'use strict';
/* BeforeTool guard: Sessions/Progress.md is append-only.

Blocks write_file / replace on a sessions folder's Progress.md (exit 2, reason on stderr),
so the history can't be rewritten by accident. `learn.cjs log` appends to it directly and is unaffected.
*/
const fs = require('fs');
const path = require('path');

let data = {};
try {
  data = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  process.exit(0);
}
const file = String((data.tool_input || {}).file_path || '');
if (path.basename(file) !== 'Progress.md') process.exit(0);

let sessions = 'Sessions';
try {
  const cfg = JSON.parse(fs.readFileSync(path.join(data.cwd || process.cwd(), '.learn', 'config.json'), 'utf8'));
  if (cfg.sessions) sessions = cfg.sessions;
} catch (e) { /* no config: default folder name */ }

const parent = path.basename(path.dirname(path.resolve(data.cwd || process.cwd(), file)));
if (parent === 'Sessions' || parent === path.basename(sessions)) {
  console.error("Progress.md is append-only: add lines with  learn.cjs log '<line>'  (learn skill, SKILL.md §9); rename a concept with  learn.cjs rename");
  process.exit(2);
}
process.exit(0);
