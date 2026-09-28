# Silent Support — Submission & Compliance Checklists

Pre-launch checklists for both stores plus the privacy, data-safety, deletion, crisis, and email
verifications. Boxes are unchecked; tick as completed. Items marked **⚠ BLOCKER** must be resolved
before a build can be submitted.

---

## App Store (Apple) submission checklist

- [ ] **⚠ Set `ios.bundleIdentifier`** in `app.json` — currently missing.
- [ ] **⚠ Bump `expo.version`** from `0.1.0` to a launch version (e.g. `1.0.0`) and set `ios.buildNumber`.
- [ ] App name "Silent Support" available / not trademark-conflicting in App Store Connect.
- [ ] Subtitle, promotional text, keywords, description pasted from `listing.md` (within limits).
- [ ] Primary category **Health & Fitness**, secondary **Lifestyle**. Not **Medical**.
- [ ] Age rating questionnaire completed (no objectionable content; mental-wellbeing context is
      not medical — answer truthfully, expect 4+ / 12+).
- [ ] Screenshots uploaded per `screenshots.md` (6.7" required; iPad 12.9" since `supportsTablet: true`).
- [ ] App icon present (`assets/ios_icon.png`) and 1024×1024 marketing icon uploaded.
- [ ] Support URL and marketing URL set; support email reachable (`zariffdanial1@gmail.com`).
- [ ] Privacy Policy URL reachable (host the `app/privacy.tsx` content publicly, or link in-app page).
- [ ] App Privacy "nutrition label" completed (see Privacy Label checklist).
- [ ] Sign-in demo: provide a test email + note that codes arrive by email (OTP). Reviewer guidance
      explaining passwordless flow added to "Notes for Review".
- [ ] Account deletion path documented in review notes (Settings → Account → Delete account) — Apple
      requires in-app deletion for apps with account creation (see Account Deletion checklist).
- [ ] Crisis/helpline content reviewed (see Crisis Resource checklist) — present in Help screen.
- [ ] `EXPO_PUBLIC_*` env values point at production Supabase; only the publishable anon key shipped.
- [ ] TestFlight build validated on a real device (icon, splash, fonts render in a real build).
- [ ] Export compliance: standard HTTPS only → usually "exempt"; answer encryption questions.

## Google Play submission checklist

- [ ] **⚠ Set `android.package`** in `app.json` — currently missing.
- [ ] **⚠ Set `android.versionCode`** and a launch `version`.
- [ ] Title, short description (≤80), full description from `listing.md`.
- [ ] Category **Health & Fitness**; tags self-care / mindfulness.
- [ ] Content rating (IARC) questionnaire completed.
- [ ] Phone screenshots (≥2) + 1024×500 feature graphic + 512×512 hi-res icon.
- [ ] Adaptive icon present (`assets/android_adaptive_foreground.png`, transparent mark, bg `#0E0F1A`) — confirmed in `app.json`; the splash mark (`assets/splash-mark.png`) is set via the expo-splash-screen plugin.
- [ ] Privacy Policy URL set.
- [ ] **Data Safety** form completed (see Data Safety checklist).
- [ ] Health apps declaration: confirm it is **not** a medical device / does not provide diagnosis
      or treatment (declare as general wellbeing).
- [ ] Account deletion: provide the in-app path **and** a web deletion request URL/instructions
      (Play requires a deletion route reachable outside the app too).
- [ ] Target API level meets current Play requirement (verify against the Expo SDK build).
- [ ] Closed/internal testing track validated before production.

## Privacy Label checklist (Apple "App Privacy")

Set this to match `app/privacy.tsx` exactly — under-claiming is safer than over-claiming.

