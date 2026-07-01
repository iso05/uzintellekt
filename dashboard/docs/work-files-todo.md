# Файлы работ и квота хранилища — План реализации

Каждая фаза рассчитана примерно на одну сессию Claude Code. Фазы 1–5 дают v1
(полностью рабочая загрузка файлов + квота). Фазы 6+ — продвинутые улучшения.

Контекст: дашборд UzIntellekt (`dashboard/`, React 18 + Vite + FSD). Новые бэкенд-методы —
`work-files` (init/PUT/confirm/list/download-url/delete) и `me/storage-quota`.
Спека: `docs/work-files.html`.

Ключевые опорные точки в коде:
- HTTP-слой: `src/shared/api/http.js` (`request`, `requestJson`), реэкспорт в `src/shared/api/index.js`.
- Кэш: `src/shared/api/cache.js` (`invalidateCache`).
- Форма работы: `src/pages/work-form/ui/WorkFormPage.jsx` (флаги `isEdit`, `isReadOnly`, `isEditableState`).
- UI-кит: `src/shared/ui` (Dialog, AlertDialog, Button, Badge, Skeleton, toast, EmptyState, LoadingState).
- i18n: `src/i18n` (uz / uz-Cyrl / ru / en).

---

## v1 (MVP)

### Phase 1 — API-слой и утилиты `entities/work-file` ✅
**Outcome:** есть протестированный фронтовый API ко всем эндпоинтам файлов и квоты, плюс утилиты валидации/форматирования; UI пока не трогаем.
- [x] Создать `src/entities/work-file/api.js`: `listWorkFiles(workId)`, `initUpload(workId, {filename, sizeBytes})`, `confirmUpload(workId, fileId)`, `getDownloadUrl(workId, fileId)`, `deleteWorkFile(workId, fileId)`, `getStorageQuota()` — поверх `requestJson`.
- [x] Реализовать `putToStorage(uploadUrl, file, contentType, onProgress)` на `XMLHttpRequest` (PUT, `Content-Type = requiredContentType`, `upload.onprogress`) — **в обход** `request()`/`API_BASE_URL`/Bearer.
- [x] `src/entities/work-file/model/files.js`: `ALLOWED_EXTENSIONS`/`ACCEPT_ATTR` (whitelist), `isAllowedFile(file)`, `getFileExtension`, `formatBytes(n)`, `quotaPercent(used, limit)`, `onlyUploaded(files)`, `fitsInQuota(size, remaining, pending)`, `WORK_FILE_STATUS`.
- [x] Реэкспорт через `src/entities/work-file/index.js`.
- [x] Тесты: `api.test.js` (пути/методы; PUT мимо `request`, без Authorization, прогресс/ошибки; фильтр/unwrap списка), `model/files.test.js` (whitelist, formatBytes, quotaPercent, fitsInQuota, onlyUploaded). **27/27 зелёные, lint чистый.**
**Done when:** `npx vitest run entities/work-file` зелёный; функции импортируются без побочных эффектов. ✅

### Phase 2 — Очередь и хук загрузки `features/work-file-upload` ✅
**Outcome:** есть headless-логика очереди загрузки с прогрессом, параллельностью и повторами — проверяется юнит-тестами без UI.
- [x] `useUploadQueue(workId, { remainingBytes, maxParallel = 3, api, uploader, onFileDone })`: `addFiles` (валидация whitelist+квота, возвращает `{accepted, rejected[]}`), переходы состояний `queued→init→put→confirm→done|error`, прогресс по элементу, `retry`/`remove`/`clearFinished`/`activeCount`; pump ограничивает параллельность через `startedRef`.
- [x] `uploadOne` (чистый оркестратор): `init` → `putToStorage` (прогресс) → `confirm`; зависимости (api/sleep/backoff) инъектируются; `onFileDone` вызывается после confirm.
- [x] Авто-повтор: `isRetriable` (network/timeout, 403/410 истёкший URL, 408/429/5xx) + экспоненциальный backoff (`defaultBackoff`, cap 8s); каждый повтор переинициализирует init (re-sign URL); лимит `maxAttempts`; ручной `retry(localId)` и `remove(localId)`.
- [x] Пред-проверка квоты с учётом суммарного размера незавершённых элементов (`committedBytes` + `fitsInQuota`); `Infinity` = без лимита.
- [x] Тесты: `upload-one.test.js` (happy, истёкший URL→reinit, исчерпание попыток→error, фатальный 422 без повтора, isRetriable) + `use-upload-queue.test.js` (валидация типа/квоты, lifecycle→DONE+onFileDone, ограничение параллельности, retry/remove). **12/12 зелёные, lint чистый, полный набор 100/100.**
**Done when:** `npx vitest run features/work-file-upload` зелёный; хук не зависит от DOM-рендера. ✅

