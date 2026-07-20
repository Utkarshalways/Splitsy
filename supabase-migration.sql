-- ============================================================
-- Splitsy — Supabase Database Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. USERS TABLE
-- Synced from Clerk via webhook on user.created / user.updated
create table if not exists public.users (
  clerk_id  text primary key,
  email     text not null unique,
  full_name text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "Users are viewable by authenticated users" on public.users;
create policy "Users are viewable by authenticated users"
  on public.users for select
  to authenticated
  using (true);

-- Only the webhook (service role) inserts/updates users
-- No insert/update/delete policies for anon/authenticated

-- 2. FRIENDS TABLE
-- Bidirectional: when A adds B, insert TWO rows (A→B and B→A)
create table if not exists public.friends (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public.users(clerk_id) on delete cascade,
  friend_id  text not null references public.users(clerk_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id)
);

alter table public.friends enable row level security;

drop policy if exists "Users can view their own friends" on public.friends;
create policy "Users can view their own friends"
  on public.friends for select
  to authenticated
  using (user_id = auth.jwt() ->> 'sub');

drop policy if exists "Users can add friends" on public.friends;
create policy "Users can add friends"
  on public.friends for insert
  to authenticated
  with check (user_id = auth.jwt() ->> 'sub');

drop policy if exists "Users can remove their own friends" on public.friends;
create policy "Users can remove their own friends"
  on public.friends for delete
  to authenticated
  using (user_id = auth.jwt() ->> 'sub');

-- 3. TRANSACTIONS TABLE
-- Each expense/bill created by a user
-- NOTE: Do NOT create the SELECT policy here — it references public.splits,
-- which must exist first (see section 5).
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  creator_id  text not null references public.users(clerk_id) on delete cascade,
  amount      numeric(12, 2) not null check (amount > 0),
  description text not null default '',
  category    text not null default 'general',
  created_at  timestamptz not null default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users can create transactions" on public.transactions;
create policy "Users can create transactions"
  on public.transactions for insert
  to authenticated
  with check (creator_id = auth.jwt() ->> 'sub');

drop policy if exists "Creators can update their transactions" on public.transactions;
create policy "Creators can update their transactions"
  on public.transactions for update
  to authenticated
  using (creator_id = auth.jwt() ->> 'sub');

drop policy if exists "Creators can delete their transactions" on public.transactions;
create policy "Creators can delete their transactions"
  on public.transactions for delete
  to authenticated
  using (creator_id = auth.jwt() ->> 'sub');

-- 4. SPLITS TABLE
-- Each row = one person's share of a transaction
create table if not exists public.splits (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references public.transactions(id) on delete cascade,
  user_id         text not null references public.users(clerk_id) on delete cascade,
  amount_owed     numeric(12, 2) not null check (amount_owed >= 0),
  is_paid         boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.splits enable row level security;

drop policy if exists "Users can view their own splits" on public.splits;
create policy "Users can view their own splits"
  on public.splits for select
  to authenticated
  using (
    user_id = auth.jwt() ->> 'sub'
    or transaction_id in (
      select id from public.transactions
      where creator_id = auth.jwt() ->> 'sub'
    )
  );

drop policy if exists "Transaction creators can insert splits" on public.splits;
create policy "Transaction creators can insert splits"
  on public.splits for insert
  to authenticated
  with check (
    transaction_id in (
      select id from public.transactions
      where creator_id = auth.jwt() ->> 'sub'
    )
  );

drop policy if exists "Split owners can update their splits (mark paid)" on public.splits;
create policy "Split owners can update their splits (mark paid)"
  on public.splits for update
  to authenticated
  using (
    user_id = auth.jwt() ->> 'sub'
    or transaction_id in (
      select id from public.transactions
      where creator_id = auth.jwt() ->> 'sub'
    )
  );

-- 5. TRANSACTIONS SELECT POLICY (after splits exists)
drop policy if exists "Users can view relevant transactions" on public.transactions;
create policy "Users can view relevant transactions"
  on public.transactions for select
  to authenticated
  using (
    creator_id = auth.jwt() ->> 'sub'
    or id in (
      select transaction_id from public.splits
      where user_id = auth.jwt() ->> 'sub'
    )
  );

-- 6. INDEXES
create index if not exists idx_friends_user_id on public.friends(user_id);
create index if not exists idx_friends_friend_id on public.friends(friend_id);
create index if not exists idx_transactions_creator_id on public.transactions(creator_id);
create index if not exists idx_splits_transaction_id on public.splits(transaction_id);
create index if not exists idx_splits_user_id on public.splits(user_id);
create index if not exists idx_splits_is_paid on public.splits(is_paid);

-- 7. ENABLE REALTIME (for Phase 3)
-- Idempotent: only add if not already in the publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'splits'
  ) then
    alter publication supabase_realtime add table public.splits;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;
end $$;
