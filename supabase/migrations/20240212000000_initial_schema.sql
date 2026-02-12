-- 1. Profiles Table
-- Extends the auth.users table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Daily Quotes Table
create table public.daily_quotes (
  id uuid default gen_random_uuid() primary key,
  quote text not null,
  author text,
  date date unique not null,
  category text,
  created_at timestamptz default now()
);

alter table public.daily_quotes enable row level security;

create policy "Daily quotes are viewable by everyone."
  on daily_quotes for select
  using ( true );

-- Only service role or admins should insert/update (omitting specific admin logic, assuming dashboard use)

-- 3. User Quotes Table
create table public.user_quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quote text not null,
  likes_count int default 0,
  created_at timestamptz default now()
);

alter table public.user_quotes enable row level security;

create policy "User quotes are viewable by everyone."
  on user_quotes for select
  using ( true );

create policy "Users can insert their own quotes."
  on user_quotes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own quotes."
  on user_quotes for delete
  using ( auth.uid() = user_id );

-- 4. Likes Table
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quote_id uuid references public.user_quotes(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, quote_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone."
  on likes for select
  using ( true );

create policy "Users can insert their own likes."
  on likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own likes."
  on likes for delete
  using ( auth.uid() = user_id );

-- Trigger to update likes_count
create or replace function public.handle_likes()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.user_quotes
    set likes_count = likes_count + 1
    where id = new.quote_id;
  elsif (TG_OP = 'DELETE') then
    update public.user_quotes
    set likes_count = likes_count - 1
    where id = old.quote_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.handle_likes();

-- 5. Reports Table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  quote_id uuid references public.user_quotes(id) not null,
  reason text,
  created_at timestamptz default now()
);

alter table public.reports enable row level security;

create policy "Users can insert reports."
  on reports for insert
  with check ( auth.uid() = user_id );

-- 6. RPC: Get Smart Feed
-- This function mimics a "smart feed" by returning quotes.
-- currently simply returns latest quotes, but accepts seed/limit/offset params as per frontend.
create or replace function get_smart_feed(
  p_user_id uuid,
  p_limit int,
  p_offset int,
  p_seed text
)
returns table (
  id uuid,
  quote text,
  user_id uuid,
  username text,
  avatar_url text,
  likes_count int,
  user_liked boolean,
  created_at timestamptz,
  is_owner boolean
)
language plpgsql
as $$
begin
  return query
  select
    uq.id,
    uq.quote,
    uq.user_id,
    p.username,
    p.avatar_url,
    uq.likes_count,
    exists(select 1 from likes l where l.quote_id = uq.id and l.user_id = p_user_id) as user_liked,
    uq.created_at,
    (uq.user_id = p_user_id) as is_owner
  from
    user_quotes uq
  join
    profiles p on uq.user_id = p.id
  order by
    -- Algoritmo de "Gravedad": (Likes + 1) / (HorasDesdePublicacion + 2)^1.8
    -- Prioriza contenido nuevo, pero contenido muy popular puede mantenerse visible más tiempo.
    (uq.likes_count + 1) / power( (extract(epoch from (now() - uq.created_at)) / 3600) + 2, 1.8 ) desc,
    uq.created_at desc
  limit
    p_limit
  offset
    p_offset;
end;
$$;
