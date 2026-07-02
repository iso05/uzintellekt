# UzIntellekt — Asosiy veb-sayt (`uz-intellekt`)

Intellektual mulk himoyasi platformasining **ommaviy veb-sayti**: bosh sahifa, xizmatlar,
yangiliklar, biz haqimizda, aloqa hamda OneID orqali a'zo bo'lish/ro'yxatdan o'tish oqimi.

> Boshqaruv paneli (a'zolar kabineti) alohida `../dashboard` loyihasida joylashgan.

## 🚀 Ishga tushirish

```bash
npm install
npm run dev      # Vite dev-server
npm run build    # production build
npm run preview  # build natijasini ko'rish
npm run test     # Vitest
npm run lint     # ESLint
```

### Muhit o'zgaruvchilari (`.env.local`)

| O'zgaruvchi | Tavsif |
|-------------|--------|
| `VITE_ONEID_CLIENT_ID` | OneID client id |
| `VITE_ONEID_REDIRECT_URI` | OneID callback URL — sayt `/login` sahifasiga qaytadi |
| `VITE_API_BASE_URL` | Backend API bazaviy URL |
| `VITE_EMAILJS_*` | Aloqa formasi uchun EmailJS (ixtiyoriy; bo'sh bo'lsa `mailto:` fallback) |

> ⚠️ `VITE_ONEID_REDIRECT_URI` dagi port `npm run dev` ishlaydigan port bilan mos bo'lishi shart
> (OneID da ro'yxatdan o'tgan callback URL bilan ham). Hozirgi `.env.local` `/login` yo'lini ishlatadi.

## 🏗 Arxitektura — Feature-Sliced Design (FSD)

```
src/
├── shared/      # umumiy qatlam: ui (Button, Input, Card...), lib (utils, download)
├── entities/    # biznes-entitilar (news)
├── widgets/     # mustaqil bloklar (header, footer, layout, mobile-menu)
├── pages/       # Home, About, Services, News, Contact, Auth
├── services/    # Axios API (api.js)
├── hooks/       # useAuth va boshqalar
├── config/      # oneid.config.js
├── data/        # statik ma'lumotlar (newsData.js) — /news va bosh sahifa preview uchun yagona manba
├── i18n/        # tarjimalar: uz, uz-Cyrl, ru, en
├── utils/       # yordamchi funksiyalar (securityUtils.js ...)
└── router/      # AppRouter
```

## 🔐 OneID autentifikatsiya oqimi

1. `useAuth.loginWithOneId()` — random `state` (CSRF himoya) yaratadi, uni `sessionStorage`ga
   saqlaydi va `oneid.config.js` (`ONEID_CONFIG`) hamda muhit o'zgaruvchilaridan redirect URL
   quradi.
2. OneID `/login?code=...&state=...` ga qaytaradi → `useAuth.handleCallback()` saqlangan `state`ni
   tekshiradi, so'ng `POST /api/v1/auth/sso/one-id` orqali token va `GET /api/v1/users/me` orqali
   foydalanuvchini oladi.
3. `isMember: true` → kabinetga; `isMember: false` → `/register` (shartnoma preview + raqamli imzo).

## 🧰 Texnologik stack

- **React 19** + **React Router DOM v7**
- **Vite** (build)
- **TailwindCSS** + **Radix UI** primitivlari
- **Axios** (interceptorlar bilan)
- **i18next / react-i18next** (4 til)
- **Zustand** (zarur joyda) + React Context / Custom Hooks
- **Vitest** + Testing Library (testlar)
