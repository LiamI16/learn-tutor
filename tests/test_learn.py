"""Run with: python3 -m unittest discover tests"""
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LEARN = REPO / "skills" / "learn" / "scripts" / "learn.py"
GUARD = REPO / "hooks" / "progress_guard.py"
TODAY = "2026-10-20"

PROFILE = """---
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
- `HW1.pdf` · 3 pages · 2026-10-01
"""


def workspace():
    return Path(tempfile.mkdtemp(prefix="learn-test-")).resolve()


def learn(root, *args):
    env = {**os.environ, "LEARN_TODAY": TODAY, "TERM_PROGRAM": "", "PYTHONIOENCODING": "utf-8"}
    r = subprocess.run([sys.executable, str(LEARN), *args], cwd=root, capture_output=True, text=True, encoding="utf-8", env=env)
    return r.returncode, r.stdout, r.stderr


def line(date, concept, result, conf, session, note="L3: x", ctx="BIO 101"):
    return " · ".join([date, concept, result, conf, ctx, note, session])


def put(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class LearnTests(unittest.TestCase):
    def test_start_bootstraps_a_new_workspace(self):
        ws = workspace()
        code, out, err = learn(ws, "start", "the French Revolution")
        self.assertEqual(code, 0, err)
        self.assertIn("today: 2026-10-20", out)
        self.assertIn("source: NEW", out)
        self.assertIn("wiki-link workspace: no", out)
        self.assertTrue((ws / "Sessions" / "Progress.md").exists())

    def test_log_validates_all_lines_before_writing_any(self):
        ws = workspace()
        good = line("2026-10-12", "Glycolysis", "correct", "high", "2026-10-12 BIO 101")
        bad = [
            line("2026-10-12", "Glycolysis", "right", "high", "s"),
            line("2026-10-12", "Glycolysis", "correct", "sure", "s"),
            line("2026-10-12", "Glycolysis", "correct", "high", "s", "missed a step"),
            line("2026-13-45", "Glycolysis", "correct", "high", "s"),
            line("2026-10-12", "Glycolysis", "correct", "high", "s", "L3: a · b"),
        ]
        for b in bad:
            code, _, err = learn(ws, "log", good, b)
            self.assertEqual(code, 1, b)
            self.assertIn("REJECTED", err)
        self.assertIn("Progress: 0 valid lines, 0 malformed", learn(ws, "check")[1])
        code, _, err = learn(ws, "log", good, "- " + line("2026-10-12", "Krebs Cycle", "idk", "none", "2026-10-12 BIO 101", "L2 probe: blank"))
        self.assertEqual(code, 0, err)
        self.assertIn("Progress: 2 valid lines, 0 malformed", learn(ws, "check")[1])
        self.assertIn("1 line(s)", learn(ws, "history", "glycolysis")[1])
        self.assertIn("2 line(s)", learn(ws, "history", "BIO 101")[1])

    def test_log_flags_new_concept_names_and_rename_fixes_them(self):
        ws = workspace()
        learn(ws, "log", line("2026-10-12", "Glycolysis", "correct", "high", "s1"))
        out = learn(ws, "log", line("2026-10-13", "Glycolisis", "wrong", "low", "s2"))[1]
        self.assertIn("new concept name(s): Glycolisis", out)
        self.assertIn("in 1 line", learn(ws, "rename", "Glycolisis", "Glycolysis")[1])
        self.assertIn("2 line(s)", learn(ws, "history", "Glycolysis")[1])

    def test_course_start_and_status(self):
        ws = workspace()
        put(ws / "Materials" / "Fall" / "BIO 101" / "HW2.pdf", "x")
        put(ws / "Materials" / "Fall" / "BIO 101" / ".hidden", "x")
        put(ws / "Sessions" / "BIO 101.md", PROFILE)
        put(ws / "Sessions" / "2026-10-12 BIO 101 Ch9.md",
            "## BIO 101\n#### Plan\n- [x] Glycolysis\n- [ ] Krebs Cycle\n- [ ] write: Krebs Cycle\n")
        learn(ws, "log",
              line("2026-10-01", "Glycolysis", "correct", "med", "a"),
              line("2026-10-05", "Glycolysis", "correct", "med", "b"),
              line("2026-10-12", "Glycolysis", "correct", "high", "2026-10-12 BIO 101 Ch9", "L4: edge case"),
              line("2026-10-12", "Krebs Cycle", "wrong", "high", "2026-10-12 BIO 101 Ch9", "L2: swapped inputs"),
              line("2026-10-12", "Krebs Cycle", "correct", "med", "2026-10-12 BIO 101 Ch9", "L2 retest: fixed"))
        code, out, err = learn(ws, "start", "BIO 101")
        self.assertEqual(code, 0, err)
        for expected in [
            "source: course",
            "next exam: Midterm 1 2026-10-30 (10 days)",
            "suggested mode: exam prep",
            "Campbell §9.1 Glycolysis",
            "materials: Materials/Fall/BIO 101/",
            "new: HW2.pdf",
            "missing on disk: HW1.pdf",
            "plan: 1 done, 2 open",
            "open: write: Krebs Cycle",
            # weak = first attempt of the latest session missed, even though the retest passed
            "weak (worst first): Krebs Cycle (high)",
            # stale limit with an exam 10 days out is 3 days; both were last tested 8 days ago
            "stale: Glycolysis, Krebs Cycle · graduated: Glycolysis",
        ]:
            self.assertIn(expected, out)
        self.assertNotIn(".hidden", out)

        learn(ws, "status", "BIO 101", "--write")
        profile = (ws / "Sessions" / "BIO 101.md").read_text(encoding="utf-8")
        self.assertIn("| Glycolysis | H | L3 | net ATP accounting | L4 | untested |", profile)
        self.assertIn("| Krebs Cycle | M | L2 | inputs and outputs | L2 (retest) | untested |", profile)
        data = json.loads(learn(ws, "status", "BIO 101", "--json")[1])
        self.assertEqual(data["topics"][0]["graded"], 3)
        self.assertIn("BIO 101 · next exam: Midterm 1", learn(ws, "start")[1])

    def test_sessions_without_a_profile_make_a_topic(self):
        ws = workspace()
        put(ws / "Sessions" / "2026-10-01 Fourier transforms.md", "#### Plan\n- [ ] Convolution\n")
        learn(ws, "log", line("2026-10-01", "Convolution", "partial", "low", "2026-10-01 Fourier transforms", "L3: x", "general"))
        out = learn(ws, "start", "Fourier transforms")[1]
        self.assertIn("source: topic", out)
        self.assertIn("open: Convolution", out)
        self.assertIn("weak (worst first): Convolution (low)", out)
        self.assertIn("stale: Convolution", out)

    def test_check_lints_links_only_in_a_wiki_workspace(self):
        ws = workspace()
        put(ws / "Sessions" / "2026-10-01 X.md",
            "See [[Glycolysis]] here\nand a #tag here\n$a #b$ and `[[x]]` are fine\n```mermaid\nclassDef k fill:#10291f\nA[[x]]\n```\n#### Heading\n")
        self.assertNotIn("LINK OR TAG", learn(ws, "check")[1])
        (ws / ".obsidian").mkdir()
        out = learn(ws, "check")[1]
        self.assertIn("LINK OR TAG in 2026-10-01 X.md: line 1, 2 ", out)
        self.assertTrue(out.strip().endswith(": 2"))
        self.assertIn("wiki-link workspace (Obsidian): yes", learn(ws, "start", "X")[1])

    def test_show_scratch_and_clean(self):
        ws = workspace()
        put(ws / ".learn" / "config.json", '{"open": "none"}')
        put(ws / "Sessions" / "2026-10-01 X.md", "## X\n#### ==Q1== A `L1` `s`\ntext ==Q2== not a heading\n#### ==Q2== B `L2` `s`\n")
        self.assertIn("Sessions/2026-10-01 X.md:4", learn(ws, "show", "2026-10-01 X", "==Q2==")[1])
        self.assertIn("X.md:1", learn(ws, "show", "2026-10-01 X.md")[1])
        self.assertEqual(learn(ws, "show", "nope")[0], 1)

        self.assertEqual(learn(ws, "scratch", "2026-10-01 X.md")[1].strip(), ".learn/scratch/2026-10-01 X/")
        d = ws / ".learn" / "scratch" / "2026-10-01 X"
        for f in ["keys.md", "prefetch-1.md", "book-ch2.txt"]:
            put(d / f, "x")
        self.assertIn("removed 1 scratch file(s), kept 2", learn(ws, "clean", "2026-10-01 X", "--keep")[1])
        self.assertIn("removed 2 scratch file(s), kept 0", learn(ws, "clean", "2026-10-01 X")[1])
        self.assertFalse(d.exists())

    def test_config_moves_sessions_and_materials(self):
        ws, mats = workspace(), workspace()
        (mats / "CHEM 1A").mkdir()
        put(ws / ".learn" / "config.json", json.dumps({"sessions": "Tutor", "materials": [str(mats)]}))
        out = learn(ws, "start", "chem 1a")[1]
        self.assertIn("sessions: Tutor/", out)
        self.assertRegex(out, r"materials: .*CHEM 1A/")
        self.assertTrue((ws / "Tutor" / "Progress.md").exists())

    def test_progress_guard(self):
        def guard(file_path, raw=None):
            payload = raw or json.dumps({"cwd": "/w", "tool_name": "Write", "tool_input": {"file_path": file_path}})
            return subprocess.run([sys.executable, str(GUARD)], input=payload, capture_output=True, text=True).returncode
        self.assertEqual(guard("/w/Sessions/Progress.md"), 2)
        self.assertEqual(guard("Sessions/Progress.md"), 2)
        self.assertEqual(guard("/w/Sessions/2026-10-01 X.md"), 0)
        self.assertEqual(guard("/w/Notes/Progress.md"), 0)
        self.assertEqual(guard("", raw="not json"), 0)

    def test_skill_files_name_only_tools_that_exist_here(self):
        text = "".join((REPO / "skills" / "learn" / f).read_text(encoding="utf-8") for f in ["SKILL.md", "learning.md", "exam.md"])
        for stale in ["ask_user", "read_file", "write_file", "learn.cjs", "Gemini"]:
            self.assertNotIn(stale, text)
        for cmd in set(re.findall(r"`learn ([a-z]+)", text)):
            self.assertIn(f"  learn.py {cmd}", LEARN.read_text(encoding="utf-8"), cmd)


if __name__ == "__main__":
    unittest.main()
