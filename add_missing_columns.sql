-- Migration to add missing columns to existing cats table
-- Run this in your Supabase SQL editor if you get errors about missing columns

-- Add rescue_flags column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cats' 
        AND column_name = 'rescue_flags'
    ) THEN
        ALTER TABLE public.cats ADD COLUMN rescue_flags text[] DEFAULT '{}';
    END IF;
END $$;

-- Add color_profile column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cats' 
        AND column_name = 'color_profile'
    ) THEN
        ALTER TABLE public.cats ADD COLUMN color_profile text[];
    END IF;
END $$;

-- Add location_description column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cats' 
        AND column_name = 'location_description'
    ) THEN
        ALTER TABLE public.cats ADD COLUMN location_description text;
    END IF;
END $$;

-- Add tnr_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cats' 
        AND column_name = 'tnr_status'
    ) THEN
        ALTER TABLE public.cats ADD COLUMN tnr_status boolean DEFAULT false;
    END IF;
END $$;

