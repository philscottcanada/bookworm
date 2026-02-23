-- Rename used_retail_value to user_sell_price in user_library table
ALTER TABLE public.user_library 
RENAME COLUMN used_retail_value TO user_sell_price;
