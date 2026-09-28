# Silent Support — Screenshot Plan

Six portrait screenshots (dark theme — `#0E0F1A` canvas, Literata headlines mirroring the in-app
typography). Each panel pairs a real screen with one short overlay headline + subheadline. Keep
overlays calm and claim-free: companion, never therapy/treatment/diagnosis.

**Visual system (all panels)**
- Background: app canvas `#0E0F1A`; ink `#ECE7DC` (primary), `#7E7B88` (muted).
- Headline: Literata Light, large, top third. Subheadline: Literata, muted, directly beneath.
- Show the real device frame; avoid clutter, avoid fake data that implies distress severity.
- No accent colour: the only "colour" is the app's soft moon light (`#C9D4F0` at low opacity) under a feeling — no gradients, no chips, no emoji.

---

## 1. The check-in grid (hero)
- **Purpose:** show the core action instantly — tap a feeling, nothing to type.
- **Headline:** How are you feeling?
- **Subheadline:** No need to explain. Just choose.
- **Composition:** Home screen (`app/index.tsx`) with the field of eight words centered, one resting
  in its pool of light; headline overlaid above the field. Calm, generous spacing. This is the first impression — lead with it.

## 2. The calm response
- **Purpose:** show that comfort arrives the moment you tap — presence, not a chatbot.
- **Headline:** A calm reply, the moment you tap.
- **Subheadline:** Presence, not a chatbot.
- **Composition:** Response screen (`app/response.tsx`) showing a gentle, multi-line response with
  the emotion echo at top. Use a neutral feeling (e.g. "Overthinking") so it doesn't imply crisis.

## 3. Comfort Mode (breathing)
- **Purpose:** show the breathing space for when words are too much.
- **Headline:** Breathe, when words are too much.
- **Subheadline:** A quiet space, with optional ambient sound.
- **Composition:** Comfort Mode (`app/comfort.tsx`) mid-breath, the circle expanded, phase word
  ("Breathe in") visible. Dark and still.

## 4. Privacy
- **Purpose:** make the privacy promise unmissable — the key differentiator.
- **Headline:** Your check-ins stay on your phone.
- **Subheadline:** No ads. No tracking. No account needed.
- **Composition:** Stylized lock / device motif, or the Privacy screen header. Keep it textual and
  trustworthy, not techy. (Wording matches the in-app Privacy screen.)

## 5. Gentle history
- **Purpose:** show the private look-back without implying analytics or scoring.
- **Headline:** Look back, gently.
- **Subheadline:** A private record, just for you.
- **Composition:** History screen (`app/history.tsx`) with two reflection sentences and a few days of
  check-ins (feeling + part of day). Include the bottom line "Kept only on this phone." in-frame if
  it reads cleanly.

## 6. Help is always there
- **Purpose:** reassure that support resources are one tap away (non-clinical framing).
- **Headline:** Help is always one tap away.
- **Subheadline:** Support resources, whenever it's heavy.
- **Composition:** Help screen (`app/help.tsx`) showing the list of lines. Do not imply the app detects
  or diagnoses crisis — frame as always-available resources.

---

## Optional closing card
- **Headline:** Check in. Breathe. Let go.
- **Composition:** Wordmark on the dark canvas, maximal whitespace.

## Production notes
- Required sizes — Apple: 6.7" (1290×2796) and 6.5"/5.5" as needed; iPad 12.9" if `supportsTablet`
  stays true (it is, in `app.json`). Play: phone (min 2), 7" and 10" tablet recommended, plus a
  1024×500 feature graphic.
- Localize headlines if/when the listing is localized.
- Avoid before/after "mood improvement" claims or anything implying treatment outcomes.
