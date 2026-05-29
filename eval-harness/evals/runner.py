"""Riff evals runner.

Discovers every eval module in ./evals/ and runs them against every
(draft, context) pair listed in ./traces/<trace_id>.md frontmatter.

Trace files must carry frontmatter:
    ---
    trace_id: 2026-04-26-trace-01
    draft: drafts/2026-04-26-01.md
    context: inputs/2026-04-26-01.json
    mode: REPLY | COMMENT
    human_verdict: pass | fail | partial
    failure_one_liner: "Used a generic opener"
    ---

Eval modules expose `evaluate(draft: str, context: str) -> EvalResult | bool`.
The runner passes both. Most evals only read the draft; a few will read the
context too (e.g., did the reply quote the commenter's best line).

Agreement with human verdict is not computed by the runner. That is Teresa's
validation step and should be done by eye for the first ~20 traces before
investing in automation.

Usage:
    python3 runner.py
"""

from __future__ import annotations

import importlib.util
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence

ROOT = Path(__file__).parent
TRACES_DIR = ROOT / "traces"
EVALS_DIR = ROOT / "evals"

_FRONTMATTER = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)
_KV = re.compile(r"^([a-z_]+):\s*(.+?)\s*$", re.MULTILINE)


@dataclass(frozen=True)
class Trace:
    trace_id: str
    draft_path: Path
    context_path: Path
    mode: str
    human_verdict: str


def load_traces() -> Sequence[Trace]:
    out: list[Trace] = []
    for path in sorted(TRACES_DIR.glob("*.md")):
        if path.name.startswith("_"):
            continue
        raw = path.read_text()
        fm = _FRONTMATTER.search(raw)
        if not fm:
            continue
        fields = dict(_KV.findall(fm.group(1)))
        if "draft" not in fields or "context" not in fields:
            continue
        out.append(
            Trace(
                trace_id=fields.get("trace_id", path.stem),
                draft_path=(ROOT / fields["draft"]).resolve(),
                context_path=(ROOT / fields["context"]).resolve(),
                mode=fields.get("mode", "REPLY"),
                human_verdict=fields.get("human_verdict", "unlabeled"),
            )
        )
    return tuple(out)


def load_evals() -> Sequence[tuple[str, Any]]:
    out: list[tuple[str, Any]] = []
    for path in sorted(EVALS_DIR.glob("*.py")):
        if path.name.startswith("_"):
            continue
        spec = importlib.util.spec_from_file_location(path.stem, path)
        if spec is None or spec.loader is None:
            continue
        module = importlib.util.module_from_spec(spec)
        sys.modules[path.stem] = module
        spec.loader.exec_module(module)
        if hasattr(module, "evaluate"):
            out.append((path.stem, module.evaluate))
    return tuple(out)


def run() -> None:
    traces = load_traces()
    evals = load_evals()

    if not traces:
        print("No traces in ./traces/. Copy _TEMPLATE.md for each real draft you gather.")
        return
    if not evals:
        print("No evals in ./evals/. Add one module with an evaluate(draft, context) fn.")
        return

    print(f"Riff evals on {len(traces)} traces, {len(evals)} eval modules")
    print("-" * 60)

    totals: dict[str, list[int]] = {name: [0, 0] for name, _ in evals}
    disagreements: list[str] = []

    for trace in traces:
        draft = trace.draft_path.read_text() if trace.draft_path.exists() else ""
        context = trace.context_path.read_text() if trace.context_path.exists() else ""
        if not draft:
            print(f"  SKIP {trace.trace_id}: missing draft file")
            continue

        for name, fn in evals:
            result = fn(draft, context)
            passed = getattr(result, "passed", bool(result))
            totals[name][1] += 1
            if passed:
                totals[name][0] += 1
            if trace.human_verdict in {"pass", "fail"}:
                expected = trace.human_verdict == "pass"
                if passed != expected:
                    disagreements.append(f"{name} @ {trace.trace_id}: eval={passed} human={expected}")

    print()
    total_pass = total_run = 0
    for name, (passed, run_count) in totals.items():
        failures = run_count - passed
        print(f"{name:30}  {passed}/{run_count} PASS   ({failures} fails)")
        total_pass += passed
        total_run += run_count

    print("-" * 60)
    pct = (100 * total_pass // total_run) if total_run else 0
    print(f"Overall: {total_pass}/{total_run} eval invocations passed ({pct}%)")

    if disagreements:
        print()
        print("Disagreements with human labels (Teresa's validation step):")
        for d in disagreements:
            print(f"  - {d}")


if __name__ == "__main__":
    run()
