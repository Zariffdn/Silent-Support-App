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

The Supabase Edge Function (`supabase/functions/generate-support`) is Deno, deployed separately via the Supabase CLI. It's excluded from the app's TypeScript project (`tsconfig.json`), so don't expect `npm run typecheck` to cover it. Its `OPENAI_API_KEY` / `OPENAI_MODEL` live in Supabase function secrets, never in the app.

## Architecture

React Native + Expo (expo-router, file-based routing) on TypeScript strict. Supabase for the database; an OpenAI-backed Deno Edge Function for AI text.

### The non-negotiable response pattern (read before touching the response flow)

The product's core principle is **presence over intelligence** — see `memory/product-direction.md`. The flow when a user taps an emotion:

1. `app/index.tsx` — emotion grid, locks on first tap, pushes to `/response`.
2. `app/response.tsx` — picks a **curated** response *synchronously* (`pickCurated`) so text is on screen at frame 0. It then, in the background: logs the emotion (`insertEmotionLog`), calls the AI (`fetchAiResponse`), and **only if** the AI returns within `AI_SWAP_WINDOW_MS` (2500ms) does it softly crossfade to the AI text and upgrade the log row (`updateLogResponse`).

**Never** add a loading spinner, block on the AI, delay the curated text, or stream tokens. If the AI is slow or fails, the curated text simply stands. The curated library in `src/emotions/catalog.ts` is therefore a first-class asset, not a placeholder.

There are **two** curated fallback layers, intentionally duplicated: the client `catalog.ts` (instant, offline-safe) and the Edge Function's own `CURATED` map (used when OpenAI is unset/fails so the function still returns HTTP 200). The function returns `source: "ai" | "curated"`; the client only swaps when `source === "ai"` — a function-side curated reply is ignored because the client already shows one.

### Emotion catalog is the single source of truth

`src/emotions/catalog.ts` defines `EmotionId` (a string-literal union) plus emoji, label, and curated responses. Emotion ids flow as route params (`/response?emotion=<id>`) and into the DB `emotion` column. Adding/renaming an emotion means updating this catalog **and** the Edge Function's `CURATED` map (they're separate files and must be kept in sync).

### Data layer & security posture

`emotion_logs` (`supabase/migrations/0001_emotion_logs.sql`) has RLS enabled but, pre-auth, allows anon insert/update with `with check (true)`. Deliberate quirks to preserve:

- **No SELECT policy** — emotional data is never publicly readable. The history screen is a later milestone.
- `insertEmotionLog` generates the row UUID **client-side** and does a plain insert with **no `.select()`**, precisely because there's no read policy to return the row.
- All DB writes are fire-and-forget and **never throw** — comforting the user must not depend on the database being reachable.

This is tracked security debt: auth (Supabase Auth + RLS scoped to `auth.uid() = user_id`) must land **before** history reads, AI personalization, or any cross-session memory. See `memory/product-direction.md` for the full auth/privacy stance.

### Comfort mode

`app/comfort.tsx` + `src/features/comfort/` is the breathing/grounding screen. `useBreathing` runs a single step-runner that advances both the phase label and the circle's scale value together (native-driver), so the word read always matches the motion seen. Tap toggles "silence" (strips all text, leaves the breath).

### Theme

All styling pulls from `src/theme` (`colors`, `typography`). No hardcoded colors/sizes in components — extend the theme instead. The app is dark-mode only (`app.json` → `userInterfaceStyle: "dark"`).

## Product guardrails

This is a deliberately constrained solo-mode MVP. The AI is a calm presence, **not** a therapist/coach/chatbot: it validates, stays short (1-3 sentences), gives no advice or questions, no emojis, no clinical language (enforced in the Edge Function `SYSTEM_PROMPT`). No social features, messaging, notifications, gamification, or health-style charts/scoring. When adding features, default to the lower-friction, more private option.
