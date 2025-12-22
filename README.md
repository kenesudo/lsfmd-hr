# LSFMD HR Templates

This project is a small internal tool for managing HR process templates and generating BBCode (BBC) output quickly.

It is intentionally scoped as a template + log generator.
It is **not** intended to be a forum replacement.

## What this app does

- Generate BBCode output for common HR processes (Application, Reinstatement, Trainings, Employee Profile, Supervision).
- Store canonical BBC templates and per-process field definitions.
- Provide canonical log markdowns that can be copied/pasted into your forum logs.
- Track your generated activities so Commanders can review/score.

## Features by user type

### Probationary Instructor / General Instructor

- Generate BBC templates for:
  - Applications
  - Reinstatement
  - Trainings
  - Employee Profile
- Copy the canonical log markdown per process type.
- View your own submitted activities.

### Supervisory Instructor

- Everything Instructors can do.
- Access Supervision templates/tools.

### Assistant Commander / Commander

- Everything Supervisors can do.
- Manage members:
  - Create accounts
  - Change HR role
  - Disable/enable accounts
- Review and score submitted activities.
- Manage process metadata (process keys, labels, scoring).
- Manage BBC templates and template fields.
- Manage canonical log markdown templates.

## Tech

- Next.js (App Router)
- Supabase (Auth + Postgres)

## Setup

1) Install dependencies

```bash
npm install
```

2) Configure environment variables

Copy `.env.template` to `.env` and fill in the values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SETUP_TOKEN`

3) Apply database migrations

SQL migrations live in `supabase/migrations/`.
Apply them to your Supabase Postgres database in order.

4) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.
