-- Dr. Profit: added as a hidden DRAFT. Skipped if a listing with this name or slug already exists.
insert into listings (slug, name, types, tagline, bio, website_url, pricing, pricing_note, sports, features, status, attributes)
select 'dr-profit', 'Dr. Profit', array['tipster','creator']::listing_type[],
  'Data-led picks and analysis from one half of Austin Props & Dr. Profit.',
  'Dr. Profit shares betting picks and the reasoning behind them on X, with a focus on numbers over hunches. Alongside Austin Props, he runs a members'' community for punters who want to bet with data and learn from each other.',
  'https://x.com/DoctorProfit', 'freemium'::pricing_model, 'Free content on X, with a paid membership', array[]::text[],
  array['Discord community','Paid picks','Write-ups with reasoning']::text[], 'draft'::publish_status,
  '{"starter": true, "vet_note": "Add the sports and markets he covers, then name them in the tagline. Confirm country, pricing and whether he posts free picks. Leave out any quoted record or word it as his own claim. Ask whether he wants this page as well as the joint Austin Props & Dr. Profit listing."}'::jsonb
where not exists (select 1 from listings where lower(name) = lower('Dr. Profit')) on conflict (slug) do nothing;
insert into listing_links (listing_id, platform, url) select id, 'X', 'https://x.com/DoctorProfit' from listings l where slug = 'dr-profit' and status = 'draft' and not exists (select 1 from listing_links k where k.listing_id = l.id);
