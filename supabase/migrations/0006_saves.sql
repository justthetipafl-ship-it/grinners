-- Counts how often each listing is saved. Visitors' own saved lists stay on their device;
-- this only records "this listing was saved once", with nothing about who saved it.
create table if not exists saves (
  id bigint generated always as identity primary key,
  listing_id uuid not null references listings (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists saves_listing_time_idx on saves (listing_id, created_at desc);

alter table saves enable row level security;
drop policy if exists admin_all on saves;
create policy admin_all on saves for all using (is_admin()) with check (is_admin());
drop policy if exists public_insert on saves;
create policy public_insert on saves for insert with check (
  exists (select 1 from listings l where l.id = listing_id and l.status = 'published'));
