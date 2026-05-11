-- Create the public screenshots bucket used by result screenshot uploads.
-- The app uploads from trusted server actions with SUPABASE_SERVICE_ROLE_KEY.

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do update
set public = excluded.public;

-- Public buckets can serve known object URLs without a broad SELECT policy.
-- Dropping this prevents clients from listing every uploaded screenshot.
drop policy if exists "Public read screenshots" on storage.objects;
