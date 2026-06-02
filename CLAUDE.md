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
2. `app/response.tsx` — picks a **curated** response *synchronously* (`pickCurated`) so text is on screen at frame 0. It then, in the background: records the check-in to on-device history (`appendLocalLog`); if signed in, also backs it up to the account (`pushCheckIn`, append-only, best-effort); calls the AI (`fetchAiResponse`); and **only if** the AI returns within `AI_SWAP_WINDOW_MS` (2500ms) does it softly crossfade to the AI text.

**Never** add a loading spinner, block on the AI, delay the curated text, or stream tokens. If the AI is slow or fails, the curated text simply stands. The curated library in `src/emotions/catalog.ts` is therefore a first-class asset, not a placeholder.

There are **two** curated fallback layers, intentionally duplicated: the client `catalog.ts` (instant, offline-safe) and the Edge Function's own `CURATED` map (used when the AI is unset/fails/rejected so the function still returns HTTP 200). The function returns `source: "ai" | "curated" | "safety"`; the client only swaps when `source === "ai"` — a function-side curated reply is ignored because the client already shows one.

### Emotion catalog is the source of truth — and the three-file sync

`src/emotions/catalog.ts` defines `EmotionId` (a string-literal union) plus emoji, label, and curated responses, and **mirrors the README**. Emotion ids flow as route params (`/response?emotion=<id>`), into the Supabase `emotion` column, and into on-device history. Adding/renaming an emotion means updating this catalog **and** the Edge Function's `CURATED`, `EMOTION_GUIDANCE`, and `LABELS` maps (`supabase/functions/generate-support/index.ts`). These are separate files with no shared import and must be kept in sync by hand.

### Edge Function: three evaluated layers

`generate-support/index.ts` evaluates in order: (1) **safety pre-check** — crisis keywords in an optional `note` route to a fixed safety response and skip the AI (`note` is the only free text accepted and is used *only* for detection, never sent to the model); (2) **AI** — Groq, with the prompt built **entirely server-side**: `label` + guidance are derived from `emotionId` via the `LABELS` / `EMOTION_GUIDANCE` allowlists, so client free text never reaches the model (no LLM-proxy abuse) and an unknown id yields no AI call. `sanitizeAi()` then enforces the tone contract (strips emojis, rejects questions / banned motivational-poster phrases / anything over two sentences) and returns null on violation; (3) **curated fallback**. Tone rules live in the prompt *and* are re-enforced in `sanitizeAi` — change both together.

### Crisis-safety layer (wired but dormant)

The live, user-reachable safety path is `app/help.tsx` — region crisis resources (Malaysia + an international directory in `src/features/safety/resources.ts`), linked from the home-screen footer next to `app/privacy.tsx`. Separately, `src/features/safety/crisis.ts` mirrors the Edge Function's keyword list and safety response; that keyword *hook* is **dormant** because the app has no free-text input today (emotion taps only). The moment any text field is added (journaling, a "say more" box), call `screenForCrisis(text)` **before** sending anything to the AI and show the safety response instead of a normal reply. Going live with the hook also requires region-specific crisis-line text and dedicated resource-linking UI. Keep `crisis.ts` and the Edge Function's `CRISIS_PATTERNS`/`SAFETY_RESPONSE` in sync.

### Data layer & privacy posture

Emotion history is **local-first**. `src/lib/localHistory.ts` stores logs in AsyncStorage under an anon key (`silentsupport.history.v1`) when signed out, and a per-user key (`silentsupport.history.<uid>`) when signed in. The local store is always the source of truth the UI reads (`app/history.tsx`, `src/features/history/insights.ts`).

Accounts are **optional** (Model B) and use **email OTP** (a 6–8 digit code; no password, no magic-link/deep-link) via Supabase Auth. `src/features/auth/SessionProvider.tsx` exposes the session and triggers the sign-in sync. **Signed out → zero server contact.** Signed in → `emotion_logs` (now with `user_id`, ownership RLS `auth.uid() = user_id`, migration `0003`) is the backup/sync target.

Sync (`src/lib/sync.ts`) is deliberately minimal — **no reconciliation engine, no offline queue**:
- **On sign-in / app foreground** (`syncOnSignIn`): upsert device-local rows to the server (ignore-dupes by `id`), pull the account's rows into the per-uid cache, then clear the anon store.
- **Per check-in when signed in** (`pushCheckIn`): best-effort append-only insert.
- All writes (local and server) are fire-and-forget and **never throw** — comforting must not depend on storage or network.

RLS: `emotion_logs` has owner-scoped select/insert/update/delete for `authenticated`; **no anon policies** (signed-out clients have zero access). Destructive scopes: sign-out clears only the device cache; "Clear history" is device-only when signed out and account-wide (server delete) when signed in. Deferred to a later phase: `profiles` table and account deletion (`delete-account` function). See `memory/product-direction.md`.

### Insights are rule-based only

`src/features/history/insights.ts` produces at most two soft reflections (low-energy stretch, time-of-day lean, most-frequent feeling, presence count) using plain thresholds. Never medical, never a diagnosis, never scoring — it reads like a friend noticing a pattern. Keep the `LOW_ENERGY`/`HEAVY` id groupings in sync with the catalog.

### Comfort mode & theme

`app/comfort.tsx` + `src/features/comfort/` is the breathing/grounding screen. `useBreathing` runs a single step-runner that advances both the phase label and the circle's scale value together (native-driver), so the word read always matches the motion seen. Tap toggles "silence" (strips all text, leaves the breath).

All styling pulls from `src/theme` (`colors`, `typography`) — no hardcoded colors/sizes in components, extend the theme instead. Dark-mode only (`app.json` → `userInterfaceStyle: "dark"`).

## Product guardrails

This is a deliberately constrained solo-mode MVP. The AI is a calm presence, **not** a therapist/coach/chatbot: it validates first, stays short (1-2 sentences), gives no advice or questions, no emojis, no clinical language (enforced in both the Edge Function `SYSTEM_PROMPT` and `sanitizeAi`). No social features, messaging, notifications, gamification, or health-style charts/scoring. When adding features, default to the lower-friction, more private option.
