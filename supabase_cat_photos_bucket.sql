-- =====================================================
-- Cat Photos Storage Bucket Setup
-- Run this in your Supabase SQL Editor to enable
-- cat photo uploads that are accessible to all users
-- =====================================================

-- 1. Create the storage bucket for cat photos (if it doesn't exist)
-- Note: You may need to create this manually in the Supabase Dashboard
-- Go to: Storage → New Bucket → Name: "cat-photos" → Make it PUBLIC

-- 2. Enable RLS on storage.objects (may already be enabled)
DO $$
BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping RLS enable on storage.objects (insufficient privileges or already enabled)';
END $$;

-- 3. Create policies for the cat-photos bucket
-- Allow authenticated users to upload images
DO $$
BEGIN
    CREATE POLICY "Allow authenticated users to upload cat photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'cat-photos');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Allow authenticated users to upload cat photos" already exists';
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping policy creation (insufficient privileges)';
END $$;

-- Allow anyone to view/download cat photos (public read)
DO $$
BEGIN
    CREATE POLICY "Allow public read access to cat photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'cat-photos');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Allow public read access to cat photos" already exists';
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping policy creation (insufficient privileges)';
END $$;

-- Allow authenticated users to update their own uploads
DO $$
BEGIN
    CREATE POLICY "Allow authenticated users to update cat photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'cat-photos');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Allow authenticated users to update cat photos" already exists';
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping policy creation (insufficient privileges)';
END $$;

-- Allow authenticated users to delete their own uploads
DO $$
BEGIN
    CREATE POLICY "Allow authenticated users to delete cat photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'cat-photos');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Allow authenticated users to delete cat photos" already exists';
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping policy creation (insufficient privileges)';
END $$;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- IMPORTANT: Manual Steps Required
-- =====================================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: cat-photos
-- 4. Check "Public bucket" (so images are publicly accessible)
-- 5. Click "Create bucket"
--
-- If the bucket already exists but images aren't loading:
-- - Check the bucket is set to PUBLIC (not private)
-- - Go to bucket settings and verify public access is enabled
-- =====================================================

