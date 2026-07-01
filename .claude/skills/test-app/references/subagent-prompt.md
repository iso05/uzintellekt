You are testing the deployed **UzIntellekt Dashboard** SPA. Your goal: verify that recent changes work correctly — functionally, in the UI, and against the security/authorization rules — and report concrete pass/fail results.

## What to Test

{WHAT_TO_TEST}

## App URL

`http://localhost:3002` — local Vite dev server (`npm run dev` in `dashboard/`). The SPA calls the backend at `VITE_API_BASE_URL` (see `dashboard/.env.local`, currently `https://api.uzintellekt.uz`).

## Prerequisites

Confirm the app is up before testing:

    curl -sfo /dev/null -w "%{http_code}\n" http://localhost:3002

If it's down, stop and tell the parent agent — do not start it yourself. No rebuild needed (Vite hot-reloads uncommitted changes).

## Credentials

Read accounts from `.claude/skills/test-app/test_creds.txt` (skill-owned, git-ignored). Auth model: **JWT bearer** — the SPA stores the access token in `localStorage`; there is no cookie/session.

All dashboard routes require a token (role USER). Without one, in `VITE_TEST_MODE=true` the SPA falls back to a mock user and backend calls return 401. Public entry is the main site `/login` (OneID); admin features are a separate app (Admin-panel) — out of scope.

If a flow needs an account that is **not** in `test_creds.txt`, stop and ask the parent agent, then append it in the same format so future runs are unattended. Never hard-code secrets into scripts; read them from the file at run time.

## Allowed Tools

- `curl` — HTTP/API checks against the backend.
- **python e2e scripts** under `.claude/skills/test-app/e2e/` — persist real flows here (a `requests.Session` that logs in once and reuses the token). Re-use and extend existing scripts.
- the **`/agent-browser` skill** (invoke via the Skill tool) — UI verification: navigate, snapshot, click, fill, screenshot, read console.
- the **browser console** (via `/agent-browser console`) — this SPA has no server logs of its own; runtime errors surface in the console and the network tab.

## Tools

### `curl` (API probes)

Probe the backend directly (bypasses the SPA); needs a bearer token (see Login):

    API=https://api.uzintellekt.uz
    curl -s "$API/api/v1/users/me"            -H "Authorization: Bearer $TOKEN"
    curl -s "$API/api/v1/me/storage-quota"    -H "Authorization: Bearer $TOKEN"
    # grid endpoints take a URL-encoded gridRequest JSON:
    curl -s "$API/api/v1/works/grid?gridRequest=%7B%22page%22%3A1%2C%22size%22%3A10%7D" -H "Authorization: Bearer $TOKEN"
    # no token → expect 401:
    curl -s -o /dev/null -w "%{http_code}\n" "$API/api/v1/users/me"

### Login

The dashboard reads its token from `localStorage`. Mint a fresh token from the backend, then inject it into the running SPA.

1) Mint a token (creds from `.claude/skills/test-app/test_creds.txt`, line `user,<username>,<password>`):

    API=https://api.uzintellekt.uz
    curl -s -X POST "$API/api/v1/auth/login" -H 'Content-Type: application/json' \
      -d '{"username":"<username>","password":"<password>"}'
    # → { token, refreshToken, expiresIn, refreshExpiresIn }

2) Inject into the SPA via `/agent-browser` (run in the page context, then reload):

    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('access_expires_at', String(Date.now() + expiresIn * 1000))
    localStorage.setItem('refresh_expires_at', String(Date.now() + refreshExpiresIn * 1000))
    // reload → useAuth picks up the token and loads the real user

The access token is short-lived (~1h) — mint a fresh one at the start of each run. For pure-API checks you can use the raw `token` as `$TOKEN` without touching the browser.

### python e2e scripts

Save reusable flows under `.claude/skills/test-app/e2e/` and run with `python3`. Log in once, then assert each step; read creds from the file. Example shape:

    # .claude/skills/test-app/e2e/test_quota.py
    import requests
    API = "https://api.uzintellekt.uz"
    # ...read creds, POST /auth/login → token...
    s = requests.Session(); s.headers["Authorization"] = f"Bearer {token}"
    r = s.get(f"{API}/api/v1/me/storage-quota")
    assert r.status_code == 200, (r.status_code, r.text[:300])
    assert {"usedBytes","limitBytes","remainingBytes"} <= r.json().keys()
    print("OK storage-quota")

### `/agent-browser` (UI)

