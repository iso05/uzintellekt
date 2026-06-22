# Uzintellekt Platformasi

Uzintellekt - O'zbekistonda intellektual mulk himoyasi va xizmatlarini taqdim etuvchi zamonaviy veb-platforma bo'lib, o'zida ikkita asosiy qismni mujassamlashtiradi: **Asosiy veb-sayt (uz-intellekt)** va **Boshqaruv paneli (dashboard)**.

## 🏗 Arxitektura va Papkalar Tuzilmasi (Clean Architecture)

Loyiha frontend qismida zamonaviy **React + Vite** texnologiyalaridan foydalanilgan hamda **Clean Architecture** tamoyillariga muvofiq quyidagi papka tuzilmasiga ajratilgan:

### 1. `uz-intellekt` (Asosiy Veb-sayt)
Foydalanuvchilar platformaga a'zo bo'lishi, ro'yxatdan o'tishi va tizim imkoniyatlari bilan tanishishi uchun xizmat qiladi.

- `src/assets/styles/` - Tizimning umumiy va moslashtirilgan CSS uslublari (shu jumladan `index.css`).
- `src/components/` - Takror ishlatiladigan UI komponentlar (masalan, Input, Button, Modal).
- `src/pages/` - Alohida sahifalar (Auth, Home, About, Services va boshqalar).
- `src/services/` - Tashqi API'larga so'rov yuborish uchun markazlashtirilgan funksiyalar (Axios orqali).
- `src/hooks/` - Takrorlanuvchi logikalar uchun qulay bo'lgan "Custom Hook"lar (masalan, `useAuth`).
- `src/utils/` - Yordamchi funksiyalar va doimiy o'zgaruvchilar (masalan, `navConfig.js`).
- `src/router/` - Tizim bo'ylab marshrutlash (React Router v6).

### 2. `dashboard` (Boshqaruv Paneli / Admin Panel)
Platformaga OneID yoki tizim orqali kirgan a'zolar uchun xizmat ko'rsatish paneli.
- Xuddi shunday **Clean Architecture** bilan tashkil etilgan (`src/assets/styles/`, `src/pages/`, `src/components/`).
- Oq-qora rangli, toza, professionallar uchun mo'ljallangan interfeys (Admin Panel dizayni).
- Autentifikatsiya holatini doimiy tekshirish va a'zoligini tasdiqlagan (isMember: true) foydalanuvchilar uchungina xizmat qiladi.

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
- **Framework**: React 18
- **Build tool**: Vite
- **Routing**: React Router DOM (v6)
- **API Muloqot**: Axios (interceptors bilan birga)
- **Dizayn va Stil**: Vanilla CSS & TailwindCSS (kerakli qismlar uchun), shuningdek modern, responisve dizayn patternlari.
- **Form va Validation**: Formik / React Hook Form / Zod (kerak bo'lgan joylarda)
- **Holatni Boshqarish (State Management)**: React Context / Custom Hooks.

## 💻 Asosiy Funksionalliklar
1. Foydalanuvchi profilini boshqarish (`/api/v1/users/me`)
2. OneID orqali xavfsiz avtorizatsiya va tokenlarni avtomatik yangilash (Refresh Token mekanizmi).
3. Dinamik Contract (shartnoma) yaratish va raqamli imzo qo'shish modullari.

## 🧹 Kodning Tozaligi haqida
Barcha asosiy mantiq modullarga bo'lingan. Foydalanilmagan kod bloklari (console.log, hardcoded statik fayllar) tozalanib, tushunarli tartibda izohlar (comments) yozib chiqilgan bo'lib, jamoada yangi dasturchilar dasturga tez qo'shilib ketishi uchun optimallashtirilgan.
