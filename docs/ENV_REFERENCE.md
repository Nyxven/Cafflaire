# Environment variables (names only — never commit values)

Set these in Vercel → Project → Settings → Environment Variables (Production + Preview). Locally use `.env.local` (git-ignored).

## Secrets (mark "Sensitive" in Vercel; never share)
| Name | Purpose | How to get it |
|---|---|---|
| `BETTER_AUTH_SECRET` | Signs session cookies | `openssl rand -base64 32` |
| `DATA_ENCRYPTION_KEY` | AES-256 key for encrypted emails/names/phones/addresses/tokens. **Back it up** — losing/changing it makes existing encrypted data unreadable | `openssl rand -base64 32` |
| `SMTP_USER` | SMTP login (Brevo: looks like `xxx@smtp-brevo.com`) | Brevo → SMTP & API → SMTP |
| `SMTP_PASS` | SMTP key (shown once) | Brevo → Generate a new SMTP key |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_*` | Neon connection strings | Added automatically by Vercel → Storage → Neon. Do not delete |

## Local-only (never needed on Vercel)
| Name | Purpose | How to get it |
|---|---|---|
| `ELEVENLABS_API_KEY` | Lets `scripts/generate-voice.mjs` make the voice clips on your own computer. The website never uses it | ElevenLabs → Profile → API Keys. Put it ONLY in `.env.local`. If it ever leaks, delete it and make a new one |
| `ELEVENLABS_VOICE_ID` | Which (female) voice to use | `node scripts/generate-voice.mjs --list` |
| `ELEVENLABS_MODEL_ID` | Optional, default `eleven_multilingual_v2` | |

## Config (not secret)
| Name | Example | Notes |
|---|---|---|
| `BETTER_AUTH_URL` | `https://cafflaire.vercel.app` | Optional on Vercel (falls back to production URL); must match if a custom domain is added |
| `ADMIN_EMAILS` | `you@example.com` | Comma-separated; unlocks `/admin` |
| `EMAIL_FROM` | `"Cafflaire <you@example.com>"` | **Required.** Must be a verified sender at the SMTP provider (not the SMTP login) |
| `SMTP_HOST` / `SMTP_PORT` | `smtp-relay.brevo.com` / `587` | Gmail: `smtp.gmail.com` / `465` |
| `NEXT_PUBLIC_APP_NAME` | `Cafflaire` | Sent to browsers — never put secrets in `NEXT_PUBLIC_*` |
| `NEXT_PUBLIC_CURRENCY` | `PHP` | |
| `NEXT_PUBLIC_DELIVERY_FEE_CENTS` | `5000` | ₱50 |
| `NEXT_PUBLIC_MIN_PREP_MINUTES` | `15` | |
| `NEXT_PUBLIC_PICKUP_ADDRESS`, `NEXT_PUBLIC_DELIVERY_AREA`, `NEXT_PUBLIC_STORE_HOURS` | (undecided) | Optional, display only; changes need a redeploy (baked at build) |

## Health check
Add `?mail=1` (`/api/health?mail=1`) to also test the SMTP login; expect `smtp: {"ok": true}`.

`/api/health` must show: `ok: true`, `secretSet`, `databaseUrlSet`, `databaseReachable`, `tablesExist`, `emailConfigured`, `emailFromSet` all true and `encryptionKey: "dedicated"`.
