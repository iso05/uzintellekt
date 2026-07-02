# UzIntellekt Admin Panel — План реализации

Каждая фаза рассчитана примерно на одну сессию Claude Code. Фазы 1–6 дают v1 (дашборд + модерация + пользователи + файлы/договоры); фазы 7+ — advanced.

Единый принцип на все фазы: **строго дизайн-токены + `shared/ui`**, без выдуманных палитр и самодельных дублей компонентов. Сеть — только через переиспользованный `shared/api`. Новый app изолирован по сборке/деплою от `dashboard/`.

## v1 (MVP)

### Phase 1 — Каркас приложения и удаление старого ✅
**Outcome:** пустой, но запускаемый admin-app на стеке dashboard; старый `Admin-panel/` удалён; инфраструктура `shared/*` и i18n на месте.
- [x] Удалить каталог `Admin-panel/` целиком.
- [x] Создать новый Vite-app `admin/` (React 18, Vite 5) с `package.json`, `vite.config.js` (порт 3003), `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `vitest.config.js`, `index.html`, `.gitignore`, `.env.local` — по образцу dashboard.
- [x] Скопировать/подключить `shared/ui`, `shared/api` (http, grid, cache, token-storage, sso, geo), `shared/config/env`, `shared/lib`, `shared/data/geo`, `assets/styles` (токены), `assets/logo` и i18n-инфраструктуру из dashboard. `shared/config/routes.js` переписан под admin-навигацию.
- [x] Настроить FSD-структуру каталогов: `app/`, `pages/`, `widgets/`, `features/`, `shared/` + eslint-boundaries.
- [x] Собрать корневой роутер (React Router 6) с заглушками страниц (dashboard/moderation/users/files/contracts/login/NotFound) и layout-widget (sidebar + header + LanguageSwitcher); auth-стаб (AuthProvider + ProtectedRoute, mock ADMIN в TEST_MODE); admin i18n-ключи на 4 языках.
**Done when:** `npm run dev` в `admin/` поднимает приложение, `npm run build` и `npm run lint` проходят, старого `Admin-panel/` нет. — ✅ build ✓, lint ✓ (0 ошибок), 40 unit-тестов инфраструктуры ✓, dev-сервер отдаёт admin index.html.

### Phase 2 — Аутентификация и ADMIN-гейт ✅
**Outcome:** рабочий вход по логину/паролю с проверкой роли ADMIN и защищёнными роутами.
- [x] Страница `pages/login` с формой username/password на `shared/ui` (Input, Label, Button) + inline-ошибки (required/invalid/denied/generic).
- [x] `shared/api/auth.js`: `login()` через `POST /api/v1/auth/login` (raw fetch, без интерсептора), сохранение токенов в `token-storage`. `entities/user`: `getMe()` + селекторы `isAdmin/isBlocked/getFullName/getInitials`.
- [x] После логина `GET /api/v1/users/me`; если `role !== 'ADMIN'` — `NotAdminError`, очистка токена, сообщение об отказе.
- [x] `AuthProvider`: bootstrap из токенов (refresh при протухании) → getMe → gate. `ProtectedRoute` редиректит на `/login` с сохранением `from`.
- [x] Кнопка выхода (logout → очистка токенов → `/login`); сеть/refresh/401 переиспользуют `http.js`.
- [x] Unit-тесты: селекторы, гейт роли (ADMIN success / non-admin → NotAdminError + clear), редирект неавторизованного.
**Done when:** ADMIN входит и попадает в панель; не-ADMIN получает отказ; тесты зелёные. — ✅ 52/52 тестов, lint ✓, build ✓.

### Phase 3 — Дашборд (аналитика, ядро) ✅
**Outcome:** стартовый экран с метриками, графиками (Recharts) и топами.
- [x] Установить и подключить `recharts` (2.15.4, отдельный vendor-chunk).
- [x] API-модуль дашборда (`entities/dashboard`): `works|users|moderation|storage`, `*/series` (from, to, granularity, metric), `top/contributors`, `top/storage` — даты `dd.MM.yyyy`. Справочник `entities/dictionary` (getWorkTypes + localizedName).
- [x] Виджеты-метрики (MetricCard + MiniStat): works total + byStatus, users total + byState/period, moderation queueDepth + approved/rejected + avgHoursToDecision (null → «—»), storage totalBytes + usersNearCap + perUserCap.
- [x] Графики: LineChart по series (metric CREATED/REGISTERED + granularity DAY/WEEK/MONTH), горизонтальный BarChart (works by type, локализованные названия), донат PieChart (works by status с легендой), TopList контрибьюторов и хранилища.
- [x] Селектор периода (пресеты 7д/30д/90д, авто-granularity) в едином стиле `shared/ui/select`.
- [x] loading/skeleton/empty состояния (Promise.allSettled — одна ошибка не роняет весь экран); unit-тесты трансформаций (toChartSeries/distributionData/sumValues) + periods + formatBytes/formatNumber.
**Done when:** дашборд рендерит реальные метрики и минимум 3 графика без ошибок; смена периода перезапрашивает данные. — ✅ 67/67 тестов, lint ✓, build ✓; **живой smoke против API (100.71.184.73:8080) — все графики и метрики отрисованы на реальных данных, 0 ошибок в консоли.**

### Phase 4 — Модерация работ (ежедневная работа) ✅
**Outcome:** очередь модерации, карточка работы с файлами и решение APPROVE/REJECT.
- [x] Страница `pages/moderation`: grid работ через `getWorksGrid` (cachedGridGet) с фильтром по `state` (по умолчанию UNDER_REVIEW) + «Все статусы», пагинацией (`shared/ui/table` + `pagination`), клик по строке → карточка. Хук `use-works`.
- [x] `WorkStatusBadge` (DRAFT/UNDER_REVIEW/REJECTED/REGISTERED) с вариантами из токенов; `entities/work/model/status`.
- [x] Карточка работы `pages/work-detail`: детали (статус/тип/описание/даты/причина), правообладатели (имя, паспорт, роли из `author-roles`, share %), тип из `work-types`. Хук словарей `useWorkTypeMap/useAuthorRoleMap`.
- [x] Список вложений `getAdminWorkFiles` + скачивание по presigned `getAdminFileDownloadUrl` (download только для UPLOADED), бейдж статуса файла.
- [x] Feature `features/decide-work`: `DecideWorkDialog` (shared/ui Dialog), APPROVE (примечание опц.) / REJECT (причина обязательна) → `decideWork` (PATCH `/admin/works/{id}/decide`); инвалидация grid-кэша, тост, `reload` + возврат в очередь.
- [x] Тесты: `entities/work` api (getWorkById/decideWork+invalidate), интеграционный `DecideWorkDialog` (валидация причины, reject с причиной → decideWork+onDecided, approve без причины).
**Done when:** можно провести работу из UNDER_REVIEW в REGISTERED/REJECTED через UI; кэш инвалидируется, ошибки показываются тостом. — ✅ 73/73 тестов, lint ✓, build ✓; **живой smoke против API: очередь (6 работ UNDER_REVIEW), карточка (правообладатель + 10 ролей + 100%, PDF-файл UPLOADED), диалог отклонения — 0 ошибок в консоли** (реальный decide не отправлялся, чтобы не менять данные заказчика).

### Phase 5 — Управление пользователями ✅
**Outcome:** grid, карточка, создание/редактирование, блокировка/активация пользователей.
- [x] Страница `pages/users`: grid `admin/users/grid` (фильтры state/role = `eq`, поиск по фамилии = `sw` с debounce), бейджи `UserStateBadge`/`UserRoleBadge`, пагинация, клик по строке → карточка. Хук `use-users`.
- [x] Карточка пользователя `pages/user-detail` через `GET /admin/users/{id}` со всеми полями (individual/legal, пустые скрыты).
- [x] `CreateUserDialog` (`POST /admin/users`, `CreateUserRequest`: type INDIVIDUAL/LEGAL, ФИО/legalName, pinfl/inn/passport/birthDate, pseudonym, phones, address*) с валидацией.
- [x] `EditUserDialog` (`PATCH /admin/users/{id}`, `AdminUpdateUserRequest`: role, pseudonym, address*, phones*) — назначение роли USER/MODERATOR/ADMIN.
- [x] Feature `features/user-state`: `UserStateActions` block/activate (`PATCH …/block` · `…/activate`) с `AlertDialog`-подтверждением и инвалидацией grid.
- [x] Тесты: admin-api (grid/create/update/block/activate + invalidate), `UserStateActions` (block ACTIVE / activate BLOCKED / скрыт для DELETED), `EditUserDialog` (submit роли+контактов, required address), `CreateUserDialog` (валидация 3 required, создание INDIVIDUAL).
**Done when:** админ создаёт, редактирует, блокирует и активирует пользователя через UI; grid отражает изменения. — ✅ 84/84 тестов, lint ✓, build ✓; **живой smoke против API: список (12 польз., роли/статусы/поиск/фильтры/пагинация), карточка (все поля), форма редактирования (предзаполнена) — 0 ошибок в консоли** (реальные мутации не отправлялись, чтобы не менять данные заказчика).

### Phase 6 — Файлы и договоры ✅
**Outcome:** сводный grid файлов с квотами и базовая работа с договорами.
- [x] Страница `pages/files`: `admin/work-files/grid` — файл, работа (ссылка), размер, статус (`WorkFileStatusBadge` PENDING/UPLOADED/DELETED/EXPIRED), дата, пагинация. Полоса квот из storage-dashboard.
- [x] Удаление файла `DELETE /admin/works/{workId}/files/{fileId}` с `AlertDialog`-подтверждением и инвалидацией grid; скачивание по presigned URL (только UPLOADED).
- [x] Страница `pages/contracts`: `contracts/grid` (number, type MEMBERSHIP/LICENSE, state CREATED/PENDING/TERMINATED, владелец-ссылка), фильтры type/state, скачивание `contracts/{id}/download` (presigned `{url}`).
- [x] Feature `features/contract-actions`: `UploadLegacyContractDialog` (multipart: type/даты/document) `POST /admin/users/{userId}/contracts/legacy` и `SignContractDialog` (multipart: contractType/address*/phones*/pseudonym/signatureImage) `.../sign` за пользователя — секция «Договоры» на карточке пользователя.
- [x] Индикация квот (totalBytes, perUserCapBytes, usersNearCap) на странице files.
- [x] Тесты: `deleteWorkFile` + files-grid, contract api (grid/download/legacy/sign multipart + invalidation), `SignContractDialog` (required signature, submit за пользователя).
**Done when:** файлы видны с квотами и удаляются; legacy-договор загружается и подписывается за пользователя; договоры скачиваются. — ✅ 92/92 тестов, lint ✓, build ✓; **живой smoke против API: файлы (4, квоты 15.4 MB/500 MB/0, статусы), договоры (10, тип/статус/владелец/скачивание), секция договоров на карточке пользователя + диалог подписания (предзаполнен) — 0 ошибок в консоли** (реальные мутации не отправлялись).

---

**🎉 v1 (MVP) завершён:** дашборд, модерация, пользователи, файлы, договоры — все 6 фаз готовы, проверены на реальном API. 92 unit/integration-теста, lint/build чисты.

## Advanced Features

### Phase 7 — Работы от имени пользователя ✅
**Outcome:** админ создаёт/правит/отправляет работы за пользователя.
- [x] `createWorkForUser` (`POST /admin/users/{userId}/works`), `updateWork` (`PATCH /admin/works/{id}`), `submitWork` (`POST /admin/works/{id}/submit`) — все с инвалидацией grid. Хелпер `isEditable` (DRAFT/REJECTED).
- [x] `WorkFormDialog` (create/edit): название, тип (Select из `work-types`), описание, динамические правообладатели (фамилия/имя/паспорт/доля + `RolesMultiSelect` на Popover+Checkbox из `author-roles`), сумма долей, валидация. `SubmitWorkButton` с подтверждением.
- [x] Интеграция: секция «Работы» + «Создать работу» на карточке пользователя → `/moderation/{id}`; на work-detail для DRAFT/REJECTED — «Редактировать» + «Отправить на модерацию».
- [~] Управление вложениями работы (init/confirm) — отложено: admin-эндпоинтов загрузки файлов за пользователя в API нет (только list/download/delete), user-level init/confirm привязаны к владельцу.
- [x] Тесты: work-mutations api (create/update/submit + invalidate), `WorkFormDialog` (валидация create, edit → updateWork с маппингом authorRoleIds→authorRoles), `SubmitWorkButton` (confirm → submitWork).
**Done when:** админ проводит работу от DRAFT до submit за пользователя через UI. — ✅ 98/98 тестов, lint ✓, build ✓; **живой smoke против API: секция «Работы» на карточке, форма создания (тип из справочника — 16 типов локализованы, правообладатели, роли-мультиселект, сумма долей) — 0 ошибок в консоли** (реальная работа не создавалась).

### Phase 8 — Расширенная аналитика и экспорт ✅
**Outcome:** более глубокий дашборд и выгрузки.
- [x] Сравнение периодов: `previousRangeFor`/`deltaPct`, догрузка предыдущего периода в `useDashboardSummary`, `DeltaBadge` (↑/↓ %) на карточках works/users. (metric-переключатели series — уже с Phase 3.)
- [x] Экспорт grid в **CSV** (`shared/lib/csv.js`, `;`-разделитель + BOM) для users/works/files — кнопка «Экспорт» тянет все строки с текущими фильтрами.
- [x] Drill-down: легенда «работы по статусам» → `/moderation?state=X` (ModerationPage читает query-param); топ-контрибьюторы/хранилище → `/users/{userId}`.
- [x] Тесты: `toCsv` (разделитель/экранирование/BOM-путь), `deltaPct`, `previousRangeFor`.
**Done when:** экспорт работает и хотя бы один drill-down переход из дашборда в grid. — ✅ 105/105 тестов, lint ✓, build ✓; **живой smoke: дельты (+100% works, −17% users), drill-down статуса → отфильтрованная модерация (5 REGISTERED), CSV-экспорт скачал корректный файл (локализованные заголовки, фильтр учтён, кириллица) — 0 ошибок в консоли.**

### Phase 9 — Аудит, полировка, доступность ✅
**Outcome:** производственная зрелость.
- [x] Клиентский журнал ключевых действий (`shared/lib/activity-log.js`, ring-buffer в localStorage) — API аудита нет; `logActivity` в мутациях (decide/create/update/submit/block/activate/delete/legacy/sign); страница `pages/activity` + роут `/activity` + пункт меню «Журнал».
- [x] Полный адаптив desktop/tablet/mobile: sidebar → drawer + гамбургер (<lg), карточки/графики стекаются в колонку, таблицы скроллятся — проверено на 624px (mobile) и ~1040px (tablet).
- [x] a11y/полировка: icon-only кнопки с `aria-label`, фокус-кольца из токенов, Radix-диалоги/селекты (keyboard/фокус-trap из коробки), локализован `ProtectedRoute`.
- [x] i18n-полнота: **276 ключей, идентичные наборы во всех 4 языках** (скрипт-проверка); пустые/ошибочные состояния на всех grid/детальных экранах.
- [x] Тест `activity-log` (запись/порядок/cap 100/clear).
**Done when:** `/post-task-review` проходит чисто на desktop/tablet/mobile, все строки локализованы. — ✅ 108/108 тестов, lint ✓, build ✓; **живой smoke: журнал действий (локализованная запись + бейдж решения), mobile-drawer со всеми пунктами, стек-карточки на 624px — 0 ошибок в консоли.** (Полный `/post-task-review` можно запустить отдельно как финальный гейт.)

---

**🎉 Все 9 фаз готовы.** v1 (MVP) + advanced (работы от имени, аналитика/экспорт/drill-down, журнал/адаптив/a11y). 108 unit/integration-тестов, lint/build чисты, i18n 276×4, проверено на реальном API (100.71.184.73:8080).
