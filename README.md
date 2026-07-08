# AI Cyber Threat & Scam Detector (AI Shield)

An advanced, full-stack cybersecurity threat intelligence application designed to scan, analyze, and detect digital scams, phishing messages, malicious URLs, SMS/WhatsApp frauds, QR codes, and fraudulent screenshots in real-time. Leveraging the high-speed and context-aware **Google Gemini 3.5 Flash** model, AI Shield translates suspicious raw materials into mathematically rigorous threat evaluations, risk indexing, and highly-actionable mitigation steps.

This project is structured as a full-stack Node.js (TypeScript) application with an elegant React SPA frontend powered by Vite and Tailwind CSS, backed by a robust SQLite MVC backend database and Express API.

---

## 🚀 Key Features

* **Multi-Channel Input Scanning**:
  * **Direct Text**: Copy-paste suspicious SMS messages, email bodies, WhatsApp threads, or high-pressure prompts.
  * **Screenshots & Images**: Upload screenshots of alerts, suspicious conversations, or fake invoices. Includes client-side compression for high performance.
  * **URLs & Links**: Submit doubtful links to verify domain threat status and credential harvesting risk.
* **Deep Threat Intelligence Output**:
  * **Risk Indexing**: Generates a dynamic, color-coded score from `0` (Safe) to `100` (Dangerous).
  * **Entity & Impersonation Tracking**: Automatically identifies the brand or institution being targeted/spoofed (e.g., Netflix, DHL, Chase).
  * **Concrete Threat Markers**: Lists precise indicators (e.g., sense of urgency, malicious links, private contact numbers).
  * **Clear Actionable Recommendations**: Concise instructions (e.g., `BLOCK IMMEDIATELY`, `PROCEED WITH CAUTION`, `SAFE`).
* **Interactive Client Dashboard**:
  * **Dynamic Analysis**: Progress bars, clean transitions, and step-by-step telemetry logs.
  * **Personal Scan Vault**: Authenticated users can store, search, and filter historical scan records.
  * **Export PDF Report**: Single-click PDF generation of professional security certificates containing detailed threat vectors.
* **Secure Architecture**:
  * **Lazy SDK Initialization**: The Gemini API client initializes strictly inside request handlers to prevent boot-up failure if environment variables are unconfigured.
  * **JWT Authentication**: High-security session keys generated dynamically per-instance, preventing static key reuse.
  * **Database Persistence**: Parametrized SQLite queries ensuring full immunity against SQL Injection vectors.

---

## 🛠️ Technology Stack

### Frontend (Client SPA)
* **Framework**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS
* **Animations**: Motion (Framer Motion)
* **Icons**: Lucide React
* **Data Flow**: Axios + State Sync + Debounced Search Listeners
* **Document Engine**: jsPDF (for high-fidelity vector PDF generation)

### Backend (Server)
* **Runtime**: Node.js + tsx (TypeScript native execution)
* **Framework**: Express.js
* **AI Engine**: Google Gen AI SDK (`@google/genai`) with Gemini 3.5 Flash
* **Database**: SQLite3 (Promisified MVC helpers)
* **Security**: Helmet, CORS, Bcryptjs, JSONWebToken (JWT)
* **Bundling (Build Phase)**: Esbuild for self-contained server bundles

---

## 📁 Project Directory Structure

```text
├── assets/                  # Public asset vectors and icons
├── server/                  # MVC Backend Sub-application
│   ├── src/
│   │   ├── config/          # Environment configuration & validation
│   │   ├── controllers/     # Scan handlers & intelligence managers
│   │   ├── middleware/      # JWT validation & centralized error middleware
│   │   ├── routes/          # Express route declarations (Auth, Scan, User)
│   │   ├── services/        # SQLite DB and Gemini AI client services
│   │   └── utils/           # Centralized API response formatters
│   └── package.json         # Sub-app metadata
├── src/                     # Client Frontend SPA (Vite + React)
│   ├── components/          # UI Components (Dashboard, ScanPage, AuthPage, FAQs, etc.)
│   ├── services/            # Client api endpoints (scan service proxies)
│   ├── utils/               # PDF Export logic (pdfGenerator)
│   ├── App.tsx              # Application Root view & state router
│   ├── index.css            # Tailwind theme declarations & typography
│   ├── main.tsx             # DOM mounting entry-point
│   └── types.ts             # Shared global TypeScript definitions
├── .env.example             # Configuration templates for deployment
├── .gitignore               # Build, dependency, and temporary file exclusions
├── index.html               # Main SPA index template
├── metadata.json            # AI Studio applet manifest
├── package.json             # Combined Workspace Node.json (Scripts & Root Deps)
├── server.ts                # Integrated Production Entry Point & static asset distributor
├── tsconfig.json            # Strict TypeScript compiler options
└── vite.config.ts           # Vite build pipeline and plugin configs
```

