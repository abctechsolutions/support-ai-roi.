## If you have no PC
If you only have a phone, follow **PHONE_ONLY.md** (GitHub + Vercel + Neon).

# RUN ME FIRST ✅ (Support AI ROI Dashboard)

This project is built for **zero-cost deployment** without Replit.

## Option A (recommended): Run locally on your PC

### 1) Install prerequisites
- **Node.js 18+**
- (No database install needed if you use a free hosted Postgres provider below.)

### 2) Create a free Postgres database
Pick one:
- **Neon** (fastest) — create a project and copy the connection string
- **Supabase** — create a project and copy the connection string

### 3) Configure env
1. Copy `.env.example` → `.env`
2. Paste your Postgres connection string into `DATABASE_URL`
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`

### 4) Install & initialize
```bash
npm install
npx prisma migrate dev --name init
npm run seed
```

### 5) Start the app
```bash
npm run dev
```
Open:
- `http://localhost:3000/login`

### 6) Where things are
- Log AI use: `/log`
- Dashboard: `/dashboard`
- Admin: `/admin`
- CSV export: `/api/report?days=7` (or `days=30`)

---

## Option B: Deploy free-ish (Vercel + Neon)

This is the simplest “live link” route.

### 1) Create the DB
Create a free **Neon** database and copy the **DATABASE_URL**.

### 2) Push the code to GitHub
- Create a GitHub repo
- Upload the project

### 3) Deploy on Vercel
- Import the repo into **Vercel**
- Add environment variables (Project Settings → Environment Variables):
  - `DATABASE_URL`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - optional: `BLENDED_HOURLY_RATE_GBP`

### 4) Run migrations
Vercel doesn’t automatically run migrations.
Do this from your local machine once (with the same `DATABASE_URL`):
```bash
npx prisma migrate deploy
npm run seed
```

Then your Vercel app will work.

---

## Common issues (quick fixes)

### Prisma can’t connect
- Your `DATABASE_URL` is wrong or missing
- Your DB is paused/sleeping (free tiers sometimes sleep)

### Seed fails because tables don’t exist
Run migrations first:
```bash
npx prisma migrate dev --name init
```

### “Invalid admin login”
Check `.env` values for `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then restart the server.

