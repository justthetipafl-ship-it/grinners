-- Grinners database, version 1.
-- To apply: Supabase dashboard > SQL Editor > paste this whole file > Run.

create extension if not exists pg_trgm;

-- ---------- Enumerations ----------
create type listing_type   as enum ('tipster', 'tool', 'podcast', 'youtube', 'creator');
create type pricing_model  as enum ('free', 'paid', 'freemium');
create type publish_status as enum ('draft', 'pending', 'published', 'archived');
create type tip_result     as enum ('pending', 'won', 'lost', 'void');

-- ---------- Admins ----------
create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ---------- Taxonomy ----------
create table sports (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order int not null default 0
);

create table competitions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references sports (id) on delete cascade,
  slug text unique not null,
  name text not null
);

create table markets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('tool', 'article')),
  slug text not null,
  name text not null,
  unique (kind, slug)
);

-- ---------- Listings ----------
create table listings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  types listing_type[] not null check (cardinality(types) > 0),
  tagline text not null default '',
  bio text not null default '',
  logo_url text,
  cover_url text,
  website_url text,
  pricing pricing_model not null default 'free',
  pricing_note text,
  -- Sport and market slugs this listing covers, e.g. {afl,nba}. Kept as simple
  -- lists so filtering and the admin form stay straightforward.
  sports text[] not null default '{}',
  markets text[] not null default '{}',
  category text,
  features text[] not null default '{}',
  attributes jsonb not null default '{}',
  status publish_status not null default 'draft',
  is_featured boolean not null default false,
  featured_until timestamptz,
  is_sponsored boolean not null default false,
  ownership_disclosure text,
  claimed_record_note text,
  vetted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', name), 'A') ||
    setweight(to_tsvector('english', tagline), 'B') ||
    setweight(to_tsvector('english', bio), 'C')
  ) stored
);
create index listings_search_idx on listings using gin (search);
create index listings_name_trgm_idx on listings using gin (name gin_trgm_ops);
create index listings_types_idx on listings using gin (types);
create index listings_sports_idx on listings using gin (sports);

create table listing_links (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  platform text not null,
  url text not null,
  sort_order int not null default 0
);

-- ---------- Affiliate links and clicks ----------
create table affiliate_links (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  listing_id uuid references listings (id) on delete set null,
  destination_url text not null,
  label text not null default 'Visit site',
  utm_source text default 'grinners',
  utm_medium text default 'referral',
  utm_campaign text,
  partner_note text,
  -- False for a plain outbound link that earns nothing but is still click-tracked.
  is_affiliate boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- One row per outbound click. No IP address is stored.
create table clicks (
  id bigint generated always as identity primary key,
  affiliate_link_id uuid references affiliate_links (id) on delete set null,
  listing_id uuid references listings (id) on delete set null,
  source_path text,
  referrer text,
  country text,
  created_at timestamptz not null default now()
);
create index clicks_link_time_idx on clicks (affiliate_link_id, created_at desc);

-- ---------- Tips ----------
create table tips (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  sport_id uuid not null references sports (id),
  competition_id uuid references competitions (id),
  event_name text not null,
  event_start timestamptz not null,
  market_id uuid references markets (id),
  market_label text,
  selection text not null,
  odds numeric(7, 2) not null check (odds > 1),
  bookmaker text,
  analysis text not null default '',
  status publish_status not null default 'draft',
  published_at timestamptz,
  result tip_result not null default 'pending',
  settled_at timestamptz,
  created_at timestamptz not null default now()
);
create index tips_feed_idx on tips (status, event_start desc);

-- Once the event has started, a published tip is locked: only its result can change.
create function lock_started_tips() returns trigger language plpgsql as $$
begin
  if old.status = 'published' and old.event_start <= now() then
    if (new.selection, new.odds, new.event_name, new.event_start, new.market_id, new.market_label,
        new.bookmaker, new.analysis, new.listing_id, new.sport_id, new.competition_id, new.published_at)
       is distinct from
       (old.selection, old.odds, old.event_name, old.event_start, old.market_id, old.market_label,
        old.bookmaker, old.analysis, old.listing_id, old.sport_id, old.competition_id, old.published_at) then
      raise exception 'This tip is locked because the event has started. Only the result can be changed.';
    end if;
  end if;
  return new;
end;
$$;
create trigger tips_lock before update on tips for each row execute function lock_started_tips();

-- A tip cannot be published after its event has started.
create function block_late_tips() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') and new.event_start <= now() then
    raise exception 'A tip cannot be published after the event has started.';
  end if;
  return new;
end;
$$;
create trigger tips_no_late_publish before insert or update on tips for each row execute function block_late_tips();

-- ---------- Editorial ----------
create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  cover_url text,
  category_id uuid references categories (id),
  author_name text not null default 'Grinners',
  author_listing_id uuid references listings (id) on delete set null,
  is_sponsored boolean not null default false,
  sponsor_name text,
  seo_title text,
  seo_description text,
  status publish_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_sponsored or sponsor_name is not null)
);

