-- Adds the News & Alerts directory: a new listing type alongside tipster, tool, podcast, youtube and creator.
alter type listing_type add value if not exists 'news';
