"""Hallucination-guard tests: generated text may not introduce numbers absent
from the user's own data (bullets fall back to the original; summary retries)."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.fact_guard import numbers_in, unsupported_numbers, generate_text_guarded
from app.agents import writer_agent

failures = []

# ---------------------------------------------------------------- unit checks

cases = [
    # (new_text, sources, expected unsupported)
    ("Reduced latency by 95%", ("Reduced latency by 30%",), ["95"]),
    ("Reduced latency by 30%", ("Reduced latency by 30%",), []),
    ("Grew revenue to 2,000 customers", ("grew revenue to 2000 customers",), []),
    ("Led team of 5 shipping daily", ("Led team of 5 shipping daily",), []),
    ("Shipped in 2024 serving 40%", ("Shipped in 2024 serving 40 percent",), []),
    ("Raised $2.5M seed round", ("raised $2.5 million",), []),
    ("No numbers here at all", ("anything",), []),
    ("95% uptime", (), ["95"]),
]
for new_text, sources, expected in cases:
    got = unsupported_numbers(new_text, *sources)
    if got != expected:
        failures.append(f"unsupported_numbers({new_text!r}, {sources}) = {got}, expected {expected}")

if numbers_in("$2.5M and 40%") != {"2.5", "40"}:
    failures.append(f"numbers_in normalisation wrong: {numbers_in('$2.5M and 40%')}")
print("unsupported_numbers unit cases: OK")

# ---------------------------------------------------------------- rewrite_bullets guard

_orig_json = writer_agent.llm.generate_json
_captured = {}


async def _fake_json(system_prompt, user_prompt, **kwargs):
    _captured["system"] = system_prompt
    return {
        "rewritten_bullets": [
            "Led a team of 5 engineers delivering the billing platform",  # numbers all in original -> kept
            "Reduced latency by 95% across 12 services",                  # 95 and 12 are invented -> fallback
        ]
    }


async def _run_bullets():
    original = ["Led team of 5 delivering the billing platform", "Reduced latency by 30%"]
    return await writer_agent.rewrite_bullets(original, "Job description text")


writer_agent.llm.generate_json = _fake_json
try:
    result = asyncio.run(_run_bullets())
finally:
    writer_agent.llm.generate_json = _orig_json

if result[0] != "Led a team of 5 engineers delivering the billing platform":
    failures.append(f"clean rewrite was not kept: {result[0]!r}")
if result[1] != "Reduced latency by 30%":
    failures.append(f"invented-number bullet was not reverted: {result[1]!r}")
if "invent" not in _captured.get("system", "").lower():
    failures.append("rewrite_bullets prompt missing anti-invention directive")
print("rewrite_bullets hallucination fallback: OK")

# count mismatch must still fall back to all originals
async def _fake_json_bad_count(system_prompt, user_prompt, **kwargs):
    return {"rewritten_bullets": ["only one bullet returned"]}


writer_agent.llm.generate_json = _fake_json_bad_count
try:
    result = asyncio.run(_run_bullets())
finally:
    writer_agent.llm.generate_json = _orig_json
if result != ["Led team of 5 delivering the billing platform", "Reduced latency by 30%"]:
    failures.append("count-mismatch fallback broken")
print("rewrite_bullets count-mismatch fallback: OK")

# ---------------------------------------------------------------- guarded text generation

from app.services.llm_client import llm as _llm

_orig_text = _llm.generate_text
RESUME = "Engineer with 8 years of experience. Shipped billing platform serving 2M users."
JD = "Seeking a senior engineer to lead platform work."

# Case 1: first attempt invents "97%" -> retry returns clean text
_calls = {"n": 0}


async def _fake_text_seq(system_prompt, user_prompt, **kwargs):
    _calls["n"] += 1
    if _calls["n"] == 1:
        return "Engineer with a 97% accuracy focus."
    return "Engineer with an accuracy focus drawn from the resume."


_llm.generate_text = _fake_text_seq
try:
    out = asyncio.run(generate_text_guarded("sys", "user", RESUME, JD))
finally:
    _llm.generate_text = _orig_text

if _calls["n"] != 2:
    failures.append(f"expected 2 generate_text calls (retry), got {_calls['n']}")
if "97%" in out:
    failures.append(f"retry output still contains invented number: {out!r}")
print("generate_text_guarded retry-on-invented-number: OK")

# Case 2: clean output -> single call, no retry
_calls["n"] = 0


async def _fake_text_clean(system_prompt, user_prompt, **kwargs):
    _calls["n"] += 1
    return "Engineer with 8 years of experience focused on billing platforms."


_llm.generate_text = _fake_text_clean
try:
    out = asyncio.run(generate_text_guarded("sys", "user", RESUME, JD))
finally:
    _llm.generate_text = _orig_text

if _calls["n"] != 1 or "8 years" not in out:
    failures.append(f"clean path should be 1 call without retry (got {_calls['n']} calls): {out!r}")
print("generate_text_guarded clean-path single call: OK")

# Case 3: generate_summary end-to-end uses the guard (unsupported number retried)
_calls["n"] = 0


async def _fake_text_seq2(system_prompt, user_prompt, **kwargs):
    _calls["n"] += 1
    return "Trusted by 97% of Fortune 500 companies." if _calls["n"] == 1 else "Billing-focused engineer with 8 years of experience."


_llm.generate_text = _fake_text_seq2
try:
    out = asyncio.run(writer_agent.generate_summary(RESUME, JD, template="classic"))
finally:
    _llm.generate_text = _orig_text

if _calls["n"] != 2 or "97%" in out:
    failures.append(f"generate_summary did not retry away from invented number ({_calls['n']} calls): {out!r}")
print("generate_summary guarded: OK")

if failures:
    print("\nFAILURES:")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("\nALL FACT-GUARD CHECKS PASSED")