### Phase 3 — Виджет секции файлов + бар квоты `widgets/work-files` ✅
**Outcome:** самостоятельный виджет: dropzone, очередь с прогрессом, список UPLOADED, скачивание, удаление с подтверждением, бар квоты — рендерится на тестовой странице.
- [x] `WorkFilesSection({ workId, readOnly })`: загрузка списка (`listWorkFiles`+`onlyUploaded`) и квоты (`getStorageQuota`) параллельно; состояния Loading (skeleton) / Empty (`EmptyState`) / Error (inline + retry); тихий рефетч (`load({silent})`) без мигания скелетона.
- [x] `UploadDropzone` (drag&drop + `<input type=file multiple accept=ACCEPT_ATTR>` фолбэк, role=button, tabIndex, Enter/Space, focus-visible) → `handleFiles` → `useUploadQueue.addFiles`; `QueueItemRow` с прогресс-баром, спиннером, статусом и кнопками retry/remove; отклонённые файлы → toast по причине (`reject_type`/`reject_quota`).
- [x] Список файлов: имя, размер (`formatBytes` с локализованными единицами), скачать (`getDownloadUrl` → `window.open`), удалить → `AlertDialog` → `deleteWorkFile` → тихий рефетч.
- [x] `QuotaBar` used/limit (`quotaPercent`, `role=progressbar`, красный при ≥90%) над секцией.
- [x] После confirm (`onFileDone`)/delete — тихий рефетч списка и квоты.
- [x] `readOnly`: скрыты dropzone, очередь и удаление; остаётся список + скачивание; пустой текст `empty_desc_readonly`.
- [x] i18n-ключи `work_files.*` (24) во все 4 локали (uz/uz-Cyrl/ru/en); единицы размера локализованы через `work_files.units`; статусы/ошибки маппятся без сырых enum.
- [x] Smoke-тесты `WorkFilesSection.test.jsx` (3): загрузка+empty, список+скачивание, read-only скрывает удаление. **Зелёные, lint чистый, `npm run build` ок (1829 модулей), полный набор 103/103.**
**Done when:** виджет на тестовом роуте позволяет загрузить, увидеть в списке, скачать и удалить файл; бар квоты двигается; `npm run lint` без новых ошибок. ✅

### Phase 4 — Встраивание в форму работы + read-only просмотр ✅
**Outcome:** участник управляет файлами прямо в `WorkFormPage`; для несменяемых работ — read-only список со скачиванием.
- [x] Добавлена секция-карточка `FilesCard` (стиль как BasicInfo/RightHolders, иконка Paperclip) в `WorkFormPage.jsx` после блока правообладателей; при редактировании рендерит `<WorkFilesSection workId={id} readOnly={false} />`.
- [x] Для нового черновика (нет `id`) — предупреждающий баннер `work_files.save_first` («Сначала сохраните работу — затем можно прикрепить файлы»), т.к. init требует `workId`.
- [x] В ветке `isReadOnly` (submitted/decided) добавлен `FilesCard` с `<WorkFilesSection workId={id} readOnly />` — read-only список со скачиванием.
- [x] Заголовок секции — через `FilesCard` (общий паттерн карточек формы), i18n `work_files.title`/`section_sub`.
**Done when:** на DRAFT-работе видна рабочая секция файлов; на submitted-работе — read-only; create-флоу не падает (показывает подсказку). ✅ (`npm run build` ок, тесты 103/103, lint без новых предупреждений — единственное warning про `t` pre-existing.)

