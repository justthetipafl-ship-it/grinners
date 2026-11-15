-- New descriptions and feature lists for the 13 listings live on 15 Nov 2026.
-- Read each one first: this replaces the one-line description, the About text and the feature list.
-- Nothing else on a listing is touched (images, links, sports, categories, pricing, status).
-- To apply: Supabase dashboard > SQL Editor > paste this whole file > Run.
-- Then open any listing in admin and press Save once, so the public pages refresh.

-- justthetipaus-com
update listings set
  tagline = 'Player prop tips and free research tools across AFL, NFL, NBA and more.',
  bio = 'Just The Tip is an Australian tipping service and research suite built around player props. Subscribers get the tips plus access to research tools covering AFL, NFL, NBA, MLB, NHL and NBL. The tools are built for research, not picks: they lay out as many data points as possible so you can make your own call.',
  features = array['Player prop tips for subscribers', 'Research tools for AFL, NFL, NBA, MLB, NHL and NBL', 'Check My Bet: test a bet against recent form and head-to-head history', 'Matchup signals, hit rates and defence-versus-position data', 'A published ledger of every tip and its result']::text[]
where slug = 'justthetipaus-com';

-- footy-form-guide
update listings set
  tagline = 'AFL round previews, tips and best bets with Walley and Harro.',
  bio = 'A weekly AFL podcast for punters. Hosts Walley and Harro go through every game of the round, call out their best bets and answer listener questions from social media. Episodes are also published as videos on YouTube.',
  features = array['A preview of every game, every round', 'Best bets each week', 'Listener questions answered on the show', 'Finals, Brownlow and futures specials', 'Available as audio and on YouTube']::text[]
where slug = 'footy-form-guide';

-- pikkit
update listings set
  tagline = 'A bet tracker that syncs your sportsbook accounts and shows how you really perform.',
  bio = 'Pikkit is a bet-tracking and social app. It links to your sportsbook accounts, pulls your bets in automatically and turns them into performance analytics, alongside a community where you can follow other bettors. It is not a sportsbook and takes no bets. Syncing is built around US sportsbooks, so check which of your accounts it supports.',
  features = array['Automatic bet syncing from 30+ sportsbooks', 'Performance analytics, including closing-line value', 'Line shopping across books', 'Follow other bettors and see their synced bets', 'Live leaderboards', 'Free to download, with paid upgrades']::text[]
where slug = 'pikkit';

-- betbank-ai
update listings set
  tagline = 'Expected-value, arbitrage and bet-tracking tools for everyday punters.',
  bio = 'BetBank.ai is a betting analytics platform aimed at everyday punters. It brings together tools more often used by professionals, such as expected-value and arbitrage finders, with bet tracking so you can see how your betting is going over time.',
  features = array['Expected-value (EV) tools', 'Arbitrage finder', 'Bonus bet conversion', 'Stat comparison pages', 'Bet tracking, including live tracking']::text[]
where slug = 'betbank-ai';

-- justdimes
update listings set
  tagline = 'AFL and NBA player prop tips from an Australian punter.',
  bio = 'JustDimes is an Australian sports bettor who posts AFL and NBA player prop tips on X and Instagram. AFLCappersLeague champion (self-reported).',
  features = array['AFL player prop tips', 'NBA player prop tips', 'Free to follow on X and Instagram']::text[]
where slug = 'justdimes';

-- propedia
update listings set
  tagline = 'A free player prop reference with lines, hit rates and defence-versus-position data.',
  bio = 'Propedia calls itself the encyclopedia of props. It is a free research app that puts prop lines, hit rates and defence-versus-position (DvP) data for US sports in one place.',
  features = array['Prop lines in one place', 'Hit rates', 'Defence-versus-position (DvP) data', 'Covers NBA, NFL, MLB and NHL', 'Free to use']::text[]
where slug = 'propedia';

