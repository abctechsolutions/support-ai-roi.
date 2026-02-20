# PHONE-ONLY DEPLOY (No PC, No Replit)

You can run this whole app from your phone by using:
- **GitHub** (stores the code)
- **Vercel** (hosts the web app)
- **Neon** (free PostgreSQL database)

This setup avoids Replit and avoids needing a computer.

---

## What is Vercel?
Vercel is a hosting platform for modern web apps (especially **Next.js**).
You connect a GitHub repo, and Vercel automatically:
- builds the app,
- hosts it on a URL,
- redeploys when you update the repo.

---

## Step 0 — Create a free Postgres DB (Neon)
1. Go to **Neon** and create a new project + database.
2. Copy the **connection string** (it starts with `postgresql://...`).

Keep it ready — you’ll paste it into Vercel as `DATABASE_URL`.

---

## Step 1 — Create a GitHub repo from your phone
Option A (easiest): upload the ZIP contents
1. On GitHub (mobile web/app), create a new repository (public or private).
2. Open the repo → **Add file** → **Upload files**.
3. Upload **everything inside** the `support-ai-roi-dashboard/` folder (not the parent folder).
4. Commit.

Tip: GitHub’s mobile upload works best if you upload in 2–3 batches.

---

## Step 2 — Deploy on Vercel (phone-friendly)
1. Go to Vercel and sign in with GitHub.
2. Tap **New Project** → select your repo → **Import**.
3. In Environment Variables, add:

- `DATABASE_URL` = (your Neon connection string)
- `ADMIN_EMAIL` = your admin email
- `ADMIN_PASSWORD` = a strong password
- `BLENDED_HOURLY_RATE_GBP` = e.g. `20`
- `SESSION_DAYS` = e.g. `14`

4. Tap **Deploy**.

During the build, Vercel will:
- run Prisma migrations,
- seed default categories/tools,
- create your admin user if it doesn’t exist.

---

## Step 3 — Log in
After deploy finishes, open:

- `/login` → sign in using `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- `/admin` → create teams/users, edit categories, set approved tools
- `/log` → start logging AI sessions
- `/dashboard` → see ROI metrics

---

## Quick check if something breaks
Most common issue: `DATABASE_URL` formatting.
Neon usually gives a correct URL. If Prisma errors, double-check the env var is set **in Vercel**.

---

## Optional: Custom domain
Vercel can add a domain later. Not needed for pilots.
