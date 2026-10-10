#!/usr/bin/env python3
"""PreToolUse guard: Sessions/Progress.md is append-only.

Blocks Write/Edit of a sessions folder's Progress.md (exit 2, reason on stderr), so the
history can't be rewritten by accident. `learn.py log` appends to it directly and is unaffected.
"""
import json
import os
import sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
path = str((data.get("tool_input") or {}).get("file_path") or "")
if os.path.basename(path) != "Progress.md":
    sys.exit(0)
cwd = data.get("cwd") or os.getcwd()
sessions = "Sessions"
try:
    with open(os.path.join(cwd, ".learn", "config.json"), encoding="utf-8") as f:
        sessions = json.load(f).get("sessions") or sessions
except Exception:
    pass
parent = os.path.basename(os.path.dirname(os.path.abspath(os.path.join(cwd, path))))
if parent in ("Sessions", os.path.basename(os.path.normpath(sessions))):
    print("Progress.md is append-only: add lines with  learn.py log '<line>'  (learn skill, SKILL.md §9); "
          "rename a concept with  learn.py rename", file=sys.stderr)
    sys.exit(2)
sys.exit(0)
