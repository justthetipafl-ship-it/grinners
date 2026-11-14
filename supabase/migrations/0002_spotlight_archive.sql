-- Lets visitors see past spotlights as well as the current one (for the /spotlight page).
-- Scheduled spotlights that haven't started yet stay hidden.
-- To apply: Supabase dashboard > SQL Editor > paste this whole file > Run.
drop policy if exists public_read on spotlights;
create policy public_read on spotlights for select using (starts_on <= current_date);
