# Security Policy

## Public repository boundary

This repository contains a public profile site. Every committed profile record, image, thumbnail, and document must be treated as publicly downloadable. Private source photos, drafts, credentials, and personal records that are not intended for publication must remain outside the repository.

## Secrets

- Store `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `GITHUB_ADMIN_TOKEN` only in Vercel environment variables.
- Never place secret values in source files, documentation, screenshots, browser storage, Git commits, or issue text.
- If a secret is exposed, revoke or rotate it first, then remove the exposed material and verify GitHub secret-scanning alerts.
- Local `.env` files and common private-key formats are ignored by the project `.gitignore`.

## Administrative changes

- The deployed administrator uses same-origin `/api/admin` endpoints, an HttpOnly session, CSRF validation, and server-side GitHub access.
- Administrator saves can commit directly to `main` and trigger a Vercel production deployment. Recheck `origin/main` before resuming code work.
- Do not weaken authentication, CSRF, origin, upload validation, or Git conflict checks without an explicit security review.

## Reporting a vulnerability

Do not publish credentials or exploit details in a public issue. Use the repository's **Security → Advisories → Report a vulnerability** form, which is configured for private reporting. Include only the affected path, impact, and reproduction steps needed to verify the report.
