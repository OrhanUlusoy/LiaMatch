# LiaMatch

> Matcha LIA-studenter och arbetsgivare — snabb onboarding, tydliga profiler, enkla annonser, smart matchning.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres%20%2B%20Storage-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss)
![CI](https://github.com/OrhanUlusoy/LiaMatch/actions/workflows/ci.yml/badge.svg)

---

## Funktioner

| Funktion                          | Beskrivning                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| **Roller**                        | Student / Företag / Admin                                                          |
| **Studentprofil**                 | Track, skola, stad, GitHub, LinkedIn, projekt, CV/PB-upload, perioder, skills      |
| **Företagsprofil**                | Namn, stad, webbplats, logotyp, beskrivning, vision, "vi söker"                    |
| **LIA-annons**                    | Titel, beskrivning, stad, period, platser, track-fokus, skills                     |
| **Matchning 0–100**               | Track (35p), Skills (35p), Stad (20p), Period (10p) — konfigurerbara vikter        |
| **Ansökan + historik**            | Status-timeline (Pending → Viewed → …) med audit-logg                              |
| **Explore + Filter**              | Stad, inriktning, synlighets-toggle (open_for_lia / visible)                       |
| **Meddelandesystem**              | Realtid student ↔ företag via Supabase Realtime                                    |
| **Notifieringar**                 | In-app + email-notifieringar                                                       |
| **Feedback & Analytics**          | Anonyma röster, kommentarer, visitor-tracking, tidsserier                           |
| **Adminpanel**                    | Användarhantering, analytics-dashboard, feedback-moderation                        |
| **Tvåspråkig (sv/en)**           | JSON-baserad i18n med språk-toggle i header                                        |
| **Mörkt/ljust tema**             | Theme-toggle med preload-script                                                    |
| **GDPR**                          | Kontoborttagning, dataexport, cookie-samtycke                                      |
| **Säkerhet**                      | RLS, roll-eskalerings-skydd, security-definer `is_admin()`                         |
| **CI/CD**                         | GitHub Actions (lint + vitest + build) → Vercel auto-deploy                        |

---

## Teknikstack

| Lager    | Teknik                                                   |
| -------- | -------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), TypeScript, TailwindCSS 4       |
| Backend  | Next.js API Routes (fullstack i ett)                     |
| Databas  | Supabase Postgres (RLS aktiverat)                        |
| Auth     | Supabase Auth — magic link (email OTP)                   |
| Storage  | Supabase Storage (`documents` bucket) — CV / PB          |
| Hosting  | Vercel (frontend + API) + Supabase Cloud (DB/Auth/Storage)|

**Motivering för fullstack Next.js (alt. A):** Enklare att drifta, deploya och underhålla. All logik (API routes + rendering) i ett projekt; perfekt för MVP. FastAPI (alt. B) är motiverat om matchningen görs med ML-modeller — men för deterministisk scoring räcker JS/TS.

---

## Projektstruktur

