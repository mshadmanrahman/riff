"""Eval: no_em_dashes

Riff drafts must contain zero em dashes and zero double-hyphen substitutes.

This is the "dumbest eval that might work" per Teresa's Interview Coach method.
It targets a failure mode that Shadman has flagged repeatedly: em-dash drift in
LinkedIn replies. The skill's "Don't" list calls it out explicitly. The global
no-em-dashes rule calls it out. And it still slips through.

A regex catches every instance, has zero false positives on Shadman's voice
(he genuinely never uses them), and runs in microseconds. It is the perfect
starter eval.

Usage (standalone):
    python3 no_em_dashes.py <draft.md>

Exit codes:
    0 = pass (zero em dashes)
    1 = fail (at least one em dash or double-hyphen)
    2 = usage error
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

# Long em dash (U+2014), en dash (U+2013) when used em-style, and the
# double-hyphen substitute that Markdown sometimes auto-converts. We do NOT
# flag single hyphens or hyphenated words.
_EM_DASH_PATTERN = re.compile(r"(—|–| -- | --$|^-- )")


@dataclass(frozen=True)
class Hit:
    line_number: int
    line: str
    matched: str


@dataclass(frozen=True)
class EvalResult:
    passed: bool
    hits: tuple[Hit, ...]


def evaluate(draft: str, context: str = "") -> EvalResult:
    """Return PASS if the draft contains no em dashes, FAIL otherwise.

    `context` is accepted for runner compatibility but unused here. Em-dash
    presence is purely a property of the draft text.
    """
    hits: list[Hit] = []
    for line_no, line in enumerate(draft.splitlines(), start=1):
        for match in _EM_DASH_PATTERN.finditer(line):
            hits.append(Hit(line_number=line_no, line=line, matched=match.group(0)))
    return EvalResult(passed=not hits, hits=tuple(hits))


def _smoke_test() -> None:
    """Minimal self-check. Run: python3 no_em_dashes.py --smoke"""
    clean = "Quote their best line. Add one specific. Offer to help."
    em_dash = "Quote their best line—that's the move."
    double_hyphen = "Quote their best line -- that's the move."
    en_dash = "Quote their best line–that's the move."

    assert evaluate(clean).passed, "clean draft should pass"
    assert not evaluate(em_dash).passed, "em dash should fail"
    assert not evaluate(double_hyphen).passed, "double-hyphen should fail"
    assert not evaluate(en_dash).passed, "en dash used em-style should fail"
    print("smoke test OK")


def main(argv: Sequence[str]) -> int:
    if len(argv) == 2 and argv[1] == "--smoke":
        _smoke_test()
        return 0
    if len(argv) != 2:
        print("usage: no_em_dashes.py <draft.md>", file=sys.stderr)
        return 2

    draft_path = Path(argv[1])
    result = evaluate(draft_path.read_text())

    status = "PASS" if result.passed else "FAIL"
    print(f"{status}: {len(result.hits)} em-dash hits in {draft_path.name}")
    for hit in result.hits:
        snippet = hit.line.strip()[:80]
        print(f"  line {hit.line_number}: {snippet}")
    return 0 if result.passed else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
