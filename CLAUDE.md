# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start the Expo dev server (Metro)
npm run android    # Start + open on Android
npm run ios        # Start + open on iOS
npm run typecheck  # tsc --noEmit — the only check in this repo (no tests, no linter yet)
```

There is no test runner or linter configured. `npm run typecheck` is the gate before committing.

Environment: copy `.env.example` to `.env.local` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. `src/lib/env.ts` throws at startup if either is missing. The `EXPO_PUBLIC_` prefix means these are bundled into the client — only ever the anon/publishable key here, never a service key.

The Supabase Edge Function (`supabase/functions/generate-support`) is Deno, deployed separately via the Supabase CLI. It's excluded from the app's TypeScript project (`tsconfig.json`), so `npm run typecheck` does **not** cover it. Its secrets (`GROQ_API_KEY`, optional `GROQ_MODEL`) live in Supabase function secrets, never in the app.

## Architecture

React Native + Expo (expo-router, file-based routing) on TypeScript strict. Supabase for the database; a Groq-backed (OpenAI-compatible) Deno Edge Function for AI text. Screens live in `app/` (`index` → `response` → `comfort`, plus `history`); reusable logic in `src/`.

### The non-negotiable response pattern (read before touching the response flow)

The product's core principle is **presence over intelligence** — see `memory/product-direction.md`. The flow when a user taps an emotion:

1. `app/index.tsx` — emotion grid, locks on first tap, pushes to `/response`.
2. `app/response.tsx` — computes a **strength level** (see below) *synchronously*, then picks a **curated** response at that level *synchronously* (`pickCurated(emotion, strength)`, deterministic-by-day within the level, not random) so text is on screen at frame 0, and renders it by splitting on blank lines into spaced layers. It then, in the background: records the check-in to on-device history (`appendLocalLog`); if signed in, also backs it up to the account (`pushCheckIn`, append-only, best-effort); calls the AI (`fetchAiResponse(emotion, strength)`); and **only if** the AI returns within `AI_SWAP_WINDOW_MS` (2500ms) does it softly crossfade to the AI text. Aliveness comes from structure/spacing, never animation or streaming.

**Never** add a loading spinner, block on the AI, delay the curated text, or stream tokens. If the AI is slow or fails, the curated text simply stands. The curated library in `src/emotions/catalog.ts` is therefore a first-class asset, not a placeholder.

### Response Strength System (Day 11A) — adaptive depth, never surfaced

`src/features/history/strength.ts` (`computeStrength`) derives a coarse depth level (`Strength = 1 | 2 | 3`) from **recent on-device history only** (a 7-day window) — no profiles, no text input, no memory beyond the local log. Level 1 = *gentle acknowledgement* (infrequent/stable/first-in-a-while; light, does not assume distress); Level 2 = *supportive presence* (the same feeling recurring, or difficult check-ins clustering; acknowledges persistence); Level 3 = *deep support* (a genuinely heavy week — repeated difficult emotions across several distinct days). Three emotion categories behave differently: **difficult** ids climb the full ladder; **positive** ids (`happy`, `grateful`, `calm`, `hopeful`, `proud`, `excited` — not in the catalog yet, capped defensively) are **never** Level 3 (L1 = normal positive acknowledgement, L2 = celebration of consistency); **reaching-out / neutral** ids (`need-comfort`, `need-encouragement`) are capped at Level 2. Thresholds are tuned so a typical user lands roughly L1 ≈ 70% / L2 ≈ 25% / L3 ≈ 5% — Level 3 is intentionally hard to reach. Keep the `DIFFICULT` / `POSITIVE` id lists in sync with the catalog.

The level **must NEVER be shown to the user** — surfacing it would read as surveillance/diagnosis. It only shapes depth: the catalog stores curated responses per level (`CuratedByLevel`: `gentle` / `supportive` / `deep`), selected synchronously by `pickCurated(emotion, strength)`. Because scoring must run at frame 0 before AsyncStorage resolves, `localHistory.ts` keeps an in-memory sync mirror (`getCachedLogsSync`); a cold cache safely yields Level 1. The current check-in is counted as a synthetic +1 when scoring. The client also passes the coarse integer to `fetchAiResponse`/the Edge Function, but the function does **not** branch on it yet — depth-aware AI prompting is a deferred later phase; today only the curated layer adapts.

There are **two** curated fallback layers, intentionally duplicated: the client `catalog.ts` (instant, offline-safe) and the Edge Function's own `CURATED` map (used when the AI is unset/fails/rejected so the function still returns HTTP 200). The function returns `source: "ai" | "curated" | "safety"`; the client only swaps when `source === "ai"` — a function-side curated reply is ignored because the client already shows one.

### Emotion Memory (Day 11C) — one soft pattern aside, derived, never stored

`src/features/history/memory.ts` (`deriveMemory`) returns **at most one** abstract "memory" phrase (or `null` — silence is the default) acknowledging a *pattern*, never what a feeling was about. It reads the same recent on-device log as `computeStrength` (via `getCachedLogsSync`, current check-in appended), is shown as a dim italic "whisper" line above the emotion echo in `app/response.tsx`, and is **never sent to the AI or server** — nothing new is stored (it's derived from existing `{emotion, createdAt}`). Five signals, selected by tone priority: `eased` (this feeling less frequent than the prior fortnight; suppressed for positive ids) → `returning` (reappears after a >14-day gap) → `consistent` (≥5 distinct check-in days in 10) → `varied` (≥4 distinct emotions in the week) → `balanced` (no single feeling ≥50% of recent check-ins). Recurrence of a *single* emotion is deliberately **not** a memory signal — the strength system already deepens the response for that; doubling it would read as observant rather than present. Safeguards: ≥5 total check-ins, suppressed at Strength Level 3, at most once per local day (first check-in only). Keep the `POSITIVE` list in sync with the catalog.

### Emotion catalog is the source of truth — and the three-file sync

`src/emotions/catalog.ts` defines `EmotionId` (a string-literal union) plus emoji, label, and curated responses, and **mirrors the README**. Emotion ids flow as route params (`/response?emotion=<id>`), into the Supabase `emotion` column, and into on-device history. Adding/renaming an emotion means updating this catalog **and** the Edge Function's `CURATED`, `EMOTION_GUIDANCE`, and `LABELS` maps (`supabase/functions/generate-support/index.ts`). These are separate files with no shared import and must be kept in sync by hand.

### Edge Function: three evaluated layers

`generate-support/index.ts` evaluates in order: (1) **safety pre-check** — crisis keywords in an optional `note` route to a fixed safety response and skip the AI (`note` is the only free text accepted and is used *only* for detection, never sent to the model); (2) **AI (Response Engine V2)** — Groq returns a **four-layer structured response** (grounding → recognition → reframing → gentle optional guidance + soft close), layers separated by a blank line, tone tuned per emotion. The prompt is built **entirely server-side**: `label` + tuning are derived from `emotionId` via the `LABELS` / `EMOTION_GUIDANCE` allowlists, so client free text never reaches the model (no LLM-proxy abuse) and an unknown id yields no AI call. `sanitizeAi()` then enforces the tone contract (strips emojis; rejects questions, exclamation marks, banned motivational-poster phrases, or anything over ~800 chars; **preserves the `\n\n` layer breaks**) and returns null on violation; (3) **curated fallback**. Tone rules live in the prompt *and* are re-enforced in `sanitizeAi` — change both together. The client splits the response on blank lines and renders each layer with spacing.

### Crisis-safety layer (wired but dormant)

The live, user-reachable safety path is `app/help.tsx` — region crisis resources (Malaysia + an international directory in `src/features/safety/resources.ts`), linked from the home-screen footer next to `app/privacy.tsx`. Separately, `src/features/safety/crisis.ts` mirrors the Edge Function's keyword list and safety response; that keyword *hook* is **dormant** because the app has no free-text input today (emotion taps only). The moment any text field is added (journaling, a "say more" box), call `screenForCrisis(text)` **before** sending anything to the AI and show the safety response instead of a normal reply. Going live with the hook also requires region-specific crisis-line text and dedicated resource-linking UI. Keep `crisis.ts` and the Edge Function's `CRISIS_PATTERNS`/`SAFETY_RESPONSE` in sync.

### Data layer & privacy posture

Emotion history is **local-first**. `src/lib/localHistory.ts` stores logs in AsyncStorage under an anon key (`silentsupport.history.v1`) when signed out, and a per-user key (`silentsupport.history.<uid>`) when signed in. The local store is always the source of truth the UI reads (`app/history.tsx`, `src/features/history/insights.ts`).

Accounts are **optional** (Model B) and use **email OTP** (a 6–8 digit code; no password, no magic-link/deep-link) via Supabase Auth. `src/features/auth/SessionProvider.tsx` exposes the session and triggers the sign-in sync. **Signed out → zero server contact.** Signed in → `emotion_logs` (now with `user_id`, ownership RLS `auth.uid() = user_id`, migration `0003`) is the backup/sync target.

Sync (`src/lib/sync.ts`) is deliberately minimal — **no reconciliation engine, no offline queue**:
- **On sign-in / app foreground** (`syncOnSignIn`): upsert device-local rows to the server (ignore-dupes by `id`), pull the account's rows into the per-uid cache, then clear the anon store.
- **Per check-in when signed in** (`pushCheckIn`): best-effort append-only insert.
- All writes (local and server) are fire-and-forget and **never throw** — comforting must not depend on storage or network.

RLS: `emotion_logs` has owner-scoped select/insert/update/delete for `authenticated`; **no anon policies** (signed-out clients have zero access). Destructive scopes: sign-out clears only the device cache; "Clear history" is device-only when signed out and account-wide (server delete) when signed in. Account deletion is implemented: **Settings → Account → Delete account** calls the `delete-account` Edge Function (Verify-JWT on; identifies the caller via `getUser`, then service-role `admin.deleteUser`), which cascades to `emotion_logs`; the client then clears local caches and signs out. Deferred to a later phase: the `profiles` table. See `memory/product-direction.md`.

### Insights are rule-based only

`src/features/history/insights.ts` produces at most two soft reflections (low-energy stretch, time-of-day lean, most-frequent feeling, presence count) using plain thresholds. Never medical, never a diagnosis, never scoring — it reads like a friend noticing a pattern. Keep the `LOW_ENERGY`/`HEAVY` id groupings in sync with the catalog.

### Comfort mode & theme

`app/comfort.tsx` + `src/features/comfort/` is the breathing/grounding screen. `useBreathing` runs a single step-runner that advances both the phase label and the circle's scale value together (native-driver), so the word read always matches the motion seen. Tap toggles "silence" (strips all text, leaves the breath).

All styling pulls from `src/theme` (`colors`, `typography`) — no hardcoded colors/sizes in components, extend the theme instead. Dark-mode only (`app.json` → `userInterfaceStyle: "dark"`).

## Product guardrails

This is a deliberately constrained solo-mode MVP. The AI is a calm presence, **not** a therapist/coach/chatbot. Since **Response Engine V2** it answers as a **four-layer structured presence** (grounding → recognition → reframing → gentle *optional* guidance), tone-tuned per emotion — calm, no questions, no exclamation marks, no emojis, no clinical language (enforced in both the Edge Function `SYSTEM_PROMPT` and `sanitizeAi`). Curated responses follow the same four-layer shape and are the instant, offline default. No social features, messaging, notifications, gamification, or health-style charts/scoring. When adding features, default to the lower-friction, more private option.
