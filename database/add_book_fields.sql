-- Add new columns to books table for publish_date and description
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS publish_date text,
ADD COLUMN IF NOT EXISTS description text;
