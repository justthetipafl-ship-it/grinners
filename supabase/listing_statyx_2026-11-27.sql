-- Statyx: added as a hidden DRAFT. Skipped if a listing with this name or slug already exists.
insert into listings (slug, name, types, tagline, bio, website_url, pricing, pricing_note, sports, category, features, status, attributes)
select 'statyx', 'Statyx', array['tool']::listing_type[],
  'Player prop and fantasy research for NFL, NBA and MLB that goes well past hit rates.',
  'Statyx is a research platform for prop bettors and fantasy players, not a picks service. NFL tools cover coverage matchups, routes, red-zone usage and sit-start calls. NBA tools cover matchups, who''s guarding who and lineups. MLB tools cover home runs, strikeouts, bullpens and park factors. It also has an odds tool that compares prop prices with a fair line, a same-game multi builder, a bet tracker and a Discord community. Several tools are free, with a paid All Access plan for the rest.',
  'https://statyx.io', 'freemium'::pricing_model, 'Free tools, with a paid All Access plan', array['nfl','nba','mlb','soccer']::text[],
  'Player prop research',
  array['Free plan','Web app','Discord community','Player prop hit rates','Matchup data','Projections','Odds comparison','Bet tracking','Fantasy rankings']::text[], 'draft'::publish_status,
  '{"starter": true, "categories": ["Player prop research", "Fantasy tools", "Models and projections"], "vet_note": "Add the All Access price from their pricing page. Country not stated on the site, so the flag is blank. The site also lists WNBA; soccer coverage looked lighter than NFL, NBA and MLB, so untick it if it is thin. Check which sportsbook lines the odds tool shows. They run an affiliate program, which could suit a deal."}'::jsonb
where not exists (select 1 from listings where lower(name) = lower('Statyx')) on conflict (slug) do nothing;
insert into listing_links (listing_id, platform, url) select l.id, v.platform, v.url from listings l, (values ('Website','https://statyx.io'),('X','https://x.com/statyxio'),('Discord','https://discord.com/invite/YYrZ4Zmebt')) as v(platform,url) where l.slug = 'statyx' and l.status = 'draft' and not exists (select 1 from listing_links k where k.listing_id = l.id);
