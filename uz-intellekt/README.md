# Uz Intellekt Dashboard

Modern, secure React + Vite application with OneID OAuth 2.0 integration.

**Status:** 🟢 Production Ready  
**Security Level:** Senior-Grade (PKCE, CSRF Protection, Rate Limiting)  
**Last Updated:** April 14, 2026

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (or LTS)
- npm or yarn
- OneID Client ID: `uzintellekt_uz`

### Installation

```bash
git clone https://github.com/uzintellekt/uz-intellekt.git
cd uz-intellekt
npm install
```

### Development

```bash
npm run dev
# Opens http://localhost:5173
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 🔐 OneID Integration

### Authentication Architecture (v2 - March 2026)

The app now uses a **unified authentication entry point** (`/auth`) with conditional routing:

```
/auth (Landing Page)
├── Kirish (Login) → OneID → isMember=true → Dashboard
└── Azo bolish (Join) → OneID → isMember=false → Contract → Register → Dashboard
```

### Configuration

All OneID settings are in `.env` files:

**Production** (`.env.production`)

```env
VITE_ONEID_CLIENT_ID=uzintellekt_uz
VITE_ONEID_REDIRECT_URI=https://dashboard.uzintellekt.uz/auth
VITE_API_BASE_URL=https://api.uzintellekt.uz
VITE_ENVIRONMENT=production
```

**Development** (`.env.local`)

```env
VITE_ONEID_CLIENT_ID=uzintellekt_uz
VITE_ONEID_REDIRECT_URI=http://localhost:5173/auth
VITE_API_BASE_URL=https://api.uzintellekt.uz
VITE_ENVIRONMENT=development
```

### Key Components

- **AuthEntry.jsx** - Unified entry page with Kirish/Azo bolish buttons
- **ContractStep.jsx** - Contract display & signature acceptance for new members
- **useAuth.jsx** - Authentication context with new isMember handling

### Features

- ✅ **PKCE OAuth 2.0** - Authorization code interception prevention
- ✅ **CSRF Protection** - State validation with 10-minute expiry
- ✅ **Conditional Routing** - Member vs non-member flows
- ✅ **Contract Management** - Terms acceptance for new members
- ✅ **Form Encryption** - Sensitive data XOR encrypted
- ✅ **Rate Limiting** - Callback spam prevention
- ✅ **Security Logging** - Attack detection & monitoring
- ✅ **Error Sanitization** - No backend info leakage
- ✅ **URL Cleanup** - Authorization codes removed from history

---

## 📚 Documentation

- [AUTH_FLOW_SUMMARY.md](./AUTH_FLOW_SUMMARY.md) - **START HERE** - Complete auth flow documentation
- [CONFIG_REFERENCE.md](./CONFIG_REFERENCE.md) - Configuration details
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md) - Technical security docs
- [SECURITY_QUICK_REFERENCE.md](./SECURITY_QUICK_REFERENCE.md) - Implementation guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment steps

---

## 🏗️ Project Structure

```
uz-intellekt/
├── src/
│   ├── components/              # React components
│   ├── pages/                   # Page components (Auth, Home, etc.)
│   ├── hooks/                   # Custom hooks (useAuth, etc.)
│   ├── services/                # API services
│   ├── utils/                   # Utilities (security, helpers)
│   ├── config/                  # Configuration files
│   │   └── oneid.config.js      # OneID OAuth config
│   ├── i18n/                    # Internationalization
│   ├── store/                   # State management
│   ├── router/                  # Route definitions
│   ├── App.jsx                  # Root component
│   └── main.jsx                 # Entry point
├── public/                      # Static files
├── .env                         # Environment variables
├── .env.local                   # Local development env
├── .env.production              # Production env
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔧 Key Files

### Authentication (New Flow - v2)

- `src/pages/Auth/AuthEntry.jsx` - **Unified entry page** (Kirish / Azo bolish)
- `src/pages/Auth/ContractStep.jsx` - Contract display & signature for non-members
- `src/pages/Auth/Register.jsx` - Registration with optional contract step
- `src/hooks/useAuth.jsx` - Auth context & OAuth 2.0 flow with isMember handling