- [ ] **Data used to track you:** NONE. (No ad/analytics SDKs — verified in code.)
- [ ] **Data linked to you (App Functionality only), applies when a user creates an account:**
  - [ ] Contact Info → **Email address** (sign-in + backup).
  - [ ] User Content → **the emotion check-ins** (the user's backup).
- [ ] **Signed-out users:** no data collected/stored server-side (history is on-device).
- [ ] Disclose the AI processing: the tapped emotion + a coarse 1–3 support level are sent to a
      third-party AI provider (Groq) for functionality, **not stored**, not linked to identity.
- [ ] Diagnostics / Identifiers / Usage Data / Location: **none collected**.
- [ ] Not used for third-party advertising or developer marketing.
- [ ] "Data is deletable" → YES (account deletion + clear history).

## Data Safety checklist (Google Play)

- [ ] **Does the app collect or share user data?** Yes (only with an account), collect-only — no sharing.
- [ ] Data types: **Personal info → Email address** (account), **App activity / Other → emotion
      check-ins** (account backup). Purpose: **App functionality** only.
- [ ] **Data shared with third parties:** none for ads/analytics. Note the AI provider processes the
      tapped emotion + 1–3 level for functionality (transient processing, not a data sale).
- [ ] **Is data encrypted in transit?** Yes (HTTPS).
- [ ] **Can users request deletion?** Yes — in-app (Settings → Account → Delete account) and via a
      stated request method.
- [ ] No data collected from children / not targeted at children.
- [ ] Matches the in-app Privacy screen and the Apple label (keep all three in sync).

## Account deletion checklist

- [ ] In-app deletion present: **Settings → Account → Delete account** (`app/settings.tsx`).
- [ ] Confirm dialog before deletion ("This cannot be undone") — present.
- [ ] Calls `delete-account` Edge Function (`supabase/functions/delete-account`), which uses the
      service role `admin.deleteUser` and cascades to `emotion_logs`.
- [ ] On success, local caches cleared + signed out + **success confirmation shown**
      ("Your account and backed-up check-ins were deleted.") — verify the alert appears.
- [ ] Failure path shows a non-destructive error and does not sign the user out.
- [ ] Verify end-to-end on a real account: row count in `emotion_logs` for that `user_id` → 0; auth
      user removed; device caches empty after return to home.
- [ ] Play: also provide an out-of-app deletion request route (URL/email) as Play requires.
- [ ] Privacy copy describes deletion accurately (it does — "How long we keep things").

## Crisis resource verification checklist

Source of truth: `src/features/safety/resources.ts` (region: **Malaysia** + international fallback).

- [ ] Emergency: **999** (and 112 from mobile) — correct for Malaysia.
- [ ] **Befrienders KL** 03-7627 2929 (24h) — dial string `0376272929` verified.
- [ ] **Talian HEAL** 15555 (MOH, 8am–midnight) — number + hours verified.
- [ ] **Talian Kasih** 15999 (24h) — number verified.
- [ ] International fallback **findahelpline.com** opens correctly.
- [ ] All `tel:` actions dial on a real device; `link` opens in browser.
- [ ] Help screen reachable from the home footer.
- [ ] Disclaimer present ("comfort, not medical care; in an emergency contact local services").
- [ ] Re-verify numbers/hours against befrienders.org.my, findahelpline.com, and MOH sources
      (last verified June 2026 per the file header). Set a recurring re-verification reminder.
- [ ] If launching outside Malaysia, add region-appropriate resources before that market goes live.

## SMTP / email (OTP) verification checklist

Email is sent for passwordless sign-in via Supabase Auth using custom SMTP (SendGrid).

- [ ] Custom SMTP configured in Supabase Auth → SMTP settings (host, port, credentials).
- [ ] Sender address verified with the email provider; **SPF + DKIM** records published for the domain.
- [ ] OTP email template sends a **6–8 digit code** (no magic link / deep link — app uses code entry).
- [ ] Live deliverability test to Gmail, Outlook, and one other provider; confirm not landing in spam.
- [ ] Code expiry + resend cooldown behave (app enforces a 30s resend cooldown in `app/sign-in.tsx`).
- [ ] Supabase Auth rate limits reviewed so legitimate users aren't blocked, but abuse is throttled.
- [ ] Bounce/complaint handling configured on the provider.
- [ ] Verify the in-app wording matches reality: "sent securely through our authentication provider".
- [ ] Function secrets (`GROQ_API_KEY`, optional `GROQ_MODEL`) set in Supabase; no secrets in the client.
