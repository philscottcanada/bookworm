-- Add is_manual flag to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS is_manual boolean default false;
