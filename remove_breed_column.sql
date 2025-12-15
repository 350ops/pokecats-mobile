-- Remove the unused 'breed' column from the cats table
-- The app uses color_profile and pattern fields instead

ALTER TABLE cats DROP COLUMN IF EXISTS breed;
