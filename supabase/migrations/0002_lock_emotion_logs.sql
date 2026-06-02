-- Day 6: lock down emotion_logs. Server writes are DISABLED until auth (Day 7).
--
-- The app no longer writes to this table (history is on-device only). We drop
-- the open anonymous write policies and purge any existing rows so that no
-- ownerless emotional data accumulates before user_id / auth.uid() exist.
--
-- RLS remains enabled with NO policies => anon and authenticated roles have no
-- access of any kind. The table is intentionally kept (empty) so Day 7 can:
--   - add a user_id column
--   - restore writes
--   - add ownership-based RLS (auth.uid() = user_id)

drop policy if exists "anon can insert emotion logs" on public.emotion_logs;
drop policy if exists "anon can update emotion logs" on public.emotion_logs;

delete from public.emotion_logs;