```
LiaMatch/
├── .github/workflows/ci.yml       # GitHub Actions CI
├── README.md
├── supabase/
│   └── migrations/                 # 15 migreringar (se nedan)
└── apps/
    └── web/                        # Next.js 16 App
        ├── middleware.ts            # Session refresh + i18n cookie
        ├── vercel.json              # Vercel-deploy-config
        ├── vitest.config.ts         # Vitest unit tests
        ├── playwright.config.ts     # E2E-tester
        ├── src/
        │   ├── app/
        │   │   ├── layout.tsx       # Root layout
        │   │   ├── page.tsx         # Landing / Hero
        │   │   ├── login/           # Magic link login
        │   │   ├── onboarding/      # Rollval
        │   │   ├── profile/         # Student / Company profil
        │   │   ├── dashboard/       # Användar-dashboard
        │   │   ├── match/           # Match-flöde med score
        │   │   ├── explore/         # Annonser + filter
        │   │   ├── applications/    # Ansökningsöversikt
        │   │   ├── messages/        # Realtid-meddelanden
        │   │   ├── notifications/   # Notiser
        │   │   ├── my-listings/     # Mina annonser
        │   │   ├── students/[id]    # Studentprofil
        │   │   ├── companies/[id]   # Företagsprofil
        │   │   ├── admin/           # Admin + analytics + feedback
        │   │   ├── feedback/        # Publik feedback
        │   │   ├── privacy/         # Integritetspolicy
        │   │   ├── about/           # Om LiaMatch
        │   │   ├── auth/            # Callback + confirm
        │   │   └── api/             # 23 API routes (se nedan)
        │   ├── components/
        │   │   ├── AppShell.tsx, Header.tsx, Footer.tsx
        │   │   ├── StudentProfileForm.tsx, CompanyProfileForm.tsx
        │   │   ├── CookieConsent.tsx, GdprSection.tsx
        │   │   ├── ThemeToggle.tsx, LanguageToggle.tsx
        │   │   └── ui/  (Button, Card, Input, Badge, Skeleton …)
        │   ├── i18n/                # sv.json + en.json + hook
        │   └── lib/
        │       ├── matching/score.ts    # Matchningsalgoritm
        │       └── supabase/            # client + server + middleware
        └── ...
```

---

## Datamodell

Se `supabase/migrations/` för komplett schema (15 migreringar).

### Migreringar

| #    | Fil                                              | Beskrivning                                                        |
| ---- | ------------------------------------------------ | ------------------------------------------------------------------ |
| 0001 | `init.sql`                                       | Kärnschema: users, student/company_profiles, internships, applications, RLS |
| 0002 | `feedback_votes.sql`                             | Anonym feedback med fingerprint-deduplicering                      |
| 0003 | `feedback_visitors.sql`                          | Unique visitor-tracking för feedback-sidan                         |
| 0004 | `feedback_role.sql`                              | Separata röster per roll (student/företag) + upsert                |
| 0005 | `admin_policies.sql`                             | RLS-policies för admin read-access                                 |
| 0006 | `fix_admin_recursion.sql`                        | Security-definer `is_admin()` — förhindrar RLS-rekursion           |
| 0007 | `storage_documents_bucket.sql`                   | Supabase Storage-bucket för CV/PB med user-scoped policies         |
| 0008 | `visibility_toggles.sql`                         | `open_for_lia` (student) + `visible` (företag) med RLS            |
| 0009 | `company_details_and_feedback_comment.sql`       | Rika företagsfält (beskrivning, vision, "vi söker") + kommentarer  |
| 0010 | `skills_logo_saved_messages_notifications.sql`   | Skills-array, logotyp, sparade annonser, meddelanden, notiser      |
| 0011 | `application_status_history.sql`                 | Ansöknings-statushistorik (audit-logg med trigger)                 |
| 0012 | `match_weights.sql`                              | Konfigurerbara matchningsvikter (JSONB)                            |
| 0013 | `security_hardening.sql`                         | Roll-eskalerings-skydd via trigger `prevent_role_change()`         |
| 0014 | `feedback_analytics.sql`                         | Utökad analytics: user_agent, page_url, tidsserier                 |
| 0015 | `gdpr_account_deletion.sql`                      | `delete_user_data()` — GDPR-compliant kontoborttagning            |

### Tabeller (urval)

- `users` (id, email, role, created_at)
- `student_profiles` (user_id, first_name, last_name, track, school, city, github_url, linkedin_url, projekt-fält, availability_periods JSONB, cv_file_url, pb_file_url)
- `company_profiles` (user_id, company_name, city, website)
- `internships` (id, company_user_id, title, description, city, period, seats, track_focus, skills JSONB)
- `applications` (id, internship_id, student_user_id, status)
- `match_scores` (cache-tabell, valfri)

Row Level Security (RLS) är konfigurerat så att:
- Studenter kan bara redigera sina egna profiler.
- Företag kan bara redigera sina annonser.
- Företag kan se ansökningar för sina annonser.
- Studenter kan se och skapa egna ansökningar.

---

## Matchningsalgoritm

**Score 0–100:**

