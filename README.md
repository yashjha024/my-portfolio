# Product Management Portfolio Platform — Production MERN Codebase

A production-grade, interview-ready **Product Management Portfolio Platform** built strictly to the specifications of the Product Requirements Document (`product-management-portfolio-prd.md`) using a modern **MERN Stack** (MongoDB Atlas, Express.js, React 19 + Vite, Node.js) written in pure **JavaScript (`.js` / `.jsx`)**.

---

## 🏗️ Architecture Overview

The platform uses a monorepo structure with distinct `client/` and `server/` packages:

```text
portfolio/
├── client/                 # React 19 + Vite + Tailwind CSS + shadcn/ui + Framer Motion (SPA)
│   ├── src/
│   │   ├── components/     # UI primitives & shared navigation guards (`ProtectedAdminRoute`)
│   │   ├── context/        # `AuthContext` (Google OAuth login, profile verification, logout)
│   │   ├── pages/
│   │   │   ├── public/     # Public portfolio pages (`/`, `/work`, `/thinking`, `/prds`, etc.)
│   │   │   └── admin/      # Private owner console (`/admin`, `/admin/work`, `/admin/media`, etc.)
│   │   ├── services/       # Axios client with automatic HTTP-Only token refresh interceptor
│   │   └── utils/          # shadcn `cn()` helper & utilities
│   ├── index.html
│   └── vite.config.js      # Proxy setup (`/api` -> `http://localhost:5000`)
├── server/                 # Express.js API + MongoDB Atlas + Cloudinary + Google OAuth
│   ├── src/
│   │   ├── config/         # MongoDB Atlas (`db.js`), Cloudinary (`cloudinary.js`), Passport OAuth (`passport.js`)
│   │   ├── controllers/    # API logic (`auth`, `work`, `thinking`, `prd`, `media`, `contact`)
│   │   ├── middleware/     # Secure cookie auth verification (`auth.middleware.js`), admin access guard (`admin.middleware.js`)
│   │   ├── models/         # Mongoose schemas (`User`, `CaseStudy`, `Article`, `Prd`)
│   │   ├── routes/         # Express REST routers
│   │   └── utils/          # JWT generation and HTTP-Only SameSite cookie handling (`token.utils.js`)
│   ├── server.js           # Server startup script
│   └── package.json
└── package.json            # Workspace orchestration runner (`dev`, `lint`, `format`)
```

---

## 🔐 Security & Authentication Architecture

1. **Google OAuth 2.0 (`passport-google-oauth20`)**:
   - Passwordless, secure sign-in via Google.
   - Automatically assigns `admin` role if the Google email matches `OWNER_EMAIL` in server environment variables.
2. **Dual JWT Tokens via Secure HTTP-Only Cookies**:
   - **Access Token (15m expiration)**: Stored in an `httpOnly`, `secure`, `sameSite: 'strict'` cookie. Prevents XSS token theft.
   - **Refresh Token (7d expiration)**: Verified against the database; automatically rotates access tokens without prompting the user to log in again.
3. **Admin Middleware Guard (`verifyAdmin`)**:
   - Strictly enforces server-side authorization on every content mutation (`POST`, `PUT`, `DELETE`) and media upload (`/api/media/upload`).
4. **Cloudinary Secure Uploads (`multer-storage-cloudinary`)**:
   - Direct server-side validated uploads strictly limiting file size and allowed formats (`jpg`, `png`, `webp`, `pdf`).

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** (v20+ recommended)
- **MongoDB Atlas** database cluster
- **Google Cloud Console** OAuth 2.0 Client ID & Secret
- **Cloudinary** Account for media/file storage

### 2. Environment Variables Configuration

Copy `server/.env.example` to `server/.env` and fill in your credentials:

```bash
cp server/.env.example server/.env
```

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio?retryWrites=true&w=majority

# JWT Secrets
JWT_ACCESS_SECRET=your_secret_access_key
JWT_REFRESH_SECRET=your_secret_refresh_key

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin Owner Email
OWNER_EMAIL=you@yourdomain.com
```

### 3. Install Dependencies

From the project root:

```bash
npm install
```

---

## 🛠️ Development & Build Commands

- **Run both Client and Server concurrently:**

  ```bash
  npm run dev
  ```
  - Frontend: `http://localhost:5173`
  - Backend API: `http://localhost:5000`

- **Run Server Only:**

  ```bash
  npm run dev:server
  ```

- **Run Client Only:**

  ```bash
  npm run dev:client
  ```

- **Verify Frontend Build:**

  ```bash
  npm run build
  ```

- **Lint & Format Codebase:**
  ```bash
  npm run lint
  npm run format
  ```

---

## 📜 Alignment with PRD Scope

- **Public Experience**: Strict separation between public published items (`status: 'published'`) and unlisted/private PRD artifacts (`visibility: ['public', 'unlisted', 'private']`).
- **Private Admin Console**: Complete CRUD support for Case Studies, Product Thinking articles, PRD libraries, and Cloudinary media assets accessible exclusively by the authenticated `admin` profile.
- **Spam Protection**: Contact form controller includes server-side Zod validation and a honeypot field per PRD Section 9.
