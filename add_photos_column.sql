ALTER TABLE public.cats ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
