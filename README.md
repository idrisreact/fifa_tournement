# FC26 Group Chat Tournament

A Next.js 14 App Router dashboard for a 12-player EA Sports FC 26 PS5 league.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars, the app shows an empty setup-required state and disables mutations. No mock tournament data is rendered.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Create a public storage bucket named `screenshots`.
4. Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ADMIN_EMAIL=you@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The app uses Supabase Realtime subscriptions for `fixtures`, `standings`, and `players`.
# fifa_tournement
# fifa_tournement
# fifa_tournement
# fifa_tournement
