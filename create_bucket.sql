-- 1. Insert the bucket (Safe to run)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cat-photos', 'cat-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create policies (Ignore errors if they exist, or drop manually if needed)
-- NOTE: We skipped "ALTER TABLE" because it requires ownership perms and is usually already enabled.

-- Allow public access to read files
DO $$
BEGIN
    CREATE POLICY "Public Read Access"
    ON storage.objects FOR SELECT
    TO public
    USING ( bucket_id = 'cat-photos' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Allow public access to insert files
DO $$
BEGIN
    CREATE POLICY "Public Insert Access"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK ( bucket_id = 'cat-photos' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Allow public access to update files
DO $$
BEGIN
    CREATE POLICY "Public Update Access"
    ON storage.objects FOR UPDATE
    TO public
    USING ( bucket_id = 'cat-photos' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Allow public access to delete files
DO $$
BEGIN
    CREATE POLICY "Public Delete Access"
    ON storage.objects FOR DELETE
    TO public
    USING ( bucket_id = 'cat-photos' );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
