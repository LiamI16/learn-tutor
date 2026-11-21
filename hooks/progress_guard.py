#!/usr/bin/env python3
"""PreToolUse guard: Sessions/Progress.md and Sessions/Verifier Log.md are append-only.

Blocks Write/Edit of either file in a sessions folder (exit 2, reason on stderr), so the
history can't be rewritten by accident. `learn.py log` and `learn.py vlog` append to them
directly and are unaffected.
"""
import json
import os
import sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
path = str((data.get("tool_input") or {}).get("file_path") or "")
name = os.path.basename(path)
if name not in ("Progress.md", "Verifier Log.md"):
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
    if name == "Progress.md":
        print("Progress.md is append-only: add lines with  learn.py log '<line>'  (learn skill, SKILL.md §9); "
              "rename a concept with  learn.py rename", file=sys.stderr)
    else:
        print("Verifier Log.md is append-only: add lines with  learn.py vlog '<line>'  (learn skill, SKILL.md §7)",
              file=sys.stderr)
    sys.exit(2)
sys.exit(0)
