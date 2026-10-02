"""Rate-limit handling: Groq daily-cap 429s must fail fast with a friendly
message (never 'invalid JSON'), short-circuit later calls during cooldown,
and surface to clients as HTTP 429 — not a generic 500."""
import asyncio
import sys
import time
import types
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.llm_client import LLMClient, LLMRateLimitError
from app.utils.http_errors import internal_error, PUBLIC_500

failures = []
client = LLMClient()

DAILY_MSG = (
    "Error code: 429 - {'error': {'message': 'Rate limit reached for model "
    "`openai/gpt-oss-20b` ... service tier `on_demand` on tokens per day (TPD): "
    "Limit 200000, Used 198585, Requested 3879. Please try again in 17m44.447999999s. ...', "
    "'code': 'rate_limit_exceeded'}}"
)


def check(cond, label):
    if not cond:
        failures.append(label)


# ---------------------------------------------------------------- wait parsing

w = LLMClient._rate_limit_wait(Exception(DAILY_MSG), 0)
check(1064 <= w <= 1067, f"XmYs parse wrong: {w}")
w2 = LLMClient._rate_limit_wait(Exception("... Please try again in 14m59.424s."), 0)
check(899 <= w2 <= 902, f"14m59s parse wrong: {w2}")
w3 = LLMClient._rate_limit_wait(Exception("... try again in 7.5s."), 0)
check(7.5 <= w3 <= 9.5, f"seconds parse wrong: {w3}")
w4 = LLMClient._rate_limit_wait(Exception("tokens per day limit, no time given"), 0)
check(899 <= w4 <= 902, f"per-day fallback wrong: {w4}")
print("wait parsing: OK")

# ---------------------------------------------------------------- friendly message

friendly = LLMClient._friendly_rate_limit(1064.4)
check("rate limit" in friendly.lower(), "friendly message must contain 'rate limit'")
check("minute" in friendly, "friendly message must contain minutes")
print(f"friendly message: {friendly!r}")


# ---------------------------------------------------------------- mocked client

class Fake429(Exception):
    status_code = 429
    code = "rate_limit_exceeded"


class FakeCompletions:
    def __init__(self, fn):
        self._fn = fn

    async def create(self, **kwargs):
        return await self._fn(kwargs)


class FakeOpenAI:
    def __init__(self, fn):
        self.chat = types.SimpleNamespace(completions=FakeCompletions(fn))


def ok_response(content):
    return types.SimpleNamespace(
        choices=[types.SimpleNamespace(finish_reason="stop", message=types.SimpleNamespace(content=content))],
        usage=None,
    )


# 1. Daily cap: first call fails fast (1 API hit, no 6 retries, no long sleep)
calls = {"n": 0}


async def raise_429(_kwargs):
    calls["n"] += 1
    raise Fake429(DAILY_MSG)


orig_client = client.client
orig_cooldown = (client._cooldown_until, client._cooldown_msg)
client.client = FakeOpenAI(raise_429)
client._cooldown_until = 0.0

t0 = time.time()
try:
    asyncio.run(client.generate_json("sys", "user"))
    failures.append("generate_json did not raise LLMRateLimitError")
except LLMRateLimitError as e:
    msg = str(e)
    check("rate limit" in msg.lower(), f"error not friendly: {msg!r}")
    check("invalid JSON" not in msg, f"rate limit mislabeled as JSON error: {msg!r}")
    check("minute" in msg, f"error missing retry estimate: {msg!r}")
except Exception as e:
    failures.append(f"wrong exception type: {type(e).__name__}: {e}")
elapsed = time.time() - t0
check(elapsed < 2, f"fail-fast took too long: {elapsed:.1f}s")
check(calls["n"] == 1, f"expected 1 API attempt, got {calls['n']}")
check(client._cooldown_until > time.time(), "cooldown not set after fail-fast")
print(f"daily cap fail-fast: {elapsed:.2f}s, {calls['n']} attempt(s): OK")

# 2. Cooldown gate: next call short-circuits without touching the API
try:
    asyncio.run(client.generate_json("sys", "user"))
    failures.append("cooldown gate did not raise")
except LLMRateLimitError:
    pass
except Exception as e:
    failures.append(f"cooldown gate wrong exception: {e}")
check(calls["n"] == 1, f"cooldown gate hit the API ({calls['n']} calls)")
print("cooldown gate short-circuit: OK")

# 3. Short burst limit: sleeps briefly and retries to success
client._cooldown_until = 0.0
calls2 = {"n": 0}


async def short_limit_then_ok(_kwargs):
    calls2["n"] += 1
    if calls2["n"] == 1:
        raise Fake429("Rate limit reached. Please try again in 0.01s.")
    return ok_response('{"ok": 1}')


client.client = FakeOpenAI(short_limit_then_ok)
t0 = time.time()
try:
    out = asyncio.run(client.generate_json("sys", "user"))
    check(out == {"ok": 1}, f"short-limit retry returned {out}")
except Exception as e:
    failures.append(f"short-limit retry raised: {e}")
check(calls2["n"] == 2, f"expected 2 attempts, got {calls2['n']}")
check(time.time() - t0 < 5, "short-limit retry too slow")
check(client._cooldown_until == 0, "short limit must not set cooldown")
print("short burst limit sleep+retry: OK")

# 4. generate_text path
calls3 = {"n": 0}


async def raise_429_text(_kwargs):
    calls3["n"] += 1
    raise Fake429(DAILY_MSG)


client.client = FakeOpenAI(raise_429_text)
try:
    asyncio.run(client.generate_text("sys", "user"))
    failures.append("generate_text did not raise LLMRateLimitError")
except LLMRateLimitError:
    check(calls3["n"] == 1, f"generate_text attempts: {calls3['n']}")
except Exception as e:
    failures.append(f"generate_text wrong exception: {e}")
print("generate_text fail-fast: OK")

client.client = orig_client
client._cooldown_until, client._cooldown_msg = orig_cooldown

# ---------------------------------------------------------------- HTTP mapping

he = internal_error(
    ValueError("AI provider rate limit reached (daily token cap) — please try again in about 15 minutes.")
)
check(he.status_code == 429, f"friendly rate limit -> expected 429, got {he.status_code}")
check("rate limit" in str(he.detail).lower(), "429 detail lost the message")

he = internal_error(ValueError(f"Could not generate ATS score: {DAILY_MSG}"))
check(he.status_code == 429, f"wrapped raw 429 -> expected 429, got {he.status_code}")

he = internal_error(ValueError("Could not parse resume text: something unrelated"))
check(he.status_code == 500 and he.detail == PUBLIC_500, "non-rate-limit must stay generic 500")

he = internal_error(ValueError("resume mentions 429 customers in a bullet"))
check(he.status_code == 500, f"user content containing '429' must not map to 429 (got {he.status_code})")
print("internal_error mapping: OK")

if failures:
    print("\nFAILURES:")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("\nALL RATE-LIMIT CHECKS PASSED")