| Dimension     | Max poäng | Logik                                        |
| ------------- | --------- | -------------------------------------------- |
| Track         | 35        | Exakt = 35, relaterat (alias) = 20, annat = 0 |
| Skills        | 35        | Jaccard-inspirerad overlap mot annonsens skills |
| Stad          | 20        | Exakt = 20, remote = 15, region = 10, annat = 0 |
| Period        | 10        | Full overlap = 10, delvis = 5, inget = 0       |

Returnerar `{ score, reasons[] }` — UI visar "Varför matchar vi?" med poäng per dimension.

---

## Kom igång lokalt

### Förkrav

- Node.js >= 18
- npm
- Supabase-projekt (gratis plan funkar)

### 1. Klona repot

```bash
git clone https://github.com/OrhanUlusoy/LiaMatch.git
cd LiaMatch/apps/web
```

### 2. Installera dependencies

```bash
npm install
```

### 3. Skapa Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) och skapa ett nytt projekt.
2. Gå till **SQL Editor** och kör alla filer i `supabase/migrations/` i ordning (0001–0015).
3. Under **Storage** → skapa bucket `documents` (privat).
4. Under **Authentication** → aktivera **Email** (magic link).

### 4. Konfigurera env

```bash
cp .env.local.example .env.local
# Fyll i:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Starta dev server

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

---

## Deploy

### Frontend (Vercel)

1. Koppla GitHub-repot till [Vercel](https://vercel.com).
2. Sätt **Root Directory** till `apps/web`.
3. Lägg till env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy — varje push till `main` triggar CI (lint + test + build) och auto-deploy.

### CI / CD

GitHub Actions (`.github/workflows/ci.yml`) kör automatiskt vid push/PR mot `main`:

1. **Lint** — ESLint
2. **Test** — Vitest (unit tests)
3. **Build** — Next.js production build

### Databas/Auth/Storage (Supabase)

Ditt Supabase-projekt hostar alla tre lager. Kör migrationerna 0001–0015 via SQL Editor.

---

## Definition of Done ✅

- [x] **Roller**: Student + Företag + Admin
- [x] **Studentprofil**: Alla kravfält + CV/PB-upload + skills + synlighets-toggle
- [x] **Företagsprofil**: Alla kravfält + logotyp + beskrivning/vision
- [x] **LIA-annons**: CRUD med validering + sparade annonser
- [x] **Matchning**: Score 0–100 med transparens + konfigurerbara vikter
- [x] **Ansökan/Intresse**: Status-timeline med audit-logg
- [x] **Sök/Filter**: Stad + inriktning + synlighets-filter
- [x] **Meddelanden**: Realtid student ↔ företag
- [x] **Notifieringar**: In-app + email
- [x] **Feedback**: Anonyma röster + kommentarer + analytics
- [x] **Admin**: Användarhantering + analytics-dashboard
- [x] **UI-sidor**: 21 sidor (Dashboard, Match, Explore, Profil, Meddelanden …)
- [x] **API**: 23 endpoints (CRUD + admin + GDPR + stats)
- [x] **Tvåspråkig**: Svenska (default) + English med toggle
- [x] **Mörkt/ljust tema**: ThemeToggle + preload-script
- [x] **Auth**: Magic link via Supabase
- [x] **RLS**: Rätt åtkomst per roll + roll-eskalerings-skydd
- [x] **GDPR**: Kontoborttagning + dataexport + cookie-samtycke
- [x] **Säkerhet**: 15 migreringar inkl. security hardening
- [x] **Validering**: Zod (server) + HTML required (client)
- [x] **Responsivt**: Mobile-first Tailwind
- [x] **CI/CD**: GitHub Actions → Vercel
- [x] **README**: Setup + deploy + alla features dokumenterade

---

## Framtida förbättringar

- Tvåfaktorsautentisering (2FA)
- ML-baserad matchning
- Exportera matchrapport som PDF
- Fler notifieringskanaler (Slack, SMS)
- Utökad admin-statistik

---

## Licens

MIT
