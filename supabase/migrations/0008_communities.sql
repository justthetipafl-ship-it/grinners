-- Adds the Communities directory: a new listing type for Discords, groups and forums.
alter type listing_type add value if not exists 'community';
