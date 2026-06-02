-- Day 7: add ownership to emotion_logs and restore writes under per-user RLS.
-- The table is empty (Day 6 purge), so enforcing NOT NULL is safe. This replaces
-- the Day-6 no-policy lock with owner-scoped policies (auth.uid() = user_id).

alter table public.emotion_logs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.emotion_logs
  alter column user_id set default auth.uid();

alter table public.emotion_logs
  alter column user_id set not null;

create index if not exists emotion_logs_user_created_idx
  on public.emotion_logs (user_id, created_at desc);

drop policy if exists "owner can select emotion logs" on public.emotion_logs;
create policy "owner can select emotion logs" on public.emotion_logs
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "owner can insert emotion logs" on public.emotion_logs;
create policy "owner can insert emotion logs" on public.emotion_logs
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "owner can update emotion logs" on public.emotion_logs;
create policy "owner can update emotion logs" on public.emotion_logs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "owner can delete emotion logs" on public.emotion_logs;
create policy "owner can delete emotion logs" on public.emotion_logs
  for delete to authenticated using (user_id = auth.uid());