---

## ⚙️ Environment Variables

Copy the environment template before running or deploying:

```bash
cp .env.example .env
```

Define the following keys in your `.env` file:

```env
# Google Gemini API Key - Required for AI Scans
GEMINI_API_KEY="your_gemini_api_key_here"

# Deployment URL - Automatically injected by AI Studio
APP_URL="http://localhost:3000"

# Optional JWT Secret override (highly recommended in production)
JWT_SECRET="a_very_secure_long_random_string_here"
```

---

## 🚀 Quick Start (Local Run)

Follow these simple steps to run AI Shield locally:

### 1. Install Dependencies
Run the installation script at the project root to install both development and production dependencies:
```bash
npm install
```

### 2. Run in Development Mode
Start the live development environment (hot-reload for client-side and server-side):
```bash
npm run dev
```
The application will launch on **[http://localhost:3000](http://localhost:3000)**.

### 3. Build for Production
To bundle and compile the application for deployment or distribution:
```bash
npm run build
```
This performs a two-stage compilation:
1. Builds the static client React assets into the `dist/` directory.
2. Compiles the TypeScript backend into a CJS format bundle inside `dist/server.cjs` via **esbuild**.

### 4. Start in Production Mode
Start the compiled production bundle directly using Node:
```bash
npm start
```

---

## 🔒 Security Practices & Implementation

* **Cryptographic Fallback**: When `JWT_SECRET` is not set in production environments, the system generates a cryptographically secure random 32-byte hash at startup to prevent static default credential attacks.
* **Database Isolation**: Standard SQL queries are handled through safe, parameterized drivers, ensuring that user and scanning tables are isolated from injection risks.
* **Payload Size Constraints**: Incoming JSON payloads are capped at `1MB` inside Express middleware to prevent buffer overflow attacks or high-volume DDoS scanners.
* **Safe Client Architecture**: All API keys, including Gemini tokens, remain strictly server-side. The client routes requests through internal `/api/` proxies to guarantee no credentials leak to the browser dev tools.

---

## 📋 API Route Registry

### Authentication Services
* `POST /auth/register` — Create a secure account with automatic password hashing.
* `POST /auth/login` — Sign in and receive a secure 7-day session JWT token.

### Threat Intelligence & Scan Logs
* `POST /api/scan` — Perform a Gemini-driven threat scan on URLs, texts, or emails (Requires Bearer Token).
* `GET /user/scans` — List user history with support for debounced search queries and risk level filtering (Requires Bearer Token).
* `GET /user/scans/:id` — Fetch a complete granular threat report by its record ID (Requires Bearer Token).
* `DELETE /user/scans/:id` — Permenantly remove a scan log from the personal archive (Requires Bearer Token).

---

## 🚀 Deployment (GitHub + Vercel + Render)

This app is **frontend/backend split**: React frontend on **Vercel**, Express + SQLite backend on **Render** (or any Node host with a persistent process — Vercel serverless functions won't work for the backend because it uses a long-running Express server and a local SQLite file).

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
`.gitignore` already excludes `node_modules`, `dist`, `.env*`, and the local `*.sqlite` file, so nothing sensitive or generated gets committed.

### 2. Deploy the backend (Render)
1. New **Web Service** → connect your GitHub repo.
2. **Root Directory**: repo root (not `server/` — the API entry point that also serves `/api/analyze` is `server.ts` at the root).
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `GEMINI_API_KEY` — your Gemini API key
   - `JWT_SECRET` — any long random string (optional; a secure one is auto-generated if omitted)
   - `NODE_ENV` = `production`
6. Deploy, then copy the live URL (e.g. `https://your-app.onrender.com`).

> ⚠️ Render's free web services use an **ephemeral filesystem** — the SQLite file (and with it, user accounts/scan history) resets on every redeploy or restart. Fine for demos; for anything persistent, add a Render Disk or move to a hosted DB (e.g. Turso, Postgres) later.

### 3. Deploy the frontend (Vercel)
1. New Project → import the same GitHub repo (a `vercel.json` at the root already tells Vercel to run `npm run build:client` and serve `dist/`).
2. **Environment Variable**: `VITE_API_URL` = your Render backend URL from step 2 (no trailing slash).
3. Deploy.

That's it — the frontend calls the backend via `VITE_API_URL` everywhere (landing page live scan, auth, dashboard, scan history), so the two can live on completely different domains.

---



This software was built to high production-grade compliance frameworks. Suitable for standard deployments, student submissions, and hackathons (e.g., **Smart India Hackathon**). All components and sub-modules compile cleanly out of the box.

*Engineered with precision and security.*