### Phase 5 — Карточка квоты на главной + сквозная проверка ✅
**Outcome:** квота видна на дашборде; вся фича проверена на живом бэкенде и тестами.
- [x] Добавлена самодостаточная карточка `StorageQuotaCard` (`widgets/work-files`) на `pages/dashboard` между `WorksStats` и `RecentWorksTable`: бар used/limit (`QuotaBar`) + строка «Свободно: …», грузит свой `getStorageQuota`.
- [x] Состояния карточки: loading (Skeleton), error/нет данных → тихо не рендерится (дашборд сам показывает свои ошибки); стиль `rounded-xl`/`shadow-soft`; i18n `work_files.remaining` в 4 локалях.
- [x] Интеграционные тесты `WorkFilesSection.integration.test.jsx`: drop→init→PUT(MockXHR)→confirm→файл в списке; delete→AlertDialog→DELETE→empty.
- [x] **Живая ручная проверка на ПРОДЕ** (`https://api.uzintellekt.uz`, dev-сервер с `VITE_API_BASE_URL=прод`, свежий токен) — пройдена end-to-end через браузер: реальный пользователь и квота на главной (0 Б / 500 МБ); на черновике секция файлов; drag&drop → init→PUT(хранилище)→confirm → файл в списке (235 Б) + квота обновилась до 235 Б; скачивание (`download-url` 200); удаление через AlertDialog → файл исчез, квота вернулась к 0; бэкенд после теста чист (0 файлов). Побочно подтверждено: бэкенд валидирует сигнатуру (magic-байты) — файл с несоответствующим содержимым отклоняется на confirm, и UI корректно показывает эту ошибку с retry/remove.
- [x] Прогон: `npx vitest run` (105/105), `npm run lint` (без новых; единственное warning `t` pre-existing), `npm run build` (ок).
**Done when:** карточка квоты на главной отражает реальные данные; полный прогон тестов/линта/сборки зелёный; ручной сценарий проходит. ✅ (кроме живого клик-через — нужен рабочий токен для :8080).

---

## Advanced Features

### Phase 6 — Возобновляемая / chunked загрузка
**Outcome:** большие файлы грузятся надёжнее, загрузка переживает обрывы.
- [ ] Chunked/multipart-загрузка (если бэкенд поддержит) или возобновление PUT по Range.
- [ ] Персист очереди (IndexedDB) для возобновления после перезагрузки страницы.
**Done when:** прерванная загрузка большого файла возобновляется без полного перезапуска.

### Phase 7 — Полировка UX очереди
**Outcome:** загрузка ощущается «продакшн-уровня».
- [ ] Превью изображений, общий индикатор прогресса по очереди, «Очистить завершённые».
- [ ] Тонкая настройка параллельности и тротлинг; отмена отдельного PUT (`xhr.abort`).
- [ ] Тосты с действиями (повторить все ошибочные).
**Done when:** очередь из 10+ файлов управляется удобно, без зависаний UI.

### Phase 8 — Файлы в админ-контуре (отдельная итерация)
**Outcome:** админ видит и модерирует файлы работ (вне охвата текущей итерации).
- [ ] `admin-work-files` (+ grid), `admin-work-files/{id}/download-url`, delete — после реализации админ-панели.
**Done when:** админ-страница работы показывает файлы и даёт скачать/удалить.

---

## Обновление (2026-07-01) — адаптация под новый бэкенд-контракт

Бэкенд сменил контракт жизненного цикла работ; фронт приведён в соответствие (админ — в отдельном `Admin-panel`, здесь не трогали):

- **Статусы работ:** `DRAFT / UNDER_REVIEW / REJECTED / REGISTERED` (убраны `PENDING/APPROVED/CANCELLED`). Редактирование/удаление/submit — для `DRAFT` **и** `REJECTED` (правка REJECTED → DRAFT).
- **Отмена → мягкое удаление:** `PATCH /cancel` убран; добавлено `DELETE /works/{id}` (только DRAFT/REJECTED) + `DeleteWorkButton`.
- **Гейт submit:** активен только при ≥1 файле `UPLOADED`; бэкенд иначе `1022`.
- **Статус файла `EXPIRED`:** 3-дневный ретеншен на DRAFT/REJECTED → «надгробие» без скачивания; показываются UPLOADED+EXPIRED, скрыты PENDING/DELETED.
- **Автосейв (frontend-only):** локальный черновик в `localStorage` (восстановление при возврате, чистка на logout) + пуш на бэк только когда форма валидна (бэк не принимает частичный DRAFT); единый **single-flight** create (нет дублей черновиков); trailing-повтор для правок во время in-flight. Кнопка «Сохранить» убрана, индикатор скрыт, дебаунс 2с.
- **Пред-создание при дропе файла:** дроп валидного файла на новой работе создаёт черновик и прикрепляет на месте (баннер `save_first` — только фолбэк для невалидной формы).
- **Ошибки:** единый маппинг `errorCode → i18n` (`api-error.js`): 1015 квота, 1020 rate-limit (429, без цикл-ретрая), 1021 лимит 3 черновиков, 1022 submit без файла.
- **Whitelist файлов:** только `PDF / DOC / DOCX`.