### Configuration

- `src/config/oneid.config.js` - OneID OAuth config (response_type, scope, PKCE)

### Security

- `src/utils/securityUtils.js` - Security utilities (validation, encryption)
- `src/utils/configValidator.js` - Configuration validation

---

## 🧪 Testing

### Test Unified Auth Flow

**Scenario 1: Existing Member (isMember=true)**

1. Navigate to http://localhost:5173/auth
2. Click "Kirish" button
3. Complete OneID authentication
4. Backend returns `isMember: true`
5. **Expected**: Redirect directly to dashboard

**Scenario 2: New Member (isMember=false)**

1. Navigate to http://localhost:5173/auth
2. Click "Azo bolish" button
3. Complete OneID authentication
4. Backend returns `isMember: false`
5. **Expected**: Contract step displays
6. Accept contract and sign
7. **Expected**: Registration form displays
8. Fill form and submit
9. **Expected**: New account created, redirect to dashboard

**Scenario 3: Contract Rejection**

1. At contract step, click "Bekor qilish"
2. **Expected**: Return to /auth entry page

### Verify Security Features

- Authorization codes not in browser history ✓
- Session data encrypted in sessionStorage ✓
- Rate limiting after 3 attempts ✓
- PKCE verifier sent to backend ✓
- State token validates OneID response ✓

---

## 🔒 Security Features

### Frontend

- [x] OAuth 2.0 PKCE (SHA-256)
- [x] CSRF state validation
- [x] Timing-safe comparison
- [x] Form data encryption
- [x] Authorization code validation
- [x] URL history cleanup
- [x] Token response validation
- [x] Error message sanitization
- [x] Redirect URI validation
- [x] Callback rate limiting
- [x] Session cleanup on logout
- [x] Security event logging

### Backend Requirements

- [ ] PKCE code_verifier validation
- [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] HttpOnly Secure cookies
- [ ] Request origin validation
- [ ] Security event logging endpoint

---

## 📦 Dependencies

### Core

- **react** - UI library
- **react-router-dom** - Routing
- **vite** - Build tool
- **tailwindcss** - Utility CSS

### Build Tools

- **@vitejs/plugin-react** - React Fast Refresh
- **@tailwindcss/vite** - Tailwind CSS integration

### Development

- **eslint** - Code linting
- **@eslint/js** - ESLint configuration

---

## 🌍 Internationalization (i18n)

Supported languages:

- 🇺🇿 **Uzbek** (uz.json)
- 🇷🇺 **Russian** (ru.json)
- 🇬🇧 **English** (en.json)

Configuration: `src/i18n/index.js`

---

## 🚨 Common Issues

### "Configuration validation failed"

**Solution:** Check .env file is in project root and has correct values

```bash
cat .env
```

### "Redirect URI mismatch"

**Solution:** Verify VITE_ONEID_REDIRECT_URI matches OneID app settings

```bash
# Local development should have:
VITE_ONEID_REDIRECT_URI=http://localhost:5173/register

# Production should have:
VITE_ONEID_REDIRECT_URI=https://dashboard.uzintellekt.uz/register
```

### "PKCE code_verifier not received"

**Solution:** Backend needs to handle code_verifier parameter

```javascript
// Backend endpoint should receive:
{
  code: "...",
  redirect_uri: "https://dashboard.uzintellekt.uz/register",
  code_verifier: "..."  // ← This is PKCE verifier
}
```

---

## 📞 Support

- **OneID Portal:** https://id.egov.uz
- **Dashboard:** https://dashboard.uzintellekt.uz
- **API:** https://api.uzintellekt.uz
- **GitHub:** https://github.com/uzintellekt/uz-intellekt

---

## 📄 License

Private - Uz Intellekt Team

---

## 👥 Contributing

1. Create a feature branch
2. Commit changes
3. Push to branch
4. Create Pull Request

---

**Built with ❤️ for Uz Intellekt**  
**Security Audit:** Senior-Grade ✅  
**Production Ready:** April 14, 2026 🚀
