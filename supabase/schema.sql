-- ============================================================
-- Contrakr — database schema
--
-- Generated from the LIVE database on 2026-07-31 by dumping
-- information_schema + pg_catalog. This file is documentation:
-- Supabase never reads it. If you change the database with ad-hoc
-- SQL, update this file in the same session or it drifts again.
--
-- Known drift/cleanup items are listed at the bottom under NOTES.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES  (1:1 with auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('customer', 'contractor')),
  avatar_url text,
  location text,
  phone text,
  bio text,
  latitude numeric,               -- legacy, unused (see NOTES)
  longitude numeric,              -- legacy, unused (see NOTES)
  lat double precision,
  lng double precision,
  search_radius integer default 50,
  is_admin boolean default false,
  is_founder boolean default false,
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
  -- Granted manually after license_number is cross-checked against the
  -- state licensing board. Never auto-set from user input.
  is_licensed boolean default false,
  is_day_one boolean default false,
  latitude numeric,               -- legacy, unused (see NOTES)
  longitude numeric,              -- legacy, unused (see NOTES)
  lat double precision,
  lng double precision,
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
  status text default 'open'
    check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  photos text[] default '{}',
  bid_count integer default 0,
  customer_completed boolean default false,
  latitude numeric,               -- legacy, unused (see NOTES)
  longitude numeric,              -- legacy, unused (see NOTES)
  lat double precision,
  lng double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_posts enable row level security;

create policy "Job posts are publicly viewable" on public.job_posts
  for select using (true);

create policy "Customers can manage own job posts" on public.job_posts
  for all using (auth.uid() = customer_id);

create policy "Users can insert their own job posts" on public.job_posts
  for insert with check (auth.uid() = customer_id);

create policy "Users can update their own job posts" on public.job_posts
  for update using (auth.uid() = customer_id);

create policy "Users can delete their own job posts" on public.job_posts
  for delete using (auth.uid() = customer_id);

create policy "Admins can delete any job post" on public.job_posts
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ============================================================
-- BIDS
-- ============================================================
create table public.bids (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.job_posts(id) on delete cascade not null,
  contractor_id uuid references public.contractor_profiles(id) on delete cascade not null,
  amount numeric not null,
  message text not null,
  timeline text,
  status text default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  contractor_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (job_id, contractor_id)
);

alter table public.bids enable row level security;

create policy "Job owner and bidder can view bids" on public.bids
  for select using (
    auth.uid() = (select customer_id from public.job_posts where id = bids.job_id)
    or auth.uid() = (select user_id from public.contractor_profiles where id = bids.contractor_id)
  );

create policy "Contractors can create bids" on public.bids
  for insert with check (
    auth.uid() = (select user_id from public.contractor_profiles where id = bids.contractor_id)
  );

create policy "Contractors can update own bids" on public.bids
  for update using (
    auth.uid() = (select user_id from public.contractor_profiles where id = bids.contractor_id)
  );

create policy "Job owner can update bids on their job" on public.bids
  for update using (
    auth.uid() = (select customer_id from public.job_posts where id = bids.job_id)
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
  post_type text not null
    check (post_type in ('job_request', 'work_showcase', 'promotion', 'update')),
  category text,
  location text,
  job_id uuid references public.job_posts(id) on delete set null,
  likes_count integer default 0,
  comments_count integer default 0,
  latitude numeric,               -- legacy, unused (see NOTES)
  longitude numeric,              -- legacy, unused (see NOTES)
  lat double precision,
  lng double precision,
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

create policy "Users can update their own feed posts" on public.feed_posts
  for update using (auth.uid() = author_id);

create policy "Users can delete their own feed posts" on public.feed_posts
  for delete using (auth.uid() = author_id);

create policy "Admins can delete any feed post" on public.feed_posts
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ============================================================
-- COMMENTS  (on feed_posts — note: post_id has NO foreign key)
-- ============================================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid not null,          -- no FK in the live DB (see NOTES)
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments are publicly viewable" on public.comments
  for select using (true);

create policy "Anyone can read comments" on public.comments
  for select using (true);                      -- duplicate of the above

create policy "Authenticated users can comment" on public.comments
  for insert with check (auth.uid() = author_id);

create policy "Authenticated users can insert comments" on public.comments
  for insert with check (auth.uid() = author_id);   -- duplicate of the above

create policy "Authors can delete own comments" on public.comments
  for delete using (auth.uid() = author_id);

-- ============================================================
-- POST COMMENTS  (on job_posts — separate table from comments)
-- ============================================================
create table public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  job_post_id uuid references public.job_posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.post_comments enable row level security;

create policy "Comments are publicly viewable" on public.post_comments
  for select using (true);

create policy "Authenticated users can comment" on public.post_comments
  for insert with check (auth.uid() = author_id);

create policy "Authors can delete own comments" on public.post_comments
  for delete using (auth.uid() = author_id);

-- ============================================================
-- LIKES  (on feed_posts — note: post_id has NO foreign key)
-- ============================================================
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid not null,          -- no FK in the live DB (see NOTES)
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "Likes are publicly viewable" on public.likes
  for select using (true);

create policy "Anyone can read likes" on public.likes
  for select using (true);                      -- duplicate of the above

create policy "Authenticated users can like" on public.likes
  for all using (auth.uid() = user_id);

create policy "Authenticated users can insert likes" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Authenticated users can delete their own likes" on public.likes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- CONVERSATIONS  (job-scoped threads)
-- ============================================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  contractor_id uuid references public.contractor_profiles(id) on delete cascade not null,
  job_id uuid references public.job_posts(id) on delete set null,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz default now(),
  unique (customer_id, contractor_id)
);

