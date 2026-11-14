-- Lets the public site rank listings by real outbound clicks without exposing the click log.
-- Returns only the ids of published listings, most-clicked first. Click counts stay private.
-- A listing needs at least 3 clicks in the period to count, so one stray click can't top the list.
-- To apply: Supabase dashboard > SQL Editor > paste this whole file > Run.
create or replace function popular_listing_ids(p_type listing_type, p_days int default 30, p_limit int default 6)
returns table (listing_id uuid)
language sql stable security definer set search_path = public as $$
  select c.listing_id
  from clicks c
  join listings l on l.id = c.listing_id
  where l.status = 'published'
    and p_type = any (l.types)
    and c.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
  group by c.listing_id
  having count(*) >= 3
  order by count(*) desc, c.listing_id
  limit least(greatest(p_limit, 1), 20);
$$;

grant execute on function popular_listing_ids(listing_type, int, int) to anon, authenticated;
