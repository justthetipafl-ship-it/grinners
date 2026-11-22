-- Security hardening before launch.
-- 1. Size limits on the three tables the public can write to, so nobody can fill the database with junk rows.
-- 2. Clicks must point at a real listing or link.
-- 3. Internal checking notes are removed from listings that are already published.
-- "not valid" means the rule applies to new rows without re-checking old ones.

alter table submissions
  add constraint submissions_payload_size check (pg_column_size(payload) <= 8000) not valid,
  add constraint submissions_email_length check (contact_email is null or char_length(contact_email) <= 200) not valid;

alter table subscribers
  add constraint subscribers_email_shape check (char_length(email) <= 200 and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$') not valid,
  add constraint subscribers_source_length check (source is null or char_length(source) <= 50) not valid;

alter table clicks
  add constraint clicks_field_lengths check (
    (source_path is null or char_length(source_path) <= 500)
    and (referrer is null or char_length(referrer) <= 500)
    and (country is null or char_length(country) <= 8)
  ) not valid;

drop policy if exists public_insert on clicks;
create policy public_insert on clicks for insert with check (listing_id is not null or affiliate_link_id is not null);

update listings set attributes = attributes - 'vet_note' - 'starter'
where status = 'published' and (attributes ? 'vet_note' or attributes ? 'starter');

-- Image storage: images only, 2 MB at most.
update storage.buckets set file_size_limit = 2097152, allowed_mime_types = array['image/*'] where id = 'images';
