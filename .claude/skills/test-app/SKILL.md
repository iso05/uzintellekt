---
name: test-app
description: Use this skill to verify deployed app functionality after changes — smoke tests, regression checks, post-deploy validation, UI verification, HTTP/API response checks, security/authorization checks, log inspection. Triggers on "test the app", "verify the changes", "check if it works", "smoke test", "did the deploy work", "/test-app", or any request to validate that recent code or config changes behave correctly end-to-end.
---

# Test App

Verifies that recent changes to **UzIntellekt Dashboard** (`dashboard/`) actually work — by hitting the running SPA at `http://localhost:3002` (local Vite dev server) and its backend API through `curl`, persisted python e2e scripts, the `/agent-browser` skill, and the browser console. It checks the happy path, the UI, **and** the security/authorization rules, then reports concrete pass/fail.

This skill owns its artifacts under its own directory — credentials in `.claude/skills/test-app/test_creds.txt` and generated e2e scripts in `.claude/skills/test-app/e2e/` — so it never collides with the project's own `scripts/`.

Scope note: this skill targets the **dashboard** SPA only. The repo also has `uz-intellekt/` (public site) and `Admin-panel/` (admin) — out of scope here.

## When this skill activates

### 1. Decide what to test — two modes

- **Argument given** (e.g. `/test-app work-files`, `/test-app autosave`, `/test-app the submit gate`): test exactly what the argument names. Don't widen scope to the diff unless the argument is too vague (then ask).
- **No argument**: test the recent change. Look in this order — conversation history (you usually just discussed it), then `git status` + `git diff` for uncommitted work, then `git diff HEAD~1 --stat` if the tree is clean.

Then decide which dimensions are in scope (see the catalog below). A pure API change often needs only HTTP + the security pass; a UI change needs `/agent-browser` and the UI/UX pass.

### 2. Build the subagent prompt

Read `references/subagent-prompt.md` and substitute `{WHAT_TO_TEST}` with a concrete checklist naming exact routes/flows, inputs, expected statuses, and which catalog dimensions apply. Examples:

- *API:* "Verify `GET /api/v1/works/grid` returns the user's works; `GET /api/v1/me/storage-quota` → 200 `{usedBytes,limitBytes,remainingBytes}`; the same calls with no token → 401."
- *UI:* "Log in (inject a fresh token — see Login), open `/works`, confirm statuses render (Черновик/На рассмотрении/Подтверждено), a draft row shows edit/submit/delete icons and the whole row is clickable → opens `/works/:id`. Open a draft edit: file section with quota bar, upload a PDF (init→PUT→confirm), submit stays disabled until a file is UPLOADED. Screenshot desktop, tablet (`set viewport 768 1024`), mobile (`set device \"iPhone 14\"`). Run the UI/UX pass."
- *Security:* "Hit `/api/v1/works/grid` and `/api/v1/me/storage-quota` with no token → 401; confirm presigned PUT to storage carries no Authorization header."

### 3. API scan → persisted python e2e scripts

For the in-scope area, scan the frontend api layer (`dashboard/src/entities/*/api.js`, `shared/api/*`) so you test the real contract, not a guess. Turn meaningful flows into reusable `pytest`-style python scripts under `.claude/skills/test-app/e2e/` — a `requests.Session` that logs in once (reading `.claude/skills/test-app/test_creds.txt`) and reuses the bearer token across assertions. Persist them so the next run re-uses them. Quick probes can still use `curl`.

### 4. Verification catalog — pick what fits the change

Always-on for a UI/API change: **functional behavior** and, for any protected route, the **security/authorization pass**. Add the rest when relevant:

- **Functional** — the changed behavior works via HTTP and/or the UI.
- **UI/UX correctness** — no broken layout/overflow/horizontal scroll, no unstyled or missing elements, form labels/alt text present, no raw error state. Verified via `/agent-browser` screenshots + snapshots at three viewports — desktop, tablet (`set viewport 768 1024`), and mobile (`set device "iPhone 14"`) — so responsive breakage (overflow, clipped content at narrow widths) is caught too. **Mandatory whenever UI is in scope.**
- **Auth / authorization** — unauthenticated API access is blocked (401); the SPA without a token falls back to a mock user and its data calls 401.
- **Negative-path / input validation** — malformed or missing input returns a clean 4xx (backend error codes surface as localized toasts, never a raw 500/stack trace in the UI).
- **Login rate-limiting** — file `init`/`confirm` are rate-limited (HTTP 429 + `Retry-After`, backend errorCode 1020); confirm the UI backs off ("too many requests") rather than looping.
- **Broken assets & console errors** — the changed pages load with no 404 on css/js/img and no JS errors in the browser console.
- **Accessibility basics** — form labels, alt text, sensible heading/focus order on the changed pages.
- **Regression of adjacent flows** — re-exercise the neighbors of the changed area so the fix didn't break something next door.
- **Localization rendering** — the changed UI renders in each configured locale (uz / uz-Cyrl / ru / en) with no missing translation keys (no bare `work_status.FOO` / raw keys).

### 5. Credentials on demand

The subagent reads accounts from `.claude/skills/test-app/test_creds.txt`. If a flow needs an account that isn't there, **pause and ask the user**, then append it in the existing format so the next run is unattended. Never invent credentials and never paste real secrets into this skill or the subagent prompt — always reference the file.

### 6. Spawn subagent(s)

Spawn via the Agent tool with `subagent_type: general-purpose`, prompt = the filled template. One subagent per focused area; parallel in one message when areas are independent. Run foreground — you need the results to report back.

### 7. Report results

Summarize concisely: `N passed, M failed`, with evidence (status codes, screenshot paths, console excerpts, the e2e script that now covers it). Surface action items, not the subagent's raw text.

## Notes

- **Test against `http://localhost:3002` (local Vite dev server).** No rebuild needed — Vite hot-reloads uncommitted changes; just make sure `npm run dev` is running in `dashboard/`. The skill never starts/stops the server — run the health check first, and if it's down, stop and tell the user:

      curl -sfo /dev/null -w "%{http_code}\n" http://localhost:3002

- The dashboard talks to the backend at `VITE_API_BASE_URL` (see `dashboard/.env.local`) — currently `https://api.uzintellekt.uz`. Confirm which backend is set before trusting API results.
- File uploads go straight to object storage via presigned PUT URLs (init → PUT to the storage origin → confirm); downloads use short-lived presigned GET URLs. Storage is external — a failed PUT shows in the browser console/network tab, not in any local log.
- The access token is short-lived (~1h) — mint a fresh one at the start of each run (see the Login section in `references/subagent-prompt.md`).
- Keep stateful tests clean: prefer disposable data; a work can be soft-deleted (DELETE `/works/{id}`, DRAFT/REJECTED only). Don't delete data you didn't create unless that's what's being tested.
