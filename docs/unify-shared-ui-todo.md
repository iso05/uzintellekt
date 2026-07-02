# Унификация общего UI-слоя (dashboard + admin) — План реализации

Каждая фаза рассчитана примерно на одну сессию Claude Code. Фазы 1–4 дают v1 (единый `packages/ui`, оба приложения переведены, drift-guard); фазы 5+ — advanced.

Отправная точка (проверено): `admin/src/shared` — **строгое надмножество** `dashboard/src/shared`; `shared/ui`, токены, `tailwind.config`, `i18n/index` — **идентичны**. Конфликтов слияния нет: канон = admin-версия. Объём замен: `@/shared/`→`@shared/` — admin 72 файла / dashboard 85; `routes` — admin 12 / dashboard 13.

## v1 (MVP)

### Phase 1 — Извлечь `packages/ui` (канон) + preset + i18n-фабрика ✅
**Outcome:** в корне есть `packages/ui/` с каноническим общим слоем; собирается изолированно (tailwind preset, i18n factory, styles, superset api-барель). Приложения ещё не тронуты.
- [x] Создать `packages/ui/` и перенести admin-суперсет: `ui/` (24), `api/` (http, grid, cache, token-storage, sso, geo, **auth**, index-барель superset с `login`+`loginWithOneIdCode`), `lib/` (utils, format c `formatBytes`/`formatNumber`, validators, safe-storage, api-error, validation-error, transliterate, localized-name, input-masks, draft-storage, **activity-log**, **csv**), `data/geo`, `config/env.js`, `styles/index.css`.
- [x] `tailwind.preset.js` вынесен (theme + plugins + darkMode; без `content` — per-app).
- [x] i18n-фабрика: `packages/ui/i18n/index.js` экспортирует `createI18n(resources)` + default-инстанс (для `lib/localized-name.js`).
- [x] Внутренние импорты переписаны `@/shared/`→`@shared/`, `@/i18n`→`@shared/i18n`; `error-boundary.test` сделан самодостаточным (init через createI18n).
- [x] 11 тест-файлов перенесены рядом с модулями; `config/routes.js` НЕ перенесён (per-app).
**Done when:** `packages/ui` содержит канон; временный раннер (vitest + симлинк node_modules) — **52/52 теста ✓**; нет остаточных `@/`-импортов; структура совпадает с таблицей «Граница». — ✅ выполнено; admin/dashboard не тронуты.

### Phase 2 — Подключить `admin` к `@shared` (+ npm workspaces) ✅
**Outcome:** admin потребляет `packages/ui`; локального `admin/src/shared` больше нет; сборка/тесты/лайв работают как раньше.
- [x] `admin/vite.config.js` + `admin/vitest.config.js`: alias `@shared` → `../packages/ui`, `server.fs.allow:['..']`; vitest `include` += `../packages/ui/**` (общие тесты в прогоне admin).
- [x] `admin/jsconfig.json`: paths `@shared/*` + include `../packages/ui`.
- [x] `admin/tailwind.config.js`: `presets:[uiPreset]`, `content` += `../packages/ui/**/*.{js,jsx}`.
- [x] `admin/src/shared/config/routes.js` → `admin/src/config/routes.js`; заменено в 12 импортёрах `@/shared/config/routes` → `@/config/routes`.
- [x] Механическая замена `@/shared/` → `@shared/` (72 файла); styles → `@shared/styles/index.css`; `admin/src/i18n/index.js` → `createI18n(resources)`.
- [x] Удалён `admin/src/shared` + `admin/src/assets/styles`.
- [x] **npm workspaces** (root `package.json` workspaces + `packages/ui/package.json` deps; единый `npm install` → общий root node_modules, один React) — folder+alias без общего node_modules не резолвит зависимости; workspaces (бывшая Phase 5) подтянуты сюда.
- [x] `npm run lint` (0 ✓), `npm test` (**110 ✓**, вкл. общие из `../packages/ui/**`), `npm run build` (✓); живой smoke — дашборд идентичен, **0 ошибок в консоли (нет дублей React)**.
**Done when:** admin собирается и проходит 110 тестов без `admin/src/shared`; UI идентичен эталону. — ✅ выполнено.