create table article_listings (
  article_id uuid not null references articles (id) on delete cascade,
  listing_id uuid not null references listings (id) on delete cascade,
  primary key (article_id, listing_id)
);

create table spotlights (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  listing_id uuid not null references listings (id) on delete cascade,
  headline text not null,
  body text not null default '',
  article_id uuid references articles (id) on delete set null,
  is_sponsored boolean not null default false,
  starts_on date not null,
  ends_on date not null,
  check (ends_on >= starts_on)
);

create table content_items (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  kind text not null check (kind in ('episode', 'video', 'x_post')),
  title text not null,
  url text not null,
  thumbnail_url text,
  external_id text,
  published_at timestamptz not null,
  unique (listing_id, external_id)
);

-- ---------- Inbound from the public ----------
create table submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('listing', 'feature_request', 'report')),
  payload jsonb not null,
  contact_email text,
  status text not null default 'new' check (status in ('new', 'approved', 'rejected')),
  review_note text,
  created_at timestamptz not null default now()
);

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Access rules ----------
-- Visitors can read published content only. Admins can do everything.
-- Anyone can add a click row (that is how /go links are counted) but only admins can read them.
do $$
declare t text;
begin
  foreach t in array array[
    'admins','sports','competitions','markets','categories','listings','listing_links',
    'affiliate_links','clicks','tips','articles','article_listings','spotlights','content_items',
    'submissions','subscribers'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy admin_all on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

create policy public_read on sports       for select using (true);
create policy public_read on competitions for select using (true);
create policy public_read on markets      for select using (true);
create policy public_read on categories   for select using (true);
create policy public_read on listings     for select using (status = 'published');
create policy public_read on tips         for select using (status = 'published');
create policy public_read on articles     for select using (status = 'published');
create policy public_read on spotlights   for select using (current_date between starts_on and ends_on);
create policy public_read on listing_links for select using (
  exists (select 1 from listings l where l.id = listing_id and l.status = 'published'));
create policy public_read on content_items for select using (
  exists (select 1 from listings l where l.id = listing_id and l.status = 'published'));
create policy public_read on article_listings for select using (
  exists (select 1 from articles a where a.id = article_id and a.status = 'published'));
create policy public_read on affiliate_links for select using (is_active);

create policy public_insert on clicks for insert with check (true);
create policy public_insert on submissions for insert with check (status = 'new' and review_note is null);
create policy public_insert on subscribers for insert with check (confirmed_at is null);

-- ---------- Image storage ----------
-- One public bucket for logos and cover images. Anyone can view, only admins can upload.
insert into storage.buckets (id, name, public) values ('images', 'images', true)
on conflict (id) do nothing;

create policy images_admin_write on storage.objects for all
  using (bucket_id = 'images' and public.is_admin())
  with check (bucket_id = 'images' and public.is_admin());
create policy images_public_read on storage.objects for select using (bucket_id = 'images');

-- ---------- Starting taxonomy ----------
insert into sports (slug, name, sort_order) values
  ('afl', 'AFL', 1), ('nrl', 'NRL', 2), ('racing', 'Racing', 3),
  ('nba', 'NBA', 4), ('nfl', 'NFL', 5), ('mlb', 'MLB', 6);

insert into markets (slug, name) values
  ('head-to-head', 'Head to head'), ('line', 'Line'), ('totals', 'Totals'),
  ('player-props', 'Player props'), ('try-scorer', 'Try scorer'),
  ('anytime-touchdown', 'Anytime touchdown'), ('futures', 'Futures');

insert into categories (kind, slug, name) values
  ('tool', 'odds-comparison', 'Odds comparison'),
  ('tool', 'statistical-research', 'Statistical research'),
  ('tool', 'player-prop-research', 'Player prop research'),
  ('tool', 'betting-analytics', 'Betting analytics'),
  ('tool', 'ev-calculators', 'EV calculators'),
  ('tool', 'bankroll-tracking', 'Bankroll tracking'),
  ('tool', 'fantasy-tools', 'Fantasy sports tools'),
  ('tool', 'data-platforms', 'Data and statistics platforms'),
  ('article', 'betting-education', 'Betting education'),
  ('article', 'strategy', 'Strategy'),
  ('article', 'sports-analysis', 'Sports analysis'),
  ('article', 'fantasy', 'Fantasy sports'),
  ('article', 'creator-interviews', 'Creator interviews'),
  ('article', 'tool-reviews', 'Tool reviews'),
  ('article', 'industry-news', 'Industry news');