alter table public.conversations enable row level security;

create policy "Conversation participants can view" on public.conversations
  for select using (
    auth.uid() = customer_id
    or auth.uid() = (select user_id from public.contractor_profiles where id = conversations.contractor_id)
  );

create policy "Authenticated users can create conversations" on public.conversations
  for insert with check (
    auth.uid() = customer_id
    or auth.uid() = (select user_id from public.contractor_profiles where id = conversations.contractor_id)
  );

-- ============================================================
-- MESSAGES  (inside conversations)
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
      select customer_id from public.conversations where id = messages.conversation_id
      union
      select cp.user_id from public.contractor_profiles cp
        join public.conversations c on c.contractor_id = cp.id
       where c.id = messages.conversation_id
    )
  );

create policy "Authenticated users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "Participants can mark messages read" on public.messages
  for update using (
    auth.uid() in (
      select customer_id from public.conversations where id = messages.conversation_id
      union
      select cp.user_id from public.contractor_profiles cp
        join public.conversations c on c.contractor_id = cp.id
       where c.id = messages.conversation_id
    )
  );

-- ============================================================
-- DIRECT CHATS  (person-to-person, not job-scoped)
-- ============================================================
create table public.direct_chats (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.direct_chats enable row level security;

create policy "Users can manage their direct chats" on public.direct_chats
  for all
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- ============================================================
-- DIRECT MESSAGES
-- ============================================================
create table public.direct_messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.direct_chats(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.direct_messages enable row level security;

create policy "Users can read messages in their chats" on public.direct_messages
  for select using (
    exists (
      select 1 from public.direct_chats dc
       where dc.id = direct_messages.chat_id
         and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
    )
  );

create policy "Users can send direct messages" on public.direct_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.direct_chats dc
       where dc.id = direct_messages.chat_id
         and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
    )
  );

create policy "Users can mark messages read" on public.direct_messages
  for update using (
    exists (
      select 1 from public.direct_chats dc
       where dc.id = direct_messages.chat_id
         and (dc.user1_id = auth.uid() or dc.user2_id = auth.uid())
    )
  );

-- Functionally the same as the policy above; both are live (see NOTES).
create policy "Participants can mark direct messages read" on public.direct_messages
  for update using (
    auth.uid() in (
      select user1_id from public.direct_chats where id = direct_messages.chat_id
      union
      select user2_id from public.direct_chats where id = direct_messages.chat_id
    )
  );

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.job_posts(id) on delete cascade unique not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  contractor_id uuid references public.contractor_profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are publicly viewable" on public.reviews
  for select using (true);

create policy "Job customers can leave reviews" on public.reviews
  for insert with check (
    auth.uid() = reviewer_id
    and auth.uid() = (select customer_id from public.job_posts where id = reviews.job_id)
    and (select status from public.job_posts where id = reviews.job_id) = 'completed'
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
    auth.uid() = (select user_id from public.contractor_profiles where id = contractor_photos.contractor_id)
  );

-- ============================================================
-- NOTIFICATIONS
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

create policy "System can insert notifications" on public.notifications
  for insert with check (true);