-- dfs-australia
update listings set
  tagline = 'AFL player stats, game logs and role data for fantasy and prop research.',
  bio = 'DFS Australia is an AFL data site for fantasy coaches and prop punters. It breaks player stats down by season and opponent, offers filterable game logs with advanced measures such as centre bounce attendances, and publishes slate analysis for daily fantasy contests.',
  features = array['Player stats by season and by opponent', 'Filterable game logs', 'Role data such as centre bounce attendances', 'Slate analysis for daily fantasy contests']::text[]
where slug = 'dfs-australia';

-- fantasy-points-data
update listings set
  tagline = 'Hand-charted NFL data and research tools for fantasy players and bettors.',
  bio = 'The Fantasy Points Data Suite is an NFL research platform built on data charted in-house from every snap of every game. Its tables can be filtered and split by almost any game situation, and it is designed to be usable without a data science background. Access is by paid subscription.',
  features = array['Hand-charted NFL data, updated weekly in season', 'Deep filters and splits by game situation', 'Coverage and matchup tools for quarterbacks, receivers and the lines', 'Receiver separation metrics', 'Weekly reports: snaps, route share, target share and more']::text[]
where slug = 'fantasy-points-data';

-- masterclass-analytics
update listings set
  bio = 'Masterclass Analytics is a research tool for NBA and NFL bettors, covering player props, matchup splits and line movement for each slate. The team also publishes on X and YouTube.',
  features = array['Player prop research', 'Matchup splits', 'Line movement tracking', 'NBA and NFL coverage']::text[]
where slug = 'masterclass-analytics';

-- oddsjam
update listings set
  tagline = 'Positive expected-value and arbitrage scanning across sportsbooks.',
  bio = 'OddsJam is a subscription betting platform that scans odds across a large number of sportsbooks in real time. Its tools look for positive expected-value bets, arbitrage and middles, and it includes a bet tracker that measures closing-line value. Coverage is strongest for US sportsbooks, and the paid plans are priced for serious bettors.',
  features = array['Positive expected-value (+EV) scanner', 'Arbitrage and middles finders', 'Odds comparison across sportsbooks', 'Promo converter for sportsbook offers', 'Bet tracker with closing-line value', '7-day free trial on paid plans']::text[]
where slug = 'oddsjam';

-- outlier
update listings set
  tagline = 'Player prop research with hit rates, trends and positive-EV tools.',
  bio = 'Outlier is a sports betting research app. It shows how players have performed against specific prop lines and surfaces trending picks, and its Pro tier adds positive-EV and arbitrage tools with links straight to the sportsbook''s bet slip. It is built around US sports and sportsbooks.',
  features = array['Player performance against prop lines', 'Trending insights and picks', 'Positive-EV feed (Pro)', 'Arbitrage and middle betting tools (Pro)', 'Links straight to sportsbook bet slips', 'Discord community and live support']::text[]
where slug = 'outlier';

-- props-cash
update listings set
  tagline = 'Player prop research with visual trends, filters and odds comparison.',
  bio = 'Props.cash is a player prop research tool for web and mobile. It presents player stats and trends as simple charts, lets you filter by specific scenarios, and compares prop lines and odds across sportsbooks and pick''em sites. It was built by a team of Canadian teachers, engineers and bettors, and covers NBA, NFL, NHL, MLB, WNBA and college football.',
  features = array['Thousands of player props, sortable by value', 'Visual hit-rate and trend charts', 'Scenario filters and matchup history', 'Odds comparison across sportsbooks and pick''em sites', '7-day free trial']::text[]
where slug = 'props-cash';

-- wheelo-ratings
update listings set
  tagline = 'AFL player and team statistics, records and Elo ratings.',
  bio = 'Wheelo Ratings is a free statistics site. It covers AFL player stats, player profiles, match stats and team ratings, and also publishes Elo ratings for professional tennis.',
  features = array['AFL player stats and profiles', 'Match and team statistics', 'Team ratings', 'Elo ratings for professional tennis', 'Free to use']::text[]
where slug = 'wheelo-ratings';
