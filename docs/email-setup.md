# Email / OTP delivery (production setup)

Status: **deferred for beta.** During the closed beta we use the free SendGrid
single-sender setup (sends from a Gmail address, so codes sometimes land in
spam). This doc is the plan for production-grade delivery when going public.

## The core point

The spam problem is the **missing domain**, not the provider. Sending "from" a
`gmail.com` address can't pass SPF/DKIM/DMARC (we don't own gmail.com), so mail
looks unauthenticated and gets filtered. The fix is: **own a cheap domain and
authenticate it.** A domain is ~$1 to $12/yr (Cloudflare, Porkbun, Namecheap).
The email service itself stays free. No app code changes are needed for any of
this; it is all DNS + the Supabase dashboard.

## Provider choice

| | Resend | SendGrid | Mailgun |
|---|---|---|---|
| Free tier | 3,000/mo (100/day) | 100/day | Trial, then pay |
| Ease of setup | Very easy (auto DNS, 1-click verify) | Moderate | Moderate |
| Deliverability | Excellent | Good (domain-authed) | Good |
| Best for | Solo devs / startups | Existing accounts | More technical setups |

**Recommended: Resend.** Cleanest DNS, generous free tier, great docs.
Alternative with no provider switch: add **Domain Authentication** to the
existing SendGrid account (same idea, CNAME-based) and change the sender to the
domain.

## DNS setup (Resend)

Send from a **subdomain** (e.g. `send.yourdomain.com`) to protect the root
domain's reputation. Resend's "Add Domain" generates the exact records to paste
at your DNS host:

- **SPF** — `TXT` on the subdomain, e.g. `v=spf1 include:amazonses.com ~all`
- **DKIM** — `TXT` (e.g. `resend._domainkey…`) with the public key Resend gives
  (copy it verbatim; it signs each email so receivers trust it)
- **MX** — on the subdomain, for bounce/feedback handling
- **DMARC** — `TXT` at `_dmarc.yourdomain.com`. Start with monitoring:
  `v=DMARC1; p=none; rua=mailto:you@yourdomain.com`
  After a clean week, tighten to `p=quarantine`, later `p=reject`.

Add records, wait for propagation, then click **Verify** in Resend (all green).

## Connect to Supabase Auth

Supabase -> Authentication -> Emails -> SMTP Settings -> Custom SMTP:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` |
| Password | Resend API key (`re_...`) |
| Sender email | `noreply@send.yourdomain.com` (on the verified domain) |
| Sender name | `Silent Support` |

Keep the existing "Magic link or OTP" template (the `{{ .Token }}` 6-digit code)
unchanged. Nothing else in the app changes.

## What improves

- "From" is your domain instead of a Gmail "via sendgrid.net" -> looks legitimate.
- Passes SPF + DKIM + DMARC -> inbox instead of spam.
- Supabase's built-in per-hour rate limit no longer applies.

## Launch checklist

- [ ] Buy a domain.
- [ ] Resend: Add Domain, use subdomain `send.yourdomain.com`.
- [ ] Paste Resend's SPF, DKIM, MX records at the DNS host.
- [ ] Add DMARC TXT at `_dmarc` (`p=none` to start).
- [ ] Wait for propagation, then Verify in Resend (all green).
- [ ] Create a Resend API key.
- [ ] Supabase Auth SMTP: host/port/`resend`/API key/sender/sender name. Save.
- [ ] Send a test code to Gmail, Outlook, and Yahoo; confirm inbox (not spam) and
      that "mailed-by / signed-by" shows your domain.
- [ ] Optionally move `SUPPORT_EMAIL` (app/privacy.tsx) to `help@yourdomain.com`.
- [ ] Remove the old SendGrid single-sender config from Supabase.
- [ ] Watch the Resend dashboard (delivered / bounce / complaint) for a week.
- [ ] Tighten DMARC to `p=quarantine` once delivery is clean.

## Beta workaround (current, free)

Until the above is done: tell testers to check spam and tap "Not spam" once
(this trains their inbox), and keep sign-in emails infrequent (the 30s resend
cooldown helps) to protect sender reputation.
