-- Contrakr Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('customer', 'contractor')),
  avatar_url text,
  location text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ============================================================
-- CONTRACTOR PROFILES
-- ============================================================
create table public.contractor_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  business_name text not null,
  owner_name text not null,
  bio text,
  logo_url text,
  categories text[] default '{}',
  service_areas text[] default '{}',
  years_experience integer,
  website text,
  license_number text,
  is_insured boolean default false,
  avg_rating numeric(3,2) default 0,
  total_reviews integer default 0,
  total_jobs_completed integer default 0,
  profile_completeness integer default 0,
  is_verified boolean default false,
  -- Granted manually after the license_number above is cross-checked
  -- against the state licensing board. Never auto-set from user input.
  is_licensed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contractor_profiles enable row level security;

create policy "Contractor profiles are publicly viewable" on public.contractor_profiles
  for select using (true);

create policy "Contractors can manage own profile" on public.contractor_profiles
  for all using (auth.uid() = user_id);

-- ============================================================
-- JOB POSTS
-- ============================================================
create table public.job_posts (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null,
  location text not null,
  budget_range text,
  timeline text,
  status text default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  photos text[] default '{}',
  bid_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_posts enable row level security;

create policy "Job posts are publicly viewable" on public.job_posts
  for select using (true);

create policy "Customers can manage own job posts" on public.job_posts
  for all using (auth.uid() = customer_id);

-- ============================================================
-- BIDS
-- ============================================================
create table public.bids (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.job_posts(id) on delete cascade not null,
  contractor_id uuid references public.contractor_profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  message text not null,
  timeline text,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_id, contractor_id)
);

alter table public.bids enable row level security;

create policy "Job owner and bidder can view bids" on public.bids
  for select using (
    auth.uid() = (select customer_id from public.job_posts where id = job_id)
    or auth.uid() = (select user_id from public.contractor_profiles where id = contractor_id)
  );

create policy "Contractors can create bids" on public.bids
  for insert with check (
    auth.uid() = (select user_id from public.contractor_profiles where id = contractor_id)
  );

create policy "Contractors can update own bids" on public.bids
  for update using (
    auth.uid() = (select user_id from public.contractor_profiles where id = contractor_id)
  );

-- ============================================================
-- FEED POSTS
-- ============================================================
create table public.feed_posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  author_role text not null check (author_role in ('customer', 'contractor')),
  content text not null,
  photos text[] default '{}',
  post_type text not null check (post_type in ('job_request', 'work_showcase', 'promotion', 'update')),
  category text,
  location text,
  job_id uuid references public.job_posts(id) on delete set null,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.feed_posts enable row level security;

create policy "Feed posts are publicly viewable" on public.feed_posts
  for select using (true);

create policy "Authenticated users can create feed posts" on public.feed_posts
  for insert with check (auth.uid() = author_id);

create policy "Authors can manage own posts" on public.feed_posts
  for all using (auth.uid() = author_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  contractor_id uuid references public.contractor_profiles(id) on delete cascade not null,
  job_id uuid references public.job_posts(id) on delete set null,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz default now(),
  unique(customer_id, contractor_id)
);

alter table public.conversations enable row level security;

create policy "Conversation participants can view" on public.conversations
  for select using (
    auth.uid() = customer_id
    or auth.uid() = (select user_id from public.contractor_profiles where id = contractor_id)
  );

create policy "Authenticated users can create conversations" on public.conversations
  for insert with check (
    auth.uid() = customer_id
    or auth.uid() = (select user_id from public.contractor_profiles where id = contractor_id)
  );

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Conversation participants can view messages" on public.messages
  for select using (
    auth.uid() in (
      select customer_id from public.conversations where id = conversation_id
      union
      select user_id from public.contractor_profiles cp
        join public.conversations c on c.contractor_id = cp.id
        where c.id = conversation_id
    )
  );

create policy "Authenticated users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.job_posts(id) on delete cascade not null unique,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  contractor_id uuid references public.contractor_profiles(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly viewable" on public.reviews
  for select using (true);

create policy "Job customers can leave reviews" on public.reviews
  for insert with check (
    auth.uid() = reviewer_id
    and auth.uid() = (select customer_id from public.job_posts where id = job_id)
    and (select status from public.job_posts where id = job_id) = 'completed'
  );

-- ============================================================
-- CONTRACTOR PHOTOS
-- ============================================================
create table public.contractor_photos (
  id uuid default uuid_generate_v4() primary key,
  contractor_id uuid references public.contractor_profiles(id) on delete cascade not null,
  url text not null,
  caption text,
  category text,
  created_at timestamptz default now()
);

alter table public.contractor_photos enable row level security;

create policy "Contractor photos are publicly viewable" on public.contractor_photos
  for select using (true);

create policy "Contractors can manage own photos" on public.contractor_photos
  for all using (
    auth.uid() = (select user_id from public.contractor_profiles where id = contractor_id)
  );

-- ============================================================
-- NOTIFICATIONS (future)
-- ============================================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  data jsonb default '{}',
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update contractor avg_rating when a review is inserted
create or replace function update_contractor_rating()
returns trigger as $$
begin
  update public.contractor_profiles
  set
    avg_rating = (
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where contractor_id = new.contractor_id
    ),
    total_reviews = (
      select count(*)
      from public.reviews
      where contractor_id = new.contractor_id
    )
  where id = new.contractor_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute function update_contractor_rating();

-- Auto-update bid_count on job_posts
create or replace function update_bid_count()
returns trigger as $$
begin
  update public.job_posts
  set bid_count = (
    select count(*) from public.bids where job_id = new.job_id
  )
  where id = new.job_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_bid_created
  after insert on public.bids
  for each row execute function update_bid_count();

-- Auto-create contractor profile completeness
create or replace function compute_profile_completeness(p_id uuid)
returns integer as $$
declare
  score integer := 0;
  rec record;
  phone_val text;
begin
  select * into rec from public.contractor_profiles where id = p_id;
  select phone into phone_val from public.profiles where id = rec.user_id;

  if rec.business_name is not null then score := score + 15; end if;
  if rec.owner_name is not null then score := score + 10; end if;
  if phone_val is not null then score := score + 15; end if;
  if rec.bio is not null and length(rec.bio) > 50 then score := score + 20; end if;
  if array_length(rec.categories, 1) > 0 then score := score + 20; end if;
  if array_length(rec.service_areas, 1) > 0 then score := score + 20; end if;
  return least(score, 100);
end;
$$ language plpgsql security definer;

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- ============================================================
-- Create bucket: job-photos (public)
-- Create bucket: profile-photos (public)
-- Create bucket: contractor-photos (public)
-- Create bucket: logos (public)
