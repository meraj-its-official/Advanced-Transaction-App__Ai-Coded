# 💸 PayFlow — Digital Wallet Platform

<div align="center">

![PayFlow Banner](https://img.shields.io/badge/PayFlow-Digital%20Wallet-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyek0xMiAyMGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bTEtMTNoLTJ2NWwtNC4yNSAyLjU1Ljc1IDEuMjMgNS01VjdoLTF6Ii8+PC9zdmc+)

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-1.16-6366f1?style=flat-square)](https://better-auth.com/)
[![Arcjet](https://img.shields.io/badge/Arcjet-Security-FF4500?style=flat-square)](https://arcjet.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**A bank-grade, full-stack digital wallet with real-time P2P payments, enterprise security, and multi-provider authentication.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Docs](#-api-documentation) · [Security](#-security-overview) · [Contributing](#-contributing)

</div>

---

## 📖 Overview

**PayFlow** is a production-ready digital wallet platform built as a Turborepo monorepo. It demonstrates a modern fintech stack combining real-time peer-to-peer payments, multi-factor authentication, enterprise-grade API security, and rich analytics — all in a sleek dark-themed UI.

> *"Do not save what is left after spending, but spend what is left after saving."* — Warren Buffett

### Key Value Propositions

- 🔐 **Bank-grade security** — Arcjet multi-tier rate limiting + shield + bot detection + payment PINs
- 🔑 **Flexible authentication** — Email/Password, Google OAuth, GitHub OAuth via Better Auth 
- 💳 **Real-time wallet operations** — Add funds, withdraw, send P2P with live balance updates
- 📊 **Actionable analytics** — Month-over-month stats, settlement rates, spending category breakdown
- 📧 **Real OTP delivery** — Password reset via email (Nodemailer/Gmail) + SMS (Twilio / Fast2SMS)
- 🧩 **Monorepo architecture** — Shared types, Prisma client, and config across all apps

---

## ✨ Features

### 🔑 Authentication & Identity
- **Email/Password** sign-up and sign-in with bcrypt hashing
- **Google OAuth** and **GitHub OAuth** social login via Better Auth
- **JWT tokens** (access + refresh) with HttpOnly cookie handling
- **Better Auth sessions** — dual-mode guard checks BA session before falling back to JWT
- **Forgot Password** flow with real OTP delivery:
  - 📧 Email via Gmail SMTP or any SMTP provider (Nodemailer)
  - 📱 SMS via Twilio or Fast2SMS (Indian gateway)
  - 60-second resend cooldown with live countdown timer
- **Payment PIN** creation, verification, and change
- **Delete Account** (soft-delete) — requires typing `DELETE` to confirm

### 💰 Digital Wallet
- Real-time balance display
- **Add Money** to wallet (simulated bank debit)
- **Withdraw** to linked bank account
- Payment PIN gate on all sensitive operations
- Wallet ID shown on Profile Card for easy P2P discovery

### 💸 P2P Payments
- Send money by **phone number** or **wallet ID**
- Transaction search and **type filter** (all / sent / received)
- Paginated transaction history with timestamps, amounts, and counterparty info
- Full transaction detail view

### 📊 Analytics & Reporting
- **Month-over-month percentage change** for sent, received, and transaction count
- **Settlement rate** — percentage of transactions fully completed
- **Weekly trend** sparkline chart
- **Spending category breakdown** (pie/donut chart via Recharts)
- Spending trends bar chart

### 🏦 Wallet & Payment Sources
- Link bank accounts (account number + IFSC validation)
- Unlink bank accounts
- Real empty-state when no accounts are linked
- Displays linked card details with masked account numbers

### 🛡️ Security (Arcjet Enterprise)
| Tier | Applied To | Rules |
|---|---|---|
| `FINANCIAL` | Add money, withdraw, send payment | Shield, bot detection, `5 req/min` sliding window |
| `AUTH` | Login, forgot/reset password | Shield, bot detection, `10 req/5min` sliding window |
| `SIGNUP` | Register | Shield, bot detection, `validateEmail` (disposable block), `5 req/hour` |
| `PIN` | Set/verify payment PIN | Shield, bot detection, `3 req/min` sliding window |
| `EDGE` | All Next.js routes (middleware) | Shield, bot detection, `100 req/min` sliding window |

- Payment PIN (bcrypt-hashed, separate from account password)
- Helmet HTTP security headers
- NestJS built-in throttler as secondary defence

### 🎨 UI / UX
- **Dark theme** — `#0a0a0f` background, indigo-violet gradient accents
- **Split-screen auth cover** with 5 rotating financial quotes (auto-advance every 6 s)
- **Sidebar toggle** — hide/show with animated icon
- **Profile Card Modal** — user info, wallet ID, PIN status badge, delete account flow
- Responsive layout (mobile-first)
- Framer Motion micro-animations
- Toast notifications

### 🔔 Notifications
- In-app notification centre
- Fraud alert system with automated detection rules

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS 3 |
| **State Management** | Zustand, React Hook Form, Zod |
| **Charts & Animation** | Recharts, Framer Motion |
| **Backend** | NestJS 10, TypeScript 5, Passport.js (JWT strategy) |
| **Authentication** | Better Auth 1.16 (Prisma adapter, Google, GitHub, Email/Password) |
| **Security** | Arcjet (`@arcjet/node`, `@arcjet/nest`, `@arcjet/next`) |
| **ORM** | Prisma 5.22 |
| **Database** | PostgreSQL 16 (Docker) |
| **Cache / Queue** | Redis 7 (Docker) |
| **Email** | Nodemailer (Gmail SMTP / standard SMTP) |
| **SMS** | Twilio / Fast2SMS |
| **Monorepo** | Turborepo + npm workspaces |
| **Linting/Formatting** | ESLint, Prettier |

---

## 📁 Project Structure

```
Wallet-Web-App/
├── apps/
│   ├── api/                        # NestJS REST API (port 5000)
│   │   └── src/
│   │       ├── arcjet/             # Enterprise security module
│   │       │   ├── arcjet.module.ts
│   │       │   ├── arcjet.service.ts
│   │       │   ├── arcjet.guard.ts   (global APP_GUARD)
│   │       │   └── arcjet.decorators.ts
│   │       ├── auth/               # Auth — JWT + Better Auth + OTP
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.guard.ts     (dual-mode JWT + BA)
│   │       │   ├── better-auth.ts    (BA config)
│   │       │   └── otp-delivery.service.ts
│   │       ├── wallet/             # Wallet balance & operations
│   │       ├── payments/           # P2P payments & history
│   │       ├── analytics/          # Spending analytics & stats
│   │       ├── bank-accounts/      # Link/unlink bank accounts
│   │       ├── fraud/              # Automated fraud detection
│   │       └── notifications/      # In-app notifications
│   │
│   └── web/                        # Next.js 14 frontend (port 3007)
│       └── src/
│           ├── app/
│           │   ├── (auth)/         # Login, Register (split-screen)
│           │   └── (dashboard)/    # Dashboard, Wallet, Payments, Analytics
│           ├── components/
│           │   ├── auth/           # AuthCoverPanel, OTP UI
│           │   ├── features/       # ProfileModal, etc.
│           │   ├── layout/         # Sidebar, Header
│           │   ├── providers/      # AuthProvider, ThemeProvider
│           │   └── ui/             # Shared design system components
│           ├── lib/
│           │   ├── api.ts          # Axios instance (withCredentials)
│           │   └── better-auth-client.ts
│           ├── store/              # Zustand stores (auth, wallet, …)
│           └── middleware.ts       # Arcjet edge security
│
├── packages/
│   ├── database/                   # Prisma schema, migrations, PrismaClient
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   ├── types/                      # Shared TypeScript interfaces
│   ├── config/                     # Shared app config
│   └── ui/                         # Shared UI component library
│
├── docker-compose.yml              # PostgreSQL + Redis
├── turbo.json                      # Turborepo pipeline
├── package.json                    # Root npm workspaces
└── .env                            # Root environment variables
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│           Next.js 14 App (Tailwind + Zustand + BA client)       │
│           Arcjet Edge Middleware (shield + bot + rate-limit)     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────────────┐
│                    NestJS API (port 5000)                        │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Arcjet   │  │ Better Auth│  │ Passport │  │  OTP Delivery│  │
│  │ Guard    │  │ /api/auth/*│  │ JWT Guard│  │  (Email+SMS) │  │
│  └──────────┘  └────────────┘  └──────────┘  └──────────────┘  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Auth    │  │  Wallet    │  │ Payments │  │  Analytics   │  │
│  │ Module   │  │  Module    │  │  Module  │  │  Module      │  │
│  └──────────┘  └────────────┘  └──────────┘  └──────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma ORM
         ┌──────────────────┼──────────────────┐
         │                  │                  │
   ┌─────▼─────┐     ┌──────▼─────┐    ┌──────▼──────┐
   │PostgreSQL │     │   Redis    │    │   Arcjet    │
   │   (DB)   │     │  (Cache)   │    │   Cloud     │
   └───────────┘     └────────────┘    └─────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Docker & Docker Compose | Latest |
| Git | Latest |

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/wallet-web-app.git
cd wallet-web-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in all required values (see [Environment Variables](#-environment-variables) below).

### 4. Start Docker Services

```bash
docker compose up -d
```

This starts **PostgreSQL** (port 5432) and **Redis** (port 6379).

### 5. Run Database Migrations

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start the Backend API

```bash
cd apps/api
npm run start:dev
```

API runs at **http://localhost:5000**

### 7. Start the Frontend

```bash
cd apps/web
npm run dev
```

Frontend runs at **http://localhost:3007**

> **Tip:** Use Turborepo to run everything from the root:
> ```bash
> npx turbo dev
> ```

---

## 🔧 Environment Variables

Create a `.env` file in the project root with the following variables:

### Database & Cache

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |

```env
DATABASE_URL="postgresql://postgres:fake_password_123@localhost:5432/payflow_db"
REDIS_URL="redis://localhost:6379"
```

### JWT Authentication

| Variable | Description | Required |
|---|---|---|
| `JWT_SECRET` | Access token signing secret (min 32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (min 32 chars) | ✅ |
| `JWT_EXPIRES_IN` | Access token TTL (e.g. `15m`) | ✅ |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) | ✅ |

```env
JWT_SECRET="fake_jwt_secret_key_at_least_32_characters_long_12345"
JWT_REFRESH_SECRET="fake_jwt_refresh_secret_key_at_least_32_chars_67890"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

### Better Auth

| Variable | Description | Required |
|---|---|---|
| `BETTER_AUTH_SECRET` | Better Auth signing secret (min 32 chars) | ✅ |
| `BETTER_AUTH_URL` | Public URL of the API (for OAuth callbacks) | ✅ |

```env
BETTER_AUTH_SECRET="fake_better_auth_secret_key_32_chars_minimum_abcde"
BETTER_AUTH_URL="http://localhost:5000"
```

### OAuth Providers

| Variable | Description | Required |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ (for Google login) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ (for Google login) |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ✅ (for GitHub login) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ✅ (for GitHub login) |

```env
GOOGLE_CLIENT_ID="fake_google_client_id_123456789.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-fake_google_client_secret_abcdef123"
GITHUB_CLIENT_ID="fake_github_client_id_0123456789abcdef"
GITHUB_CLIENT_SECRET="fake_github_client_secret_0123456789abcdef0123456789"
```

### Email (Choose One)

**Option A — Gmail (recommended for development):**

| Variable | Description |
|---|---|
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | 16-character Gmail App Password |

```env
GMAIL_USER="fake_email_account@gmail.com"
GMAIL_APP_PASSWORD="fake xxxx xxxx xxxx"
```

**Option B — Custom SMTP:**

| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (587 or 465) |
| `SMTP_SECURE` | `true` for TLS (port 465) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender name & address |

```env
SMTP_HOST="smtp.fake-mail-provider.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="fake_user@fake-domain.com"
SMTP_PASS="fake_smtp_app_password_12345"
SMTP_FROM="PayFlow <noreply@fake-domain.com>"
```

### SMS (Choose One)

**Option A — Twilio:**

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (E.164 format) |

```env
TWILIO_ACCOUNT_SID="AC00000000000000000000000000000000"
TWILIO_AUTH_TOKEN="fake_twilio_auth_token_0000000000000"
TWILIO_PHONE_NUMBER="+10000000000"
```

**Option B — Fast2SMS (India):**

| Variable | Description |
|---|---|
| `FAST2SMS_API_KEY` | Fast2SMS API key from dashboard |

```env
FAST2SMS_API_KEY="fake_fast2sms_api_key_0000000000000000"
```

### Arcjet Security

| Variable | Description | Required |
|---|---|---|
| `ARCJET_KEY` | Arcjet API key from dashboard | ✅ |
| `ARCJET_MODE` | `LIVE` or `DRY_RUN` | Optional (default: `LIVE`) |

```env
ARCJET_KEY="ajkey_fake_sample_key_0000000000000000000"
ARCJET_MODE="DRY_RUN"
```

---

## 📡 API Documentation

> **Dual Route Compatibility**: Authentication endpoints are registered under both `/api/auth/*` and `/auth/*` interchangeably. Better Auth endpoints are mounted directly under `/api/auth/*`.

### Authentication Endpoints

| Method | Path (Dual Route) | Auth | Arcjet Tier | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | `SIGNUP` | Create a new account (blocks disposable emails & bots) |
| `POST` | `/api/auth/login` | ❌ | `AUTH` | Sign in with email + password (credential-stuffing defense) |
| `POST` | `/api/auth/logout` | ✅ JWT | `STANDARD` | Invalidate session (shield & bot protected) |
| `POST` | `/api/auth/refresh` | ❌ | `STANDARD` | Refresh access token (token bucket rate limited) |
| `GET` | `/api/auth/me` | ✅ JWT | `STANDARD` | Get current user profile |
| `POST` | `/api/auth/forgot-password` | ❌ | `AUTH` | Send OTP to email + phone (prevents OTP flooding) |
| `POST` | `/api/auth/reset-password` | ❌ | `AUTH` | Reset password with OTP (prevents brute-force) |
| `POST` | `/api/auth/set-pin` | ✅ JWT | `PIN` | Create / change payment PIN (strict 5-attempt window) |
| `DELETE` | `/api/auth/account` | ✅ JWT | `STANDARD` | Soft-delete account |

### Better Auth Routes (Mounted at `/api/auth/*`)

| Method | Path | Arcjet Tier | Description |
|---|---|---|---|
| `POST` | `/api/auth/sign-up/email` | `SIGNUP` | Email signup (disposable email deny + bot block) |
| `POST` | `/api/auth/sign-in/email` | `AUTH` | Email signin (credential stuffing defense + bot block) |
| `GET` | `/api/auth/sign-in/google` | `AUTH` | Redirect to Google OAuth |
| `GET` | `/api/auth/sign-in/github` | `AUTH` | Redirect to GitHub OAuth |
| `GET` | `/api/auth/callback/google` | `AUTH` | Google OAuth callback |
| `GET` | `/api/auth/callback/github` | `AUTH` | GitHub OAuth callback |
| `GET` | `/api/auth/session` | `AUTH` | Get current Better Auth session |
| `POST` | `/api/auth/sign-out` | `AUTH` | Invalidate Better Auth session |

### Wallet Endpoints

| Method | Path | Auth | Arcjet Tier | Description |
|---|---|---|---|---|
| `GET` | `/api/wallet` | ✅ JWT | — | Get wallet balance & info |
| `POST` | `/api/wallet/add-money` | ✅ JWT | `FINANCIAL` | Add funds to wallet |
| `POST` | `/api/wallet/withdraw` | ✅ JWT | `FINANCIAL` | Withdraw to bank |
| `POST` | `/api/wallet/set-pin` | ✅ JWT | `PIN` | Set wallet payment PIN |
| `POST` | `/api/wallet/verify-pin` | ✅ JWT | `PIN` | Verify payment PIN |

### Payments Endpoints

| Method | Path | Auth | Arcjet Tier | Description |
|---|---|---|---|---|
| `POST` | `/api/payments/send` | ✅ JWT | `FINANCIAL` | Send money to another user |
| `GET` | `/api/payments/history` | ✅ JWT | — | Get paginated transaction history |
| `GET` | `/api/payments/history/:id` | ✅ JWT | — | Get single transaction detail |

### Analytics Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/stats` | ✅ JWT | Dashboard stats (totals, % change, settlement rate) |
| `GET` | `/api/analytics/spending-trends` | ✅ JWT | Weekly/monthly spending trend data |
| `GET` | `/api/analytics/categories` | ✅ JWT | Spending breakdown by category |

### Bank Accounts Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/bank-accounts` | ✅ JWT | List linked bank accounts |
| `POST` | `/api/bank-accounts` | ✅ JWT | Link a new bank account |
| `DELETE` | `/api/bank-accounts/:id` | ✅ JWT | Unlink a bank account |

### Notifications Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✅ JWT | Get all notifications |
| `PATCH` | `/api/notifications/:id/read` | ✅ JWT | Mark notification as read |

---

## 🔐 Security Overview

### Arcjet Multi-Tier Protection

PayFlow uses [Arcjet](https://arcjet.com/) as a first-class, multi-layered security system protecting the application across three defensive rings:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Ring 1: Next.js Edge Middleware (@arcjet/next)                       │
│  Intercepts all browser traffic before reaching SSR/pages (120 req/m)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Ring 2: Better Auth Express Middleware (apps/api/src/main.ts)         │
│  Arcjet intercepts /api/auth/* (sign-up, sign-in, OAuth callbacks)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Ring 3: Global NestJS Guard (APP_GUARD: ArcjetSecurityGuard)         │
│  Enforces route-level decorators across all NestJS Controllers:       │
│  • @ArcjetSignup()    • @ArcjetAuth()       • @ArcjetPin()             │
│  • @ArcjetFinancial() • STANDARD (default fallback for all routes)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
429 Too Many Requests         403 Forbidden            400 Bad Request
(Rate Limit + Retry-After)   (Bot / Shield Threat)    (Disposable Email)
```

**Security Tiers & Policies:**

| Tier | Enforced On | Rules & Limits |
|---|---|---|
| `SIGNUP` | `/register`, `/api/auth/sign-up/*` | • **Email Validation**: Denies disposable, invalid, or MX-less burner domains<br>• **Bot Blocking**: Zero-bot allowance<br>• **Rate Limiting**: Sliding window (5 signups / 10 min) |
| `AUTH` | `/login`, `/forgot-password`, `/reset-password`, `/api/auth/sign-in/*`, OAuth callbacks | • **Credential Stuffing Defense**: Sliding window (10 attempts / 1 min)<br>• **Bot Detection**: Prohibits automated scrapers<br>• **Shield**: Blocks injection & XSS attacks |
| `FINANCIAL` | `/wallet/add-money`, `/wallet/withdraw`, `/payments/send` | • **Financial Sliding Window**: Max 15 transactions / 1 min<br>• **Zero-Bot Tolerance**: Automated scripts completely blocked<br>• **Shield**: Active payload analysis |
| `PIN` | `/auth/set-pin`, `/wallet/set-pin`, `/wallet/verify-pin` | • **High-Sensitivity PIN Protection**: Max 5 attempts / 5 min to prevent PIN brute-forcing<br>• **Bot Blocking** |
| `STANDARD` | All other API routes (`/me`, `/logout`, `/refresh`, `/history`, `/analytics`, etc.) | • **Token Bucket Rate Limiting**: Capacity 200, refill 100/min<br>• **Arcjet Shield** + **Bot Detection** enabled by default |
| `EDGE` | Frontend Next.js routes (`middleware.ts`) | • **Shield** + **Bot Detection** + **Sliding Window** (120 req/min) |

### Better Auth Sessions

Better Auth issues server-side sessions stored in the database alongside JWT tokens. The dual-mode guard:
1. Checks for a valid Better Auth session cookie first
2. Falls back to Bearer JWT token validation

This ensures both social-login users (session-based) and API consumers (JWT-based) are authenticated uniformly.

### Payment PIN

All fund-movement operations require a **4–6 digit payment PIN** in addition to the user's authentication token. The PIN is bcrypt-hashed and stored separately from the account password.

---

## 🔑 OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add Authorised redirect URI:
   ```
   http://localhost:5000/api/auth/callback/google
   ```
5. Copy **Client ID** and **Client Secret** → `.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. **OAuth Apps** → **New OAuth App**
3. Set **Authorization callback URL**:
   ```
   http://localhost:5000/api/auth/callback/github
   ```
4. Copy **Client ID** and generate **Client Secret** → `.env`

---

## 📧 Email & SMS Setup

### Gmail App Password (for OTP emails)

1. Enable **2-Step Verification** on your Google account
2. Go to **Google Account** → **Security** → **App Passwords**
3. Generate a password for "Mail" → "Other device" → name it `PayFlow`
4. Use the 16-character password as `GMAIL_APP_PASSWORD`

### Twilio (for SMS OTP)

1. Create a [Twilio account](https://www.twilio.com/)
2. Get a phone number from the console
3. Copy **Account SID**, **Auth Token**, **Phone Number** → `.env`

### Fast2SMS (India — alternative SMS)

1. Create a [Fast2SMS account](https://www.fast2sms.com/)
2. Go to **Dev API** → copy the API key → `.env`

---

## 🗄 Database Migrations

The project uses Prisma migrations. After cloning, run:

```bash
cd packages/database

# Apply all pending migrations
npx prisma migrate dev

# (Alternative) Push schema without migration history
npx prisma db push

# Regenerate Prisma Client after schema changes
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio
```

### Migration History

| Migration | Description |
|---|---|
| `20261123110356_add_password_reset_token` | Adds `PasswordResetToken` model for OTP-based password reset |
| `20261124100000_add_better_auth` | Adds `Account` and `Verification` models for Better Auth; extends `User` for OAuth; extends `Session` |

---

## 📜 Scripts

Run from the **project root** using Turborepo:

| Command | Description |
|---|---|
| `npx turbo dev` | Start all apps in development mode |
| `npx turbo build` | Build all apps for production |
| `npx turbo lint` | Lint all packages |

Run from individual app directories:

| Directory | Command | Description |
|---|---|---|
| `apps/api` | `npm run start:dev` | Start NestJS in watch mode |
| `apps/api` | `npm run build` | Compile NestJS to dist/ |
| `apps/web` | `npm run dev` | Start Next.js dev server |
| `apps/web` | `npm run build` | Build Next.js for production |
| `packages/database` | `npx prisma studio` | Launch Prisma GUI |
| `packages/database` | `npx prisma migrate dev` | Run pending migrations |

---

## 📐 Database Schema (Prisma Models)

```
User ──────────── Wallet (1:1)
  │                 │
  │                 ├── Transaction (many, as sender)
  │                 └── Transaction (many, as receiver)
  │
  ├── Session (many — JWT + Better Auth)
  ├── Account (many — OAuth provider tokens)
  ├── Verification (many — Better Auth tokens)
  ├── BankAccount (many)
  ├── Notification (many)
  ├── FraudAlert (many)
  └── PasswordResetToken (many — OTP tokens)
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/amazing-feature`
3. **Verify TypeScript** compiles cleanly before committing:
   ```bash
   cd apps/api  ; npx tsc --noEmit
   cd apps/web  ; npx tsc --noEmit
   ```
4. **Commit** with a conventional commit message: `git commit -m "feat: add amazing feature"`
5. **Push** to your branch: `git push origin feat/amazing-feature`
6. Open a **Pull Request**

### Code Standards

- All code must be in **TypeScript** — no `any` types
- Follow the existing **NestJS module pattern** for new backend features
- Use **Zod** for all input validation on the frontend
- Apply the appropriate **Arcjet decorator** to any new controller endpoint that accepts user input
- Run `npx tsc --noEmit` in both apps before every PR — CI enforces this
- Keep the **README updated** when adding a new feature or endpoint

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built the Dream to Ease People's Life ❤️ as a Full-tack Ai Engineer ~ **Md MERAJ ALAM**

*"An investment in knowledge pays the best interest."* — Benjamin Franklin

</div>
