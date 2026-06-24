# UzIntellekt Dashboard

User dashboard for the UzIntellekt intellectual property registry.

React 18 + Vite + Tailwind. Auth via OneID (with a TEST_MODE bypass).

## Quick start

```bash
npm install
cp .env.production.example .env.local   # adjust values for local dev
npm run dev                              # → http://localhost:3002
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on :3002 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` | ESLint over `src/` |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm test` | Run vitest unit tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run update:geo` | Refresh bundled UZ regions/districts from upstream |

## Environment variables

| Var | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | yes | Backend base URL (no trailing slash). |
| `VITE_MAIN_SITE_URL` | yes | Main site URL — used for logout/register/blocked redirects. |
| `VITE_TEST_MODE` | no | `true` to bypass OneID and mount a mock user. Must be `false` in prod. |

Vite reads `.env.local` in dev and `.env.production` during `npm run build`.

## Auth flow

1. App boots → `useAuth.processAuth()` runs once (StrictMode-guarded).
2. If no access AND no refresh token → redirect to `${MAIN_SITE}/login`.
3. If access expired but refresh alive → silent `/auth/token/refresh`.
4. If refresh also expired → redirect to `/login` without trying refresh.
5. Token deadlines (`access_expires_at`, `refresh_expires_at` in `localStorage`)
   are driven by server-issued `expiresIn` / `refreshExpiresIn` (seconds).
6. The interceptor `request()` does a proactive check before every call;
   401 fallback re-runs refresh once as a last resort.

## Network layer

- **`request()`** (in `shared/api/http.js`) — preflight refresh, 429 silent
  backoff for GET/HEAD, single-flight refresh, 401 retry.
- **`requestJson()`** — GET requests are deduped by URL (one in-flight
  promise shared by parallel callers). Mutations are never deduped.
- **`cachedGridGet()`** — TTL cache (60s) + in-flight dedup for grid endpoints.

## Deploy

```bash
cp .env.production.example .env.production
# fill in real VITE_API_BASE_URL and VITE_MAIN_SITE_URL
npm ci
npm run lint
npm test
npm run build
# upload dist/ to your static host (nginx, S3+CloudFront, Cloudflare Pages, etc.)
```

Static SPA — host needs to fall back to `index.html` for unknown routes
(client-side routing). Example nginx:

```nginx
location / {
  try_files $uri /index.html;
}
```

### Geo data refresh

Regions/districts are bundled (`src/shared/data/geo/`). To pull a fresh
snapshot from the upstream GitHub repo:

```bash
npm run update:geo
git diff src/shared/data/geo/
git commit -am "chore: refresh geo data"
```

The script validates structure before overwriting, so a broken upstream
won't corrupt the bundle.

## Project layout (FSD-style)

```
src/
├── app/           # router
├── entities/      # domain models (user, work, contract)
├── features/      # cross-cutting flows (auth, work-save, contract-download…)
├── pages/         # route-level screens
├── widgets/       # composite UI blocks (header, sidebar, tables…)
└── shared/        # api, ui, lib, config, data
```
