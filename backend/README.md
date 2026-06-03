# Backend — Email setup

This backend includes an email system with development and production modes.

Summary
- Local dev: Mailpit (Mailpit inbox / SMTP on localhost) or Ethereal (auto-fallback)
- Production: Gmail via App Password or OAuth2 (refresh token)

Quick local test
1. Copy `.env.example` to `backend/.env` and adjust `MONGO_URI`.
2. For local SMTP (Mailpit) run the helper and Mailpit (optional):
   ```bash
   cd backend
   npm run smtp:setup
   # Start Mailpit as documented in your environment (example: `npm run smtp:up` from project root)
   npm run test:email
   ```

Production SMTP options

Option A — Gmail App Password (simple)
- Enable 2FA for the sending Google account and create an App Password for Mail.
- Set these repository or deployment secrets (do NOT commit them to git):
  - `SMTP_HOST` (smtp.gmail.com)
  - `SMTP_PORT` (587)
  - `SMTP_SECURE` (false)
  - `SMTP_USER` (your-email@gmail.com)
  - `SMTP_PASS` (your app password)

Option B — Gmail OAuth2 (recommended)
- Create OAuth 2.0 client credentials in Google Cloud Console and obtain a refresh token for the sending account.
- Set these repository or deployment secrets (do NOT commit them to git):
  - `SMTP_HOST` (smtp.gmail.com)
  - `SMTP_PORT` (587)
  - `SMTP_USER` (your-email@gmail.com)
  - `GMAIL_CLIENT_ID`
  - `GMAIL_CLIENT_SECRET`
  - `GMAIL_REFRESH_TOKEN`

CI / Deployment (example — GitHub Actions)
- Store the above values as repository secrets (Settings → Secrets). Example secret names used by our examples:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- A sample workflow file is provided at `.github/workflows/smtp-secrets-check.yml` to verify secrets and attempt a connection.

Security: never commit `backend/.env` to source control
- `.env.example` contains placeholders for local development only. Keep real credentials in your CI/deployment secret manager.
- The `backend/.env` file should be listed in `.gitignore` (it is by default). Always review commits for accidental secrets.

More
- Email implementation is in `backend/src/services/emailService.js` and supports both SMTP auth and Gmail OAuth2 with refresh-token exchange.
