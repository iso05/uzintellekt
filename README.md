# Uzintellekt Platformasi

Uzintellekt - O'zbekistonda intellektual mulk himoyasi va xizmatlarini taqdim etuvchi zamonaviy veb-platforma bo'lib, o'zida ikkita asosiy qismni mujassamlashtiradi: **Asosiy veb-sayt (uz-intellekt)** va **Boshqaruv paneli (dashboard)**.

## 🏗 Arxitektura va Papkalar Tuzilmasi (Clean Architecture)

Loyiha frontend qismida zamonaviy **React + Vite** texnologiyalaridan foydalanilgan hamda **Clean Architecture** tamoyillariga muvofiq quyidagi papka tuzilmasiga ajratilgan:

### 1. `uz-intellekt` (Asosiy Veb-sayt)
Foydalanuvchilar platformaga a'zo bo'lishi, ro'yxatdan o'tishi va tizim imkoniyatlari bilan tanishishi uchun xizmat qiladi.

Tuzilma **Feature-Sliced Design (FSD)** tamoyiliga muvofiq tashkil etilgan:

- `src/shared/` - Umumiy qatlam: UI primitivlari (`shared/ui` — Button, Input, Card va h.k.) va yordamchi kutubxonalar (`shared/lib`).
- `src/entities/` - Biznes-entitilar (masalan, `entities/news`).
- `src/widgets/` - Mustaqil UI bloklari (header, footer, layout, mobile-menu).
- `src/pages/` - Alohida sahifalar (Auth, Home, About, Services, News, Contact).
- `src/services/` - Tashqi API'larga so'rov yuborish uchun markazlashtirilgan funksiyalar (Axios orqali).
- `src/hooks/` - Takrorlanuvchi logikalar uchun "Custom Hook"lar (masalan, `useAuth`).
- `src/config/` - Konfiguratsiya (masalan, `oneid.config.js`).
- `src/data/` - Statik ma'lumotlar (masalan, `newsData.js`).
- `src/i18n/` - Tarjimalar (uz, uz-Cyrl, ru, en).
- `src/utils/` - Yordamchi funksiyalar.
- `src/router/` - Tizim bo'ylab marshrutlash (React Router v7).

### 2. `dashboard` (Boshqaruv Paneli / Admin Panel)
Platformaga OneID yoki tizim orqali kirgan a'zolar uchun xizmat ko'rsatish paneli.
- Xuddi shunday **Clean Architecture** bilan tashkil etilgan (`src/assets/styles/`, `src/pages/`, `src/components/`).
- Oq-qora rangli, toza, professionallar uchun mo'ljallangan interfeys (Admin Panel dizayni).
- Autentifikatsiya holatini doimiy tekshirish va a'zoligini tasdiqlagan (isMember: true) foydalanuvchilar uchungina xizmat qiladi.

## 📦 Umumiy UI qatlami — `packages/ui` (`@shared`)

`dashboard` va `admin` ilovalarining umumiy qatlami **bitta joyda** — `packages/ui/` da (npm **workspaces**). Umumiy komponent yoki dizayn-token faqat shu yerda o'zgartiriladi va ikkala ilova avtomatik oladi.

- **Import qoidasi:** umumiy = `@shared/*` (ui, api, lib, data, config/env, styles, i18n); ilovaga xos = `@/*`.
- **`packages/ui` tarkibi:** `ui/` (24 komponent), `api/`, `lib/` (csv, activity-log, format…), `data/geo`, `config/env.js`, `styles/index.css` (tokenlar), `i18n/` — `createI18n(resources)` fabrikasi, `tailwind.preset.js`.
- **Ilovaga xos (packages/ui da EMAS):** `src/config/routes.js` (navigatsiya har xil) va tarjimalar `src/i18n/*.json` (har ilova o'z JSON'lari bilan `createI18n` chaqiradi).
- **Infratuzilma:** ildizda `package.json` (workspaces) + bitta `npm install` (umumiy `node_modules`, bitta React). Har ilovada vite/vitest `@shared` alias + `server.fs.allow:['..']`, tailwind `presets:[uiPreset]`.

