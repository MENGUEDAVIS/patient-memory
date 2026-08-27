# BilAn

Hospital EHR & Clinical Intelligence MVP.

> Your medical history should follow you — not your file.

The product gives hospitals a complete digital memory of every patient and a transparent record of every clinical interaction.

This environment uses **DEMO DATA only**. Do not load real patient information.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- Session cookies (JWT + server-side session table)
- Deterministic clinical decision support (not an “AI doctor”)

## Setup

1. Copy `.env.example` to `.env`.
2. Set `AUTH_SECRET` (32+ characters) and a PostgreSQL `DATABASE_URL` + `DIRECT_URL`.
3. Apply the schema and seed demo data:

```powershell
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

4. Run the app:

```powershell
npm run dev
```

Open http://localhost:3000

## Vercel + PostgreSQL

SQLite cannot run on Vercel. Create a free [Neon](https://neon.tech) project (or Vercel Postgres) then set these **Project → Settings → Environment Variables** for Production:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** URI, add `?sslmode=require&pgbouncer=true` if the host contains `-pooler` |
| `DIRECT_URL` | Neon **direct** (non-pooled) URI, `?sslmode=require` |
| `AUTH_SECRET` | random string, at least 32 characters |
| `APP_ORIGIN` | `https://<your-app>.vercel.app` |
| `NEXT_PUBLIC_DEMO_MODE` | `true` |

Redeploy. Then from this machine, point at production and load demo data once:

```powershell
$env:DATABASE_URL="postgresql://...direct-host.../neondb?sslmode=require"
$env:DIRECT_URL=$env:DATABASE_URL
npx prisma db push
npx tsx prisma/seed.ts
```

Use the **direct** (non-pooler) host for `db push` and `seed`.

## Demo accounts

All are marked as demo accounts.

| Role | Email | Password |
| --- | --- | --- |
| Hospital administrator | admin@demo-hospital.com | DemoAdmin123! |
| Medical director | director@demo-hospital.com | DemoDirector123! |
| Doctor | doctor@demo-hospital.com | DemoDoctor123! |
| Laboratory | lab@demo-hospital.com | DemoLab123! |
| Pharmacist | pharmacy@demo-hospital.com | DemoPharmacy123! |
| Patient (John Doe) | patient@demo-hospital.com | DemoPatient123! |

Investor walkthrough patient: **John Doe / PAT-00018492**.

## Tests

```powershell
npm test
```

Critical rules covered: consultation completion, allergy conflicts, forecasts, insurance verification, RBAC.

## Known limitations

- OTP, payments, insurance and SMS are simulated for the MVP.
- No real mobile-money provider is required.
- Insights are computed from hospital data with transparent methods; an LLM is not used for calculations.
- Not a claim of legal compliance with a specific jurisdiction.
- Out of scope: payroll, HR, procurement, telemedicine, autonomous diagnosis/prescription.
- Production requires PostgreSQL (Neon or equivalent). SQLite is not used on Vercel.