### Phase 3 — Подключить `dashboard` к `@shared` ✅
**Outcome:** dashboard потребляет `packages/ui`; локального `dashboard/src/shared` нет; без визуальных/поведенческих регрессий.
- [x] `dashboard/vite.config.js` + `dashboard/vitest.config.js`: alias `@shared`, `server.fs.allow:['..']`.
- [x] `dashboard/jsconfig.json`: paths `@shared/*` + include `../packages/ui`.
- [x] `dashboard/tailwind.config.js`: `presets:[uiPreset]`, `content` += `../packages/ui/**`.
- [x] `dashboard/src/shared/config/routes.js` → `dashboard/src/config/routes.js`; заменено в 13 импортёрах → `@/config/routes`.
- [x] Механическая замена `@/shared/` → `@shared/` (85 файлов); styles → `@shared/styles`; `dashboard/src/i18n/index.js` → `createI18n`. `@/i18n` (app-local инстанс) оставлен как есть.
- [x] Удалён `dashboard/src/shared` + `dashboard/src/assets/styles`. dashboard уже член workspace → резолв из общего node_modules.
- [x] `npm run lint` (0 ошибок; 4 предсуществующих warning'а exhaustive-deps), `npm test` (**83 ✓**), `npm run build` (✓, CSS 41.4 kB — стили целы); живой smoke — dashboard рендерится идентично, **0 ошибок в консоли**.
**Done when:** dashboard собирается и проходит тесты без `dashboard/src/shared`; UI без регресса. — ✅ выполнено.

---

**🎉 v1 (Phases 1–3 + workspaces) готов:** общий слой в `packages/ui`, оба приложения (`admin` + `dashboard`) потребляют один источник через `@shared`, единый root node_modules (workspaces), один React. Правка компонента/токена теперь делается в одном месте. Остаётся Phase 4 (CI drift-guard).

### Phase 4 — CI drift-guard ✅
**Outcome:** повторное появление локального `src/shared` в любом приложении ловится автоматически.
- [x] `scripts/check-no-local-shared.sh`: падает (exit 1), если есть `admin|dashboard/src/shared` **или** `@/shared/`-импорты; печатает нарушителя. Протестировано (clean→0, нарушение→1).
- [x] Root `package.json` scripts: `check:shared`, `lint`/`test`/`build` (через `-w admin`/`-w dashboard`), `verify` (check:shared + build).
- [x] `.github/workflows/ci.yml`: root `npm ci` → `check:shared` → `lint` → `test` → `build` (на push/PR).
- [x] Пофикшен устаревший `deploy.yml`: `Admin-panel` → `admin`, per-app `npm ci` → root workspace install + `npm run build -w <app>`; убраны stale per-app `package-lock.json`.
- [x] README-заметка (раздел «Umumiy UI qatlami»): общий слой в `packages/ui`, правило + команды.
**Done when:** намеренное создание `admin/src/shared/x.js` роняет guard (exit ≠ 0); CI-шаг присутствует. — ✅; `npm run verify` (check:shared + build обоих) зелёный.

---

**🎉 Весь план unify-shared-ui завершён (Phases 1–5).** Общий UI в `packages/ui`, оба приложения на `@shared` (npm workspaces, один React), drift-guard в CI. Правка общего компонента/токена — в одном месте.

## Advanced Features

### Phase 5 — npm workspaces ✅ (сделано в Phase 2)
**Outcome:** `packages/ui` — workspace-пакет; зависимости хойстятся в корень (один node_modules), версии radix/react не расходятся.
- [x] Root `package.json` с `workspaces: ["packages/ui","admin","dashboard"]`.
- [x] `packages/ui/package.json` (`@uzintellekt/ui`, deps/peerDeps). Alias `@shared` оставлен для резолва путей `@shared/*` (гибрид: workspaces хойстят node_modules, alias резолвит пути).
- [x] Единый `npm install` в корне; admin build/test/lint зелёные из общего node_modules.
**Done when:** оба приложения собираются из workspace без per-app дублей зависимостей. — ✅ (admin готов; dashboard — в Phase 3).
**Примечание:** pnpm не вводили — хватило npm workspaces; `"@uzintellekt/ui":"workspace:*"` вместо alias — опциональный шаг на потом (потребует exports-мапу + замену импортов).

### Phase 6 — Общий тулинг для packages/ui
**Outcome:** единый DX вокруг общего слоя.
- [ ] Общий ESLint/Prettier-конфиг для `packages/ui` (или расшарить flat-config).
- [ ] (Опц.) Storybook для `@shared/ui` — витрина компонентов + визуальная регрессия.
- [ ] (Опц.) JSDoc/TS-типы для публичного API `packages/ui`.
**Done when:** `packages/ui` линтуется своим конфигом; (если Storybook) `storybook build` проходит.
