-- =====================================================
-- Cat Appearance (Color & Pattern) Migration
-- Run this in your Supabase SQL Editor to add
-- improved color and pattern tracking for cats
-- =====================================================

-- Add primary_color column (replaces/supplements color_profile array)
ALTER TABLE public.cats 
ADD COLUMN IF NOT EXISTS primary_color TEXT 
CHECK (primary_color IN ('black', 'white', 'grey', 'brown', 'orange', 'cream', 'mixed'));

-- Add pattern column
ALTER TABLE public.cats 
ADD COLUMN IF NOT EXISTS pattern TEXT 
CHECK (pattern IN ('solid', 'tabby', 'spotted', 'bicolour', 'calico', 'tortoiseshell', 'pointed', 'unknown'));

-- Add sex column
ALTER TABLE public.cats 
ADD COLUMN IF NOT EXISTS sex TEXT 
CHECK (sex IN ('male', 'female', 'unknown'));

-- Add approximate_age column
ALTER TABLE public.cats 
ADD COLUMN IF NOT EXISTS approximate_age TEXT 
CHECK (approximate_age IN ('kitten', 'adult', 'senior', 'unknown'));

-- Add notes column for health/behavior notes
ALTER TABLE public.cats 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add needs_attention flag for urgent cases
ALTER TABLE public.cats 
ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN DEFAULT false;

-- Add reported_by column to track who added the cat
ALTER TABLE public.cats 
ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES auth.users(id);

-- Create index for faster filtering by color and pattern
CREATE INDEX IF NOT EXISTS idx_cats_primary_color ON public.cats(primary_color);
CREATE INDEX IF NOT EXISTS idx_cats_pattern ON public.cats(pattern);
CREATE INDEX IF NOT EXISTS idx_cats_needs_attention ON public.cats(needs_attention) WHERE needs_attention = true;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
-- The existing color_profile array column is preserved for backwards compatibility.
-- New cats should use primary_color and pattern instead.
-- You can optionally migrate existing color_profile data:
--
-- UPDATE public.cats SET primary_color = 
--   CASE 
--     WHEN 'black' = ANY(color_profile) THEN 'black'
--     WHEN 'white' = ANY(color_profile) THEN 'white'
--     WHEN 'grey' = ANY(color_profile) OR 'gray' = ANY(color_profile) THEN 'grey'
--     WHEN 'brown' = ANY(color_profile) THEN 'brown'
--     WHEN 'orange' = ANY(color_profile) OR 'ginger' = ANY(color_profile) THEN 'orange'
--     WHEN 'cream' = ANY(color_profile) THEN 'cream'
--     ELSE 'mixed'
--   END
-- WHERE primary_color IS NULL AND color_profile IS NOT NULL;
-- =====================================================

