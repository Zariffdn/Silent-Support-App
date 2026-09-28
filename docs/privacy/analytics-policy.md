# Analytics Policy — Permanent Architectural Boundary

**Status: binding constraint, not a feature backlog item.** Silent Support contains **no analytics
system, local or remote, and never will.** Analytics is treated as a *forbidden layer* in the
architecture. This document is the source of truth; code or queries that violate it are defects,
regardless of intent.

This is not a "we haven't built it yet" note. There is nothing to build, tune, or revisit. Do not
propose alternatives, "privacy-safe" metrics, opt-in counters, or aggregate dashboards. The decision
is final.

## Why this is a boundary, not a TODO

The product's public promises are absolute: the in-app Privacy screen says *"We don't use tracking
or analytics tools,"* and the store listing says *"No analytics. Ever."* Those claims are the
product's trust foundation. Any analytics — even local, even "anonymous" — would make the honest
version of the claim weaker and is therefore prohibited.

## The #1 rule: no server-side aggregation of `emotion_logs`

Signed-in users' check-ins are stored in Supabase (`emotion_logs`) **solely** so a user can restore
their own history to their own device. This table must **NEVER** be queried, aggregated, sampled,
exported, or analyzed for any developer insight — not population counts, not "most common emotion,"
not strength/strain distributions, not retention, not "anonymized" rollups.

- No `SELECT … GROUP BY` for product analytics. No BI tools pointed at the database. No scheduled
  aggregation jobs. No ad-hoc analytics SQL.
- This holds even though the data is technically reachable with the service role. Reachability is
  not permission. Doing so would directly break *"We don't read your check-ins"* and *"never use it
  to profile you."*
- The only legitimate server-side touch of `emotion_logs` is per-user functionality: the user's own
  sync/restore, and account deletion (cascade). Nothing else.

This is the most likely way the project could backslide into surveillance **without any SDK at all.**
Treat it as the highest-severity violation.

## What must NEVER be tracked, logged, transmitted, or queried

- **Identifiers (any):** device ID, install ID, IDFA / GAID / advertising ID, account/user ID, email,
  session ID — never placed in a metric, log line, or event.
- **Fingerprinting:** device model + OS + screen + locale (or any composite) used as a pseudo-identity.
- **Event streams / timelines:** no per-tap events, no "emotion X at time T," no navigation paths,
  no screen-view tracking, no funnels, no clickstreams.
- **Emotional content as data:** never log or transmit the tapped emotion, the curated/AI response
  text, or any `strength` / `memory` / `strain` value tied to a user or a time.
- **Session analytics:** no session counts, durations, frequency, retention, cohorts, DAU/MAU.
- **Remote telemetry:** no analytics / attribution / heartbeat endpoints, no beacons or pixels, no
  remote logging service, no "phone-home" pings.
- **Third-party SDKs:** no analytics, attribution, ads, or crash-reporting SDKs added to the app
  (Sentry, Firebase Analytics/Crashlytics, Amplitude, Segment, Mixpanel, PostHog, Branch, etc.).
- **Location / IP analytics:** no geolocation, no IP-derived region, no locale-as-tracking.
- **Server-side aggregation of `emotion_logs`** (see the #1 rule above).
- **"Anonymous" analytics that are re-identifiable:** small user counts plus a few fields are
  identifiable. Do not ship it under an "anonymous" label.
- **A/B assignment or remote config keyed to a user.**
- **Crash payloads containing PII or emotional content.** (If platform crash reporting is accepted —
  see below — it is OS-level, stack-traces only, and not an in-app system.)
- **Local "developer metrics" of any kind:** no on-device counters, histograms, or usage tallies,
  even if they never leave the device. There is no metrics store.

## What is allowed (and is explicitly NOT analytics)

- **On-device, user-facing derived signals.** `computeStrength`, `deriveMemory`, `computeStrain`,
  and the history `insights` read local history, are **shown to the user as features**, and never
  leave the device. They are product behavior, not analytics. Constraint: they must stay that way —
  never written to a log/file, never attached to a network request, never exported silently.
- **Per-user functionality on the server:** the user's own sync/restore and account deletion. Never
  aggregation.

> Summary: **all behavioral signals are either local UI features or non-existent.** There is no third
> category.

## Platform crash diagnostics (the one external touchpoint, and its limits)

Apple TestFlight crash logs and Google Play "Android Vitals" are **OS-mediated, tester-consented,
and provided by the app stores — not an in-app SDK.** Accepting them does not add an analytics layer
to the app and does not violate this policy. If used, the Privacy screen carries one honest line that
they are handled by Apple/Google and can be disabled in device settings. No crash-reporting SDK may
be added to the app to achieve this.

## Enforcement

Reject in review any change that:

- adds an analytics / attribution / ads / crash SDK or dependency;
- introduces a telemetry/logging endpoint or a "phone-home" network call;
- records events, counters, sessions, or usage tallies (local or remote);
- aggregates, samples, or exports `emotion_logs` for non-per-user purposes;
- attaches any identifier or emotional content to a log or request.

If a future need seems to require analytics, the answer is to **re-read this document**, not to add a
metric. Beta learning uses platform crash reporting (above) and direct user feedback only.
