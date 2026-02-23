-- Create a table for public profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text unique,
  bio text,
  is_public boolean default false,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( is_public = true or auth.uid() = id );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for Books (Global catalog)
create table public.books (
  id uuid default gen_random_uuid() primary key,
  isbn text unique not null,
  title text not null,
  author text,
  genre text,
  image_url text,
  publish_date text,
  description text,
  is_manual boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.books enable row level security;

-- Policies for books
create policy "Books are viewable by everyone."
  on books for select
  using ( true );

create policy "Authenticated users can insert books."
  on books for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update books."
  on books for update
  using ( auth.role() = 'authenticated' );

-- Create a table for User's Library (Join table)
create table public.user_library (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  condition text, -- 'New', 'Good', 'Fair', 'Poor'
  purchase_price numeric,
  estimated_value numeric,
  retail_value numeric,
  user_sell_price numeric,
  is_public boolean default true,
  read_status text default 'Not Read', -- 'Not Read', 'Reading', 'Read'
  user_importance integer default 0,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, book_id)
);

-- Enable RLS
alter table public.user_library enable row level security;

-- Policies for user_library
create policy "Users can view their own library components."
  on user_library for select
  using ( auth.uid() = user_id );

create policy "Users can insert into their own library."
  on user_library for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own library."
  on user_library for update
  using ( auth.uid() = user_id );

create policy "Users can delete from their own library."
  on user_library for delete
  using ( auth.uid() = user_id );

-- Function to handle new user signup (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
