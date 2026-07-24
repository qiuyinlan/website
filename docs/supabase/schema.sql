create extension if not exists "pgcrypto";

create table if not exists public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  completed_on date not null,
  completed_at timestamptz not null default now(),
  unique (user_id, habit_id, completed_on)
);

create table if not exists public.user_mainlines (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_principles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_interests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_score_rules (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_donelist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_orchard_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_donelist_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_date)
);

create table if not exists public.user_weekly_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  review_key text not null check (char_length(btrim(review_key)) > 0),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, review_key)
);

create table if not exists public.user_monthly_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  review_key text not null check (char_length(btrim(review_key)) > 0),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, review_key)
);

alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.user_mainlines enable row level security;
alter table public.user_principles enable row level security;
alter table public.user_interests enable row level security;
alter table public.user_score_rules enable row level security;
alter table public.user_donelist enable row level security;
alter table public.user_orchard_state enable row level security;
alter table public.user_donelist_entries enable row level security;
alter table public.user_weekly_reviews enable row level security;
alter table public.user_monthly_reviews enable row level security;

drop policy if exists "users_manage_own_habits" on public.habits;
create policy "users_manage_own_habits"
on public.habits
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_completions" on public.habit_completions;
create policy "users_manage_own_completions"
on public.habit_completions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_mainlines" on public.user_mainlines;
create policy "users_manage_own_mainlines"
on public.user_mainlines
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_principles" on public.user_principles;
create policy "users_manage_own_principles"
on public.user_principles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_interests" on public.user_interests;
create policy "users_manage_own_interests"
on public.user_interests
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_score_rules" on public.user_score_rules;
create policy "users_manage_own_score_rules"
on public.user_score_rules
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_donelist" on public.user_donelist;
create policy "users_manage_own_donelist"
on public.user_donelist
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_orchard_state" on public.user_orchard_state;
create policy "users_manage_own_orchard_state"
on public.user_orchard_state
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_donelist_entries" on public.user_donelist_entries;
create policy "users_manage_own_donelist_entries"
on public.user_donelist_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_weekly_reviews" on public.user_weekly_reviews;
create policy "users_manage_own_weekly_reviews"
on public.user_weekly_reviews
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_monthly_reviews" on public.user_monthly_reviews;
create policy "users_manage_own_monthly_reviews"
on public.user_monthly_reviews
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
