# Product Management Portfolio Platform — Production Codebase

A production-grade, interview-ready **Product Management Portfolio Platform** built strictly for product leaders, hiring managers, and recruiters using a modern **Full-Stack JavaScript Architecture** (Supabase PostgreSQL, Supabase Auth, Express.js API, React 19 + Vite, Tailwind CSS, Framer Motion).

---

## ✨ Key Features & Capabilities

### 📄 PRD Spec Management & Markdown Importer

- **Live Markdown Editor**: Split-screen live preview with syntax highlighting, mermaid diagrams, custom callouts, and drag-and-drop media uploads.
- **Import Markdown (`.md`) Files**: One-click import tool to upload pre-existing `.md`, `.markdown`, or `.txt` spec files directly into the PRD editor with auto-extracted title headers.
- **Granular Spec Access & Visibility**: Toggle development stage (_In Development_, _In Review_, _Approved_, _Shipped_) and access level (_Public_, _Unlisted direct-link_, _Private_).
- **Downloadable PDF Specs**: Attach and download full PDF specification artifacts.

### 📬 Resend Email Delivery & Contact Inbox

- **Direct Inbox Delivery**: Contact form inquiries are automatically forwarded to `yashjha024@gmail.com` via **Resend API**.
- **One-Click Reply**: Native `reply_to` configuration allowing one-click responses directly from your Gmail inbox.
- **Spam & Deduplication Guard**: Honeypot bot protection and 5-minute submission deduplication.
- **Admin Inquiries Management**: All inquiries are saved to Supabase database and readable in **Admin → Inquiries & Inbox** (`/admin/messages`).

### 🎨 Editorial Public Portfolio & Redesigned Footer

- **Warm Editorial Visual System**: Restrained typography, subtle off-white background palette, thin borders, and responsive grid layouts.
- **Product-Focused Footer**: Identity block (_Product • AI • Technology_), positioning statement, quick explore navigation (`/work`, `/thinking`, `/prds`, `/about`), and smooth _Back to Top_ scrolling.
- **Discreet Public Interface**: Exposes product work and case studies while keeping admin access secured via protected `/admin` and `/login` routes.

### 🔐 Supabase Auth Architecture

- **Google OAuth 2.0 + Passwordless Magic Link OTP**: Reactivated Supabase Auth for single-click Google sign-in and passwordless email links.
- **Strict Server Owner Authorization**: Middleware verifies authenticated session tokens against `OWNER_EMAIL` (`yashjha024@gmail.com`) and automatically revokes unauthorized access attempts.

---

## 🏗️ Architecture Overview

The platform uses a clean monorepo structure with distinct `client/` and `server/` packages:

```text
portfolio/
├── client/                 # React 19 + Vite + Tailwind CSS + Framer Motion (SPA)
│   ├── src/
│   │   ├── components/     # UI primitives, MarkdownEditor, AdminLayout, shared Footer
│   │   ├── context/        # `AuthContext` (Supabase Auth session sync & owner checks)
│   │   ├── pages/
│   │   │   ├── public/     # Public portfolio pages (`/`, `/work`, `/thinking`, `/prds`, `/about`, `/contact`)
│   │   │   ├── admin/      # Private owner console (`/admin`, `/admin/work`, `/admin/prds`, `/admin/messages`)
│   │   │   └── auth/       # Auth callback & login screens (`/login`, `/auth/callback`)
│   │   ├── services/       # Axios client with automatic Bearer token interceptor
│   │   └── utils/          # Formatting & helper utilities
│   ├── index.html
│   └── vite.config.js
├── server/                 # Express.js API + Supabase PostgreSQL + Resend Email API
│   ├── src/
│   │   ├── config/         # Supabase client (`supabase.js`)
│   │   ├── controllers/    # Controllers (`auth`, `work`, `thinking`, `prd`, `media`, `messages`, `contact`)
│   │   ├── middleware/     # Auth verification (`auth.middleware.js`), owner access guard (`admin.middleware.js`)
│   │   ├── routes/         # Express REST API routes
│   │   └── utils/          # Token cookie handling & utilities
│   └── server.js           # Server entry point
└── vercel.json             # Vercel SPA rewrite configuration
```

---

## 🌐 Production Deployment Architecture

- **Frontend SPA**: Deployed on **Vercel** (`https://yashjha.vercel.app`)
- **Backend API**: Deployed on **Railway** (`https://portfolio-server-production-4788.up.railway.app`)
- **Database & Authentication**: **Supabase** (PostgreSQL & Supabase Auth)
- **Transactional Email**: **Resend** (`https://api.resend.com`)

---

## 🚀 Getting Started Locally

### 1. Environment Variables Configuration

Configure `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Supabase PostgreSQL & Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Owner Email
OWNER_EMAIL=yashjha024@gmail.com

# Resend Transactional Email Delivery
RESEND_API_KEY=re_your_api_key
CONTACT_EMAIL=yashjha024@gmail.com
```

### 2. Install Dependencies & Run

From project root:

```bash
# Install dependencies
npm install

# Run Frontend and Backend concurrently
npm run dev
```

- Frontend SPA: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 🛠️ Verification & Build Commands

```bash
# Verify Frontend Production Build
npm run build --prefix client

# Lint and Format Codebase
npm run lint
npm run format
```