-- ============================================================
-- MODERATION — REPORTS
-- ============================================================
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  target_type text not null
    check (target_type in ('feed_post', 'job_post', 'profile', 'comment', 'message')),
  target_id uuid not null,
  reason text not null
    check (reason in ('spam', 'harassment', 'fake', 'scam', 'inappropriate', 'other')),
  details text,
  status text not null default 'open'
    check (status in ('open', 'actioned', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (reporter_id, target_type, target_id)
);

alter table public.reports enable row level security;

create policy "Users can file reports" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "Users can view own reports" on public.reports
  for select using (auth.uid() = reporter_id or public.is_admin());

create policy "Admins can review reports" on public.reports
  for update using (public.is_admin());

-- ============================================================
-- MODERATION — BLOCKS
-- One-directional and view-only: hides them from you, not you from them.
-- ============================================================
create table public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "Users can view own blocks" on public.blocks
  for select using (auth.uid() = blocker_id);

create policy "Users can create own blocks" on public.blocks
  for insert with check (auth.uid() = blocker_id);

create policy "Users can remove own blocks" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- One row per BROWSER, not per user — phone and laptop are separate rows,
-- and a notification should reach both.
-- ============================================================
create table public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can create own push subscriptions" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own push subscriptions" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Note: /api/notifications/email reads this table with the SERVICE ROLE key,
-- because it runs with no user session and these policies are scoped to
-- auth.uid(). That key bypasses RLS entirely — server-side only.

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Admin check used by the reports policies. SECURITY DEFINER so reading
-- profiles from inside a policy can't recurse through RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Recalculate a contractor's rating whenever a review lands.
create or replace function public.update_contractor_rating()
returns trigger
language plpgsql
security definer
as $$
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
$$;

-- Keep job_posts.bid_count in sync.
create or replace function public.update_bid_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.job_posts
  set bid_count = (
    select count(*) from public.bids where job_id = new.job_id
  )
  where id = new.job_id;
  return new;
end;
$$;

-- A job only completes when BOTH sides have confirmed. Fires from either
-- side's confirmation; whichever lands second closes the job.
create or replace function public.sync_job_completion()
returns trigger
language plpgsql
security definer
as $$
declare
  v_job_id uuid;
  v_status text;
  v_customer_done boolean;
  v_contractor_done boolean;
  v_contractor_id uuid;
begin
  if TG_TABLE_NAME = 'bids' then v_job_id := NEW.job_id; else v_job_id := NEW.id; end if;

  select status, customer_completed into v_status, v_customer_done
    from public.job_posts where id = v_job_id;
  if v_status = 'completed' then return NEW; end if;

  select b.contractor_completed, b.contractor_id into v_contractor_done, v_contractor_id
    from public.bids b where b.job_id = v_job_id and b.status = 'accepted' limit 1;

  if coalesce(v_customer_done, false) and coalesce(v_contractor_done, false) then
    update public.job_posts set status = 'completed' where id = v_job_id;
    update public.contractor_profiles
      set total_jobs_completed = total_jobs_completed + 1 where id = v_contractor_id;
  end if;
  return NEW;
end;
$$;

-- Profile completeness score shown on the contractor dashboard.
create or replace function public.compute_profile_completeness(p_id uuid)
returns integer
language plpgsql
security definer
as $$
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
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
create trigger on_bid_created
  after insert on public.bids
  for each row execute function public.update_bid_count();

create trigger sync_job_completion_from_bid
  after update on public.bids
  for each row execute function public.sync_job_completion();

create trigger sync_job_completion_from_job
  after update on public.job_posts
  for each row execute function public.sync_job_completion();

create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.update_contractor_rating();

-- Supabase Database Webhook → /api/notifications/email (sends via Resend).
-- Created through the Supabase dashboard, not by running this file.
-- The real x-webhook-secret is NOT stored here — it lives in the live
-- trigger definition and in the Vercel env vars. Never commit it.
--
-- create trigger "email-notifications"
--   after insert on public.notifications
--   for each row execute function supabase_functions.http_request(
--     'https://contrakr.com/api/notifications/email',
--     'POST',
--     '{"Content-type":"application/json","x-webhook-secret":"<REDACTED>"}',
--     '{}',
--     '5000'
--   );

-- ============================================================
-- NOTES — things that are true in the live DB and worth cleaning up
-- ============================================================
--
-- 1. DUPLICATE lat/lng COLUMNS. profiles, contractor_profiles, job_posts and
--    feed_posts each carry BOTH latitude/longitude (numeric) and lat/lng
--    (double precision). The app reads lat/lng only; latitude/longitude are
--    dead columns from an earlier pass. Safe to drop after confirming no rows
--    depend on them.
--
-- 2. TWO COMMENT TABLES. `comments` (feed posts) and `post_comments`
--    (job posts) both exist and both have policies. The app uses `comments`.
--
-- 3. MISSING FOREIGN KEYS. comments.post_id and likes.post_id are plain uuid
--    columns with no FK to feed_posts, so deleting a feed post leaves its
--    comments and likes orphaned. Adding the FKs with ON DELETE CASCADE would
--    fix that, but it will fail until any existing orphan rows are cleared.
--
-- 4. REDUNDANT POLICIES. Accumulated from ad-hoc SQL over time:
--      comments  — "Comments are publicly viewable" / "Anyone can read comments"
--      comments  — "Authenticated users can comment" / "...can insert comments"
--      likes     — "Likes are publicly viewable" / "Anyone can read likes"
--      likes     — "Authenticated users can like" (FOR ALL) overlaps the
--                  separate insert/delete policies
--      direct_messages — two UPDATE policies with equivalent logic
--    Policies are OR'd together, so duplicates are harmless, just noise.
--
-- 5. NO INDEXES beyond primary keys and unique constraints. Fine at current
--    scale. The first ones worth adding when it slows down: feed_posts
--    (created_at desc), job_posts (status, created_at desc), likes (post_id),
--    comments (post_id), direct_messages (chat_id, created_at).
--
-- 6. POLICIES TARGET `public`, not `authenticated`. auth.uid() returns null
--    for anonymous requests so the checks still hold, but scoping them to the
--    authenticated role would be tighter.
