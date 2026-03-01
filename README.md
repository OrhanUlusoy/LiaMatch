# LiaMatch

> Matcha LIA-studenter och arbetsgivare — snabb onboarding, tydliga profiler, enkla annonser, smart matchning.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres%20%2B%20Storage-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss)

---

## Funktioner (MVP)

| Funktion                | Beskrivning                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Roller**              | Student / Företag (admin valfritt)                                             |
| **Studentprofil**       | Track, skola, stad, GitHub, LinkedIn, starkaste projekt, CV/PB-upload, perioder |
| **Företagsprofil**      | Företagsnamn, stad, webbplats                                                  |
| **LIA-annons**          | Titel, beskrivning, stad, period, platser, track-fokus, skills                 |
| **Matchning 0–100**     | Track (35p), Skills (35p), Stad (20p), Period (10p) — med transparens          |
| **Ansökan**             | Student → Visa intresse med status (Pending / Viewed)                          |
| **Explore + Filter**    | Stad, inriktning, sökbara annonser                                             |
| **Tvåspråkig (sv/en)**  | JSON-baserad i18n med språk-toggle i header                                    |

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
├── .gitignore
├── README.md
├── supabase/
│   └── migrations/
│       └── 0001_init.sql          # Postgres schema + RLS
└── apps/
    └── web/                       # Next.js App
        ├── middleware.ts           # Supabase session refresh + i18n cookie
        ├── .env.local.example
        ├── src/
        │   ├── app/
        │   │   ├── layout.tsx     # Root layout + I18nProvider + Header
        │   │   ├── page.tsx       # Landing / Hero
        │   │   ├── login/         # Magic link login
        │   │   ├── onboarding/    # Rollval
        │   │   ├── profile/       # Student / Company profil
        │   │   ├── match/         # Match-flöde med score
        │   │   ├── explore/       # Annonser + filter + skapa annons
        │   │   ├── about/         # Om LiaMatch
        │   │   ├── auth/callback/ # Supabase auth redirect
        │   │   └── api/
        │   │       ├── internships/   # GET (filter) + POST
        │   │       ├── applications/  # GET + POST
        │   │       └── matches/
        │   │           ├── student/   # GET → match score per annons
        │   │           └── company/   # GET → match score per kandidat
        │   ├── components/
        │   │   ├── Header.tsx
        │   │   ├── LanguageToggle.tsx
        │   │   ├── StudentProfileForm.tsx
        │   │   ├── CompanyProfileForm.tsx
        │   │   └── ui/  (Button, Card, Input, Label, Textarea, Badge)
        │   ├── i18n/
        │   │   ├── dictionaries/ (sv.json, en.json)
        │   │   ├── lang.ts
        │   │   ├── getMessages.ts
        │   │   ├── I18nProvider.tsx
        │   │   ├── t.ts
        │   │   └── useT.ts
        │   └── lib/
        │       ├── cn.ts
        │       ├── env.ts
        │       ├── matching/score.ts   # Matchningsalgoritm
        │       └── supabase/
        │           ├── client.ts       # Browser client
        │           ├── server.ts       # Server client
        │           └── middleware.ts    # Session refresh
        └── ...
```

---

## Datamodell

Se [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) för komplett schema.

**Tabeller:**

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
2. Gå till **SQL Editor** och kör innehållet i `supabase/migrations/0001_init.sql`.
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

1. Koppla GitHub-repot till Vercel.
2. Sätt root directory till `apps/web`.
3. Lägg till env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.

### Databas/Auth/Storage (Supabase)

Ditt Supabase-projekt hostar alla tre lager. Kör migrationerna via SQL Editor.

---

## Definition of Done ✅

- [x] **Roller**: Student + Företag
- [x] **Studentprofil**: Alla kravfält + CV/PB-upload
- [x] **Företagsprofil**: Alla kravfält
- [x] **LIA-annons**: CRUD med validering
- [x] **Matchning**: Score 0–100 med transparens (reasons)
- [x] **Ansökan/Intresse**: Pending-status + unique constraint
- [x] **Sök/Filter**: Stad + inriktning
- [x] **UI-sidor**: Matcha / Utforska / Om + Profil + Login
- [x] **Tvåspråkig**: Svenska (default) + English med toggle
- [x] **Auth**: Magic link via Supabase
- [x] **RLS**: Rätt åtkomst per roll
- [x] **Validering**: Zod (server) + HTML required (client)
- [x] **Responsivt**: Mobile-first Tailwind
- [x] **README**: Setup + deploy + DoD

---

## Framtida förbättringar

- Adminpanel (moderering)
- Notifieringar (email)
- Favoriter/bookmark
- Exportera matchrapport som PDF
- Student-dashboard med ansökningsstatus
- ML-baserad matchning

---

## Licens

MIT