**Buyruqlar (ildizdan):**

```bash
npm install            # workspaces: hamma bog'liqliklarni ildizga o'rnatadi
npm run build          # admin + dashboard build
npm run test           # admin + dashboard testlar (packages/ui testlari ham)
npm run check:shared   # drift-guard: <app>/src/shared yoki @/shared bo'lsa xato beradi
npm run verify         # check:shared + build (CI da ishlaydi)
```

> ⚠️ **Qoida:** ilovalar ichida `src/shared/` yoki `@/shared/` importlarini qayta yaratmang — umumiy kod faqat `packages/ui` da. `npm run check:shared` (CI) buni tekshiradi.

## 🔐 Autentifikatsiya (Auth Flow)

1. **OneID va Login**: Foydalanuvchilar OneID xizmati yoki standart login/parol yordamida kirishadi. API bu jarayonda tokenlar hamda foydalanuvchi turini aniqlaydi.
2. **A'zolikni (isMember) tasdiqlash**: Tizimga muvaffaqiyatli kirgan (lekin a'zo bo'lmagan) mijoz to'g'ridan-to'g'ri `dashboard`ga kiritilmaydi. Avval uni `uz-intellekt` tizimidagi ro'yxatdan o'tish (Register) jarayoniga yo'naltiriladi.
3. **Register (Ro'yxatdan o'tish) va Shartnoma**: Ro'yxatdan o'tish jarayonida foydalanuvchiga API tomonidan generatsiya qilingan ("Preview Contract") elektron shartnoma PDF ko'rinishida ko'rsatiladi. Foydalanuvchi ekranda imzo chekadi (Canvas texnologiyasi yordamida) va imzolangan ma'lumotlar bilan shartnomaga rozi bo'ladi.
4. **Platformaga yo'naltirish**: Muvaffaqiyatli shartnoma tuzilgandan so'nggina tizim `isMember: true` deb hisoblaydi va mijoz endi `dashboard`dan to'liq foydalanishi mumkin bo'ladi.

## 📄 PDF Shartnomalar Mexanizmi
Eski versiyada shartnomalar statik `.pdf` fayl sifatida saqlangan bo'lsa, tizim takomillashtirilib quyidagi usulga o'tildi:
- Frontend tomonida qattiq belgilangan (hardcoded) PDF fayllar olib tashlandi (dastur vazni yengillashdi va toza holatga keltirildi).
- Uning o'rniga dinamik `POST /api/v1/contracts/preview` Swagger API yordamida har bir foydalanuvchi ma'lumotiga qarab real vaqtda PDF generatsiya qilinib ekranda aks etadi.

## 🚀 Texnologik Stack
- **Framework**: React 19
- **Build tool**: Vite
- **Routing**: React Router DOM (v7)
- **API Muloqot**: Axios (interceptors bilan birga)
- **Dizayn va Stil**: TailwindCSS + Radix UI primitivlari, modern, responsive dizayn patternlari.
- **Holatni Boshqarish (State Management)**: React Context / Custom Hooks + Zustand.

## 💻 Asosiy Funksionalliklar
1. Foydalanuvchi profilini boshqarish (`/api/v1/users/me`)
2. OneID orqali xavfsiz avtorizatsiya va tokenlarni avtomatik yangilash (Refresh Token mekanizmi).
3. Dinamik Contract (shartnoma) yaratish va raqamli imzo qo'shish modullari.

## 🧹 Kodning Tozaligi haqida
Barcha asosiy mantiq modullarga bo'lingan. Foydalanilmagan kod bloklari (console.log, hardcoded statik fayllar) tozalanib, tushunarli tartibda izohlar (comments) yozib chiqilgan bo'lib, jamoada yangi dasturchilar dasturga tez qo'shilib ketishi uchun optimallashtirilgan.