Invoke the `agent-browser` skill for UI work:

    agent-browser open http://localhost:3002/
    agent-browser snapshot -i          # interactive elements with @e1, @e2 refs
    agent-browser click @e1
    agent-browser fill @e2 "text"
    agent-browser screenshot           # capture for failure reports + UI/UX review
    agent-browser console              # read browser console errors

Re-snapshot after navigation — refs change. Screenshot each changed page at three viewports so responsive breakage shows up:

    agent-browser screenshot                       # desktop (default)
    agent-browser set viewport 768 1024            # tablet (iPad portrait)
    agent-browser screenshot page-tablet.png
    agent-browser set device "iPhone 14"           # mobile (~390x844)
    agent-browser screenshot page-mobile.png
    agent-browser set viewport 1280 800            # reset back to desktop

### Logs

This SPA has no server log — inspect the **browser console** for runtime errors and the network tab for failed requests:

    agent-browser console

## Workflow

1. Health check — abort with a clear message if the app isn't up.
2. Mint a token; run / extend the python e2e scripts and `curl` probes for the change.
3. If UI is in scope, drive the affected pages via `/agent-browser` and run the UI/UX-defect pass.
4. Run the security & authorization pass for any protected route the change touches.
5. Read the browser console for errors during the test window.
6. Report (see format below).

## UI/UX correctness

When UI is in scope this pass is mandatory. On each changed page, via `/agent-browser` screenshot + snapshot, confirm:
- No broken layout: no element overflow, no unexpected horizontal scroll, no overlapping/clipped content.
- No unstyled or missing elements (raw-HTML flash, unstyled button, empty region where content should be).
- Form controls have visible labels; images/icons-as-buttons have accessible labels.
- No raw framework error rendered to the user.
- No JS errors in the browser console; no 404s on css/js/img assets.
- **Responsive (tablet + mobile):** re-check at tablet (`set viewport 768 1024`) and mobile (`set device "iPhone 14"`) — no horizontal scroll/overflow, sidebar/nav collapses correctly, content reflows to a single column, the sticky form action bar (Delete left / Submit right) and the file section stay usable, tap targets aren't cramped. Attach the per-viewport screenshot for any responsive defect.

## Security & authorization pass

For any protected route the change touches:
- **No token** → API returns 401 (never 200 with protected data); the SPA shows the mock-user fallback, not real data.
- **Negative-path / input validation** — malformed/missing input returns a clean 4xx; the UI shows a localized toast, never a raw 500/stack trace. Check the mapped codes: 1015 quota, 1020 rate-limit (429), 1021 draft-limit, 1022 submit-without-file.
- **Presigned upload isolation** — the PUT to object storage carries **no** Authorization header (the presigned signature is the auth); the bearer token must not reach the storage origin.
- **Login rate-limiting** — repeated file `init`/`confirm` beyond the limit return 429 + `Retry-After`; the UI backs off ("too many requests"), it does not loop-retry.

## Localization

If the change is user-visible, load the changed UI in each configured locale (uz / uz-Cyrl / ru / en via the header language switcher) and confirm it renders translated text with no missing keys (no bare `work_status.*` / raw key markers).

## Pass/Fail Criteria

A check **passes** when:
- HTTP responses match the expected status (2xx success, 3xx intended redirects, 4xx only when asserting an error/authz case).
- Response bodies / rendered HTML contain the expected fields/values.
- UI snapshots show the expected text and interactive elements, with no UI/UX defects.
- Security assertions hold (unauthorized blocked, no token leak to storage, clean 4xx on bad input).
- No new errors appeared in the browser console during the test window.

A check **fails** if any of the above is wrong, a request times out, or the page renders a generic error.

## Failure Capture

Capture evidence before moving on:
- HTTP: the exact command (or e2e script + line), status code, response body (truncated).
- UI: an `agent-browser screenshot` and the latest `snapshot -i` text.
- Console: the error text from `agent-browser console` during the test window.

## Test Hygiene

- Prefer disposable data for flows that mutate state; a DRAFT/REJECTED work can be soft-deleted to clean up.
- Don't delete data you didn't create unless that's literally what's being tested.

## Report Format

Reply to the parent agent with:

1. **Summary** — one line: `N passed, M failed`.
2. **Per-check results** — for each: name, pass/fail, evidence (status code, key field, screenshot path, console line, or e2e script path).
3. **Anomalies** — anything weird not directly tested but looks broken.
4. **Suggested follow-ups** — only if a failure points at a specific file/area worth investigating next.
