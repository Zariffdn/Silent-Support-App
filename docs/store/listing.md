# Silent Support — Store Listing Copy

Launch-ready store metadata. Copy is written to match the **current implementation** and the
in-app Privacy screen (`app/privacy.tsx`). Positioning is **a private emotional check-in
companion** — never therapy, treatment, diagnosis, or healthcare.

> **Character limits**
>
> | Field | Limit | Store |
> |---|---|---|
> | App name | 30 | Apple / Play |
> | Subtitle | 30 | Apple |
> | Promotional text | 170 | Apple |
> | Keywords field | 100 | Apple |
> | Short description | 80 | Play |
> | Full description | 4000 | Apple / Play |

---

## App name

**Silent Support** (matches `app.json` → `expo.name`)

## Subtitle (Apple, ≤30)

**`A private space to feel`** — 23 ✅ *(recommended)*

Alternatives:
- `Quiet check-ins, kept private` — 29
- `Check in. Breathe. Let go.` — 26
- `A calm place to check in` — 24

## Short description (Play, ≤80)

**`Tap how you feel and get a calm, private response. No accounts, no tracking.`** — 76 ✅

Alternative: `A quiet emotional check-in. One tap, a calm reply, and total privacy.` — 69

## Promotional text (Apple, ≤170 — updateable without review)

`Tap how you feel and receive a calm response in the same breath. No journaling, no chatbot, no tracking. A quiet companion that keeps everything private to you.` — 159 ✅

## Full description (≤4000)

```
Silent Support is a quiet place to check in with how you feel — no journaling, no pressure, no audience.

Tap a single emotion and receive a calm, supportive response in the same breath. Some moments call for a gentle line; others for a slow breath together. That's all it ever asks of you.

WHY IT FEELS DIFFERENT
• One tap — no need to explain, write, or justify how you feel.
• A calm response the instant you check in. No loading spinner, no chatbot, no back-and-forth.
• Comfort Mode: a simple breathing space for when words are too much, with optional ambient sound (ocean, rain, forest, brown noise, or gentle haptics).
• A gentle, private history, so you can look back without judgement.

PRIVATE BY DESIGN
• No ads. No tracking. No analytics. Ever.
• Works without an account — your check-ins are stored only on your phone.
• Optional free backup with just your email and a sign-in code (no passwords).
• Your check-ins are yours alone, locked to your account, and deletable anytime.
• To write a response, only the single emotion you tapped — and a coarse 1–3 sense of how much support to offer — is sent to our AI service. Your history, counts, dates, identity, and the reason behind a feeling never leave your phone.
• Silent Support never knows why you chose an emotion. Only the emotion itself is processed.

GENTLE, NOT CLINICAL
A companion for everyday feelings — not a coach, not a tracker that nags, not a service that scores you. No streaks, no badges, no guilt-trip notifications. Just a moment of calm, whenever you need one.

A KIND WORD WHEN IT'S HEAVY
If something is sitting heavy, support resources are always one tap away in the Help screen.

Silent Support is here for comfort, not medical care or therapy, and it can't replace a real person. If you're in danger or thinking about hurting yourself, please reach out to your local emergency services or a helpline.

Check in. Breathe. Let go.
```

## Keywords (Apple, ≤100 — comma-separated, no spaces, no app-name repeats)

```
mood,feelings,emotions,check-in,calm,breathe,journal,diary,selfcare,mindful,private,grounding,stress
```
— exactly 100 ✅

- Apple auto-combines single words into phrases ("mood journal", "private diary"); keep them single.
- Optional swaps by ranking: `wellbeing`, `journaling`, `reflect`, `quiet`, `vent`.
- **Do not** add brand terms (Calm, Headspace) or treatment terms (`therapy`, `depression`, `disorder`, `treatment`).

## Categories

- **Apple primary: Health & Fitness** — where users search for calm / mood / mindfulness apps; accepts non-clinical wellbeing apps.
- **Apple secondary: Lifestyle** — safe, non-medical fallback.
- **Avoid: Medical** — implies diagnosis/treatment and triggers heightened review.
- **Google Play:** Category **Health & Fitness**; self-care / mindfulness framing. Complete the Data Safety form (see checklist).

## Privacy positioning

**Headline:** *Private by design — no ads, no tracking, no analytics, and no account required.*

Accurate claims (consistent with `app/privacy.tsx`):
- No advertising, tracking, or analytics SDKs (verified — none in the codebase).
- Signed out: check-ins are stored only on the device; nothing about you is stored on our servers.
- The tapped emotion + a coarse 1–3 support level are sent to the AI provider to generate a
  response — **processed, not stored**; no history, identity, or reason is sent.
- Account is optional (email + one-time code, no passwords); account data is owner-locked at the
  database level and fully deletable in-app.
- Emotional data is never sold, shared, or used to profile.

**Do NOT claim:** "fully offline", "nothing ever leaves your device", or "no data collected" without
qualification (an account collects email + check-ins for functionality, and the AI call transmits the
tapped emotion). See the Privacy Label / Data Safety checklists for the exact label setup.

## Competitive positioning

**One-liner:** *Most apps want you to log, track, score, or chat. Silent Support just wants to be there — one tap, one calm breath, kept private.*

| Versus | They lean on | Silent Support's wedge |
|---|---|---|
| Mood trackers (Daylio, MoodNotes) | charts, scores, streaks, data entry | one tap; no scoring, no streaks, no pressure |
| Meditation apps (Calm, Headspace) | long sessions, subscriptions, libraries | instant in-the-moment comfort; no commitment |
| Journaling apps (Reflectly, Stoic) | writing prompts, daily entries | no writing required — feelings without words |
| AI wellness chatbots (Wysa, Woebot) | conversational, quasi-clinical framing | presence over intelligence; explicitly non-clinical |

**Three differentiators to repeat everywhere:**
1. Lowest possible friction — one tap, no account, no journaling.
2. Genuinely private — local-first, no tracking/ads/analytics, account optional, fully deletable.
3. Calm, not clinical — comfort and presence, never diagnosis, coaching, or gamified pressure.
