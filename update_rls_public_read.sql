-- ==============================================================================
-- 1. DROP RESTRICTIVE "AUTHENTICATED ONLY" READ POLICIES
-- ==============================================================================

-- Cats Table
drop policy if exists "Enable read access for authenticated users" on public.cats;

-- Cat Feedings Table
drop policy if exists "Enable read access for authenticated users" on public.cat_feedings;

-- Cat Translations Table
drop policy if exists "Enable read access for authenticated users" on public.cat_translations;

-- ==============================================================================
-- 2. CREATE NEW "PUBLIC READ" POLICIES (Visible to everyone, logged in or not)
-- ==============================================================================

-- Cats Table
create policy "Enable read access for all users" on public.cats
  for select using (true);

-- Cat Feedings Table
create policy "Enable read access for all users" on public.cat_feedings
  for select using (true);

-- Cat Translations Table
create policy "Enable read access for all users" on public.cat_translations
  for select using (true);

-- Note: Write/Update/Delete policies remain restricted to "authenticated" users
-- as defined in the previous scripts. We are only opening up SELECT.
