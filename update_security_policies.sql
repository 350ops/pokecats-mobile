-- ==============================================================================
-- 1. CLEANUP: DROP OLD "OPEN" POLICIES
-- ==============================================================================

-- Cats Table
drop policy if exists "Enable read access for all users" on public.cats;
drop policy if exists "Enable insert access for all users" on public.cats;
drop policy if exists "Enable update access for all users" on public.cats;
drop policy if exists "Enable delete access for all users" on public.cats;

-- Cat Feedings Table
drop policy if exists "Enable read access for all users" on public.cat_feedings;
drop policy if exists "Enable insert access for all users" on public.cat_feedings;

-- Cat Translations Table
drop policy if exists "Enable read access for all users" on public.cat_translations;
drop policy if exists "Enable insert access for all users" on public.cat_translations;


-- ==============================================================================
-- 2. SECURE: CREATE NEW "AUTHENTICATED ONLY" POLICIES
-- ==============================================================================

-- Cats Table
create policy "Enable read access for authenticated users" on public.cats for select using (auth.role() = 'authenticated');
create policy "Enable insert access for authenticated users" on public.cats for insert with check (auth.role() = 'authenticated');
create policy "Enable update access for authenticated users" on public.cats for update using (auth.role() = 'authenticated');
create policy "Enable delete access for authenticated users" on public.cats for delete using (auth.role() = 'authenticated');

-- Cat Feedings Table
create policy "Enable read access for authenticated users" on public.cat_feedings for select using (auth.role() = 'authenticated');
create policy "Enable insert access for authenticated users" on public.cat_feedings for insert with check (auth.role() = 'authenticated');

-- Cat Translations Table
create policy "Enable read access for authenticated users" on public.cat_translations for select using (auth.role() = 'authenticated');
create policy "Enable insert access for authenticated users" on public.cat_translations for insert with check (auth.role() = 'authenticated');
