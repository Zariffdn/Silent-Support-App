-- Day 2: the emotion logging table.
-- NOTE (security debt): Day 2 has no auth yet, so the policies below allow the
-- anonymous (publishable-key) role to insert and update freely. Day 3 will add
-- Supabase Auth and scope these rows to auth.uid(). Reads are intentionally NOT
-- granted yet — the history screen is a later day.

create table if not exists public.emotion_logs (
  id              uuid primary key default gen_random_uuid(),
  emotion         text not null,
  response_text   text,
  response_source text check (response_source in ('ai', 'curated')),
  created_at      timestamptz not null default now()
);

alter table public.emotion_logs enable row level security;

drop policy if exists "anon can insert emotion logs" on public.emotion_logs;
create policy "anon can insert emotion logs"
  on public.emotion_logs
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon can update emotion logs" on public.emotion_logs;
create policy "anon can update emotion logs"
  on public.emotion_logs
  for update
  to anon, authenticated
  using (true)
  with check (true);
