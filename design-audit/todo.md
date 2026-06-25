# Мастер-чеклист (попиксельная проверка каждого UI-элемента)

Статусы: ⬜ не проверено · 🔎 осмотрено (есть заметки) · ✅ выверено/унифицировано

## ✅ Сделано (редизайн)
- ✅ Бренд: единый логотип-щит + © (F2 compact) в шапке сайта и сайдбаре кабинета; favicon.svg.
- ✅ Фундамент: палитра v2 (ярче синий #2563EB, акцент-коралл), Spectral для заголовков сайта (Inter в кабинете).
- ✅ Главная сайта: эйбрау-метки секций, hover-стрелки на карточках услуг, «Barcha yangiliklar», строка доверия в hero.
- ✅ Баг: двойная стрелка «Batafsil → →» в карточках новостей (стрелка была в строке i18n, во всех 3 локалях).
- ✅ About: эйбрау к разделу ценностей.
- ⚠️ B1: НЕ как описано — в коде `CREATED` = `variant: 'success'` и лейбл «Подписан/Signed» (идентичен `SIGNED`) во всех локалях; `info`/«Yaratilgan» в коде нет. Нужно подтверждение намерения (вернуть info+«Yaratilgan» или принять текущее как осознанный выбор).
- ✅ B2/B3: даты новостей → ISO + единый `formatDate()` (Intl, локализуется); поля унифицированы (`content`).
- ⏳ B4: форма контактов — код готов под EmailJS, ждёт ключи (serviceId/templateId/publicKey пусты в .env.local). **ОТЛОЖЕНО: у заказчика пока нет доступа к почте — вернуться, когда появится доступ и можно будет создать EmailJS service/template и получить ключи.**
- ✅ Кабинет: проверен на мобайле (495px) — сайдбар off-canvas + бургер, таблицы в overflow-auto, форма со sticky-футером. Дефектов нет; новый бренд/палитра применены.
- ✅ Адаптив: сайт проверен через agent-browser на настоящих viewport — мобайл 390 (бургер, hero/секции/футер стопкой, форма ок) и планшет 768 (бургер, 1 колонка). Кабинет — мобайл 495 (off-canvas сайдбар, бургер, таблицы overflow). Поломок нет.
- ✅ Баг (найден через agent-browser): узбекская дата в headless-Chromium давала «2026 M06 04» (пробел в ICU `uz`). `formatDate` переведён на явные названия месяцев uz/ru/en → «04 iyn 2026» детерминированно везде.

## uz-intellekt — страницы
- 🔎 `/` Home — Hero, ServicesPreview, HowItWorks, NewsPreview, Partners
- 🔎 `/services` Services — hero (синий), карточки услуг, статы
- ⬜ `/services/depositing` Depositing
- 🔎 `/about` About — hero, missiya/maqsad, qadriyatlar
- ⬜ `/about/leadership` Leadership
- ⬜ `/about/structure` Structure
- ⬜ `/about/board` Board
- ⬜ `/about/partners` Partners
- 🔎 `/news` News — поиск, фильтры-чипы, сетка карточек, «Barchasini ko'rish»
- ⬜ `/news/:id` NewsDetail
- 🔎 `/contact` Contact — контакты, карта, форма (см. B4)
- 🔎 `/login` Login — OneID welcome card
- ⬜ `/register` Register
- ⬜ `*` NotFound
- ⬜ Header / DesktopMenu / MobileMenu (бургер, дропдауны)
- 🔎 Footer
- ⬜ LanguageSwitcher (UZ/RU/EN — проверить все 3 локали на всех страницах)

## dashboard — страницы
- 🔎 `/` Dashboard — welcome card, статы (4), So'nggi arizalar
- 🔎 `/works` Works — табы, поиск+фильтры, таблица, бейджи статусов
- ⬜ `/works/new` WorkForm (осмотрен верх) — секции, валидация, sticky-футер, тост
- ⬜ `/works/:id/edit` WorkForm edit
- 🔎 `/contracts` Contracts — таблица, статус (см. B1), Ko'rish/Yuklab olish
- 🔎 `/profile` Profile — header, поля, inline-edit (Tahallus/Telefon/Manzil)
- ⬜ PdfPreviewModal (Ko'rish договора)
- ⬜ `*` NotFound
- ⬜ Sidebar (collapse «), Header (поиск, user), Breadcrumbs

## Общие shared/ui компоненты (проверить оба проекта, свести к идентичности)
- ⬜ button (варианты: default/outline/ghost/destructive/success, размеры)
- ⬜ badge (варианты: default/success/warning/muted/destructive)
- ⬜ card · input · textarea · label · field-error
- ⬜ select · checkbox · popover · dialog · alert-dialog · tooltip · tabs
- ⬜ table · pagination · skeleton
- ⬜ empty-state · loading-state · page-header
- ⬜ sonner (тосты) — позиция/стиль одинаковы
- ⬜ SearchableCombobox (uz) — проверить, есть ли аналог в dashboard

## Сквозные проверки
- ⬜ Адаптив: 1440 / 768 / 375 для всех страниц
- ⬜ Локализация: UZ / RU / EN полностью
- ⬜ Доступность: focus-visible, контраст, aria, reduced-motion
- ⬜ Состояния списков: loading / empty / error
