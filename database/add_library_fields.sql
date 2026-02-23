-- Add new columns to user_library table for retail values and public visibility
ALTER TABLE public.user_library 
ADD COLUMN IF NOT EXISTS retail_value numeric,
ADD COLUMN IF NOT EXISTS used_retail_value numeric,
ADD COLUMN IF NOT EXISTS is_public boolean default true;
