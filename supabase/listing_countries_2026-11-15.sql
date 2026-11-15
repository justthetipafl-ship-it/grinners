-- Sets the country-of-origin flag on listings where the country is clear.
-- Anything not named here stays without a flag until you pick one in admin.
update listings set attributes = coalesce(attributes, '{}'::jsonb) || '{"country":"AU"}'::jsonb
where slug in ('justthetipaus-com', 'footy-form-guide', 'dfs-australia', 'wheelo-ratings');

update listings set attributes = coalesce(attributes, '{}'::jsonb) || '{"country":"US"}'::jsonb
where slug in ('pikkit', 'oddsjam', 'outlier', 'props-cash', 'fantasy-points-data');
