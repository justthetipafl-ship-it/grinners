-- Tidies the tool categories.
-- 1. "Statistical research" and "Data and statistics platforms" were the same thing: both become "Stats and data".
-- 2. Three names are made clearer.
-- 3. Six new categories are added.
-- Every listing is moved to the new names, so nothing loses its categories.

-- Listings: the list of ticked categories.
update listings l
set attributes = jsonb_set(
  l.attributes,
  '{categories}',
  (
    select coalesce(jsonb_agg(name order by first_position), '[]'::jsonb)
    from (
      select coalesce(r.new_name, x.value) as name, min(x.position) as first_position
      from jsonb_array_elements_text(l.attributes->'categories') with ordinality as x(value, position)
      left join (values
        ('Statistical research', 'Stats and data'),
        ('Data and statistics platforms', 'Stats and data'),
        ('EV calculators', 'Positive EV and arbitrage'),
        ('Bankroll tracking', 'Bet tracking and bankroll'),
        ('Fantasy sports tools', 'Fantasy tools')
      ) as r(old_name, new_name) on r.old_name = x.value
      group by 1
    ) renamed
  )
)
where jsonb_typeof(l.attributes->'categories') = 'array';

-- Listings: the single main category.
update listings l set category = r.new_name
from (values
    ('Statistical research', 'Stats and data'),
    ('Data and statistics platforms', 'Stats and data'),
    ('EV calculators', 'Positive EV and arbitrage'),
    ('Bankroll tracking', 'Bet tracking and bankroll'),
    ('Fantasy sports tools', 'Fantasy tools')
  ) as r(old_name, new_name)
where l.category = r.old_name;

-- The category list itself.
delete from categories where kind = 'tool' and slug = 'data-platforms';
update categories set slug = 'stats-and-data', name = 'Stats and data' where kind = 'tool' and slug = 'statistical-research';
update categories set slug = 'positive-ev-and-arbitrage', name = 'Positive EV and arbitrage' where kind = 'tool' and slug = 'ev-calculators';
update categories set slug = 'bet-tracking-and-bankroll', name = 'Bet tracking and bankroll' where kind = 'tool' and slug = 'bankroll-tracking';
update categories set name = 'Fantasy tools' where kind = 'tool' and slug = 'fantasy-tools';

insert into categories (kind, slug, name) values
  ('tool', 'models-and-projections', 'Models and projections'),
  ('tool', 'betting-calculators', 'Betting calculators'),
  ('tool', 'alerts-and-line-movement', 'Alerts and line movement'),
  ('tool', 'dfs-and-pickem', 'DFS and pick''em tools'),
  ('tool', 'racing-form', 'Racing form and ratings'),
  ('tool', 'community-and-social', 'Community and social betting')
on conflict (kind, slug) do nothing;
