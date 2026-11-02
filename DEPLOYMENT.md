# NEXA MealPass - Production Hosting & Deployment Guide

This app consists of a clean separation between the **Frontend (React 19 + Tailwind CSS + Vite)** and the **Backend (Node.js + Express + TypeScript + Neon PostgreSQL)**.

---

## 1. Environment Variables

Create a `.env` file or configure your cloud host environment variables with:

```env
# Neon Serverless PostgreSQL Connection String
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-ENDPOINT.neon.tech/neondb?sslmode=require"

# Server Port (Defaults to 5000 in dev, auto-assigned in Cloud Run / Render / Railway / Heroku)
PORT=5000

# Node Environment
NODE_ENV=production
```

---

## 2. Option A: Monolithic Full-Stack Hosting (Single Host like Render, Railway, Fly.io, Cloud Run)

Both client and server run together. Express serves the REST API on `/api/*` and the compiled React assets on `/`.

### Build & Run
```bash
# 1. Install dependencies
bun install   # or npm install

# 2. Build both frontend and backend
npm run build

# 3. Start the production server
npm start
```

### Docker Deployment
A ready-to-deploy `Dockerfile` is included in the project:
```bash
docker build -t nexa-mealpass .
docker run -p 5000:5000 -e DATABASE_URL="your_neon_url" nexa-mealpass
```

---

## 3. Option B: Separated Hosting (e.g. Vercel for Frontend + Render / Railway for Backend)

### Backend Only (Render / Railway / Fly.io / Heroku):
1. **Root Directory**: `.`
2. **Build Command**: `npm run build:server`
3. **Start Command**: `node dist/server.js`
4. Set environment variable: `DATABASE_URL`

### Frontend Only (Vercel / Netlify / Cloudflare Pages):
1. **Build Command**: `npm run build:client`
2. **Output Directory**: `dist`
3. Configure `VITE_API_URL` or a proxy rewrites to your backend URL.

---

## 4. Connecting Neon Database In-App

You can also connect and verify your Neon PostgreSQL database directly in the running app:
1. Open the app as **Restaurant POS** / Owner.
2. Go to the **Settings** tab.
3. Tap **"Configure Neon DB"**.
4. Paste your Neon PostgreSQL connection string and click **"Connect & Sync"**.
5. All tables (`restaurant_settings`, `customers`, `qr_passes`, `meal_records`, `payment_records`, `shift_close_records`) will be automatically migrated and synced.
