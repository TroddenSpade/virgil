-- Virgil study sync
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- Each signed-in user owns exactly one row containing the whole study
-- document: learned chapters, hand-saved and known words, and review history.
-- Row-level security makes the public anon key safe to ship in the web bundle:
-- clients can only read and write their own row.

create table if not exists public.virgil_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.virgil_progress enable row level security;

drop policy if exists "virgil_progress_select_own" on public.virgil_progress;
create policy "virgil_progress_select_own"
  on public.virgil_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "virgil_progress_insert_own" on public.virgil_progress;
create policy "virgil_progress_insert_own"
  on public.virgil_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "virgil_progress_update_own" on public.virgil_progress;
create policy "virgil_progress_update_own"
  on public.virgil_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "virgil_progress_delete_own" on public.virgil_progress;
create policy "virgil_progress_delete_own"
  on public.virgil_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Keep updated_at accurate even if a client forgets to send it.
create or replace function public.touch_virgil_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists virgil_progress_touch_updated_at on public.virgil_progress;
create trigger virgil_progress_touch_updated_at
  before update on public.virgil_progress
  for each row
  execute function public.touch_virgil_progress_updated_at();
