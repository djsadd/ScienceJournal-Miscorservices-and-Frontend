# ORCID OAuth integration

The application supports both linking a verified ORCID iD to an existing account and signing in with that linked iD.

## ORCID application settings

Register the exact backend callback URL in ORCID Developer Tools.

Production example:

```text
https://YOUR-DOMAIN/api/auth/orcid/callback
```

Sandbox/local example (only if accepted by the Sandbox client settings):

```text
http://localhost:8000/api/auth/orcid/callback
```

The value registered in ORCID must exactly match `ORCID_REDIRECT_URI`, including protocol, domain, port, path, and trailing slash behavior. Production must use HTTPS.

Add these values to `.env`:

```dotenv
ORCID_ENV=production
ORCID_CLIENT_ID=APP-XXXXXXXXXXXXXXXX
ORCID_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ORCID_REDIRECT_URI=https://journal.tau-edu.kz/api/auth/orcid/callback
FRONTEND_URL=https://journal.tau-edu.kz
```

For production:

```dotenv
ORCID_ENV=production
ORCID_CLIENT_ID=APP-XXXXXXXXXXXXXXXX
ORCID_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ORCID_REDIRECT_URI=https://YOUR-DOMAIN/api/auth/orcid/callback
FRONTEND_URL=https://YOUR-DOMAIN
```

Never expose `ORCID_CLIENT_SECRET` in frontend variables or source code.

Apply configuration with:

```powershell
docker compose up -d --build --force-recreate auth users api-gateway frontend
```

## Public application routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/orcid/start?intent=login&language=ru` | Create a login OAuth session and return `authorization_url` |
| `GET` | `/api/auth/orcid/start?intent=link&language=ru` | Create a linking OAuth session; requires the application Bearer token |
| `GET` | `/api/auth/orcid/callback` | Exact callback registered in ORCID |
| `POST` | `/api/auth/orcid/exchange` | Exchange the one-time callback code for application access/refresh tokens |
| `GET` | `/api/auth/orcid/status` | Return the current user's ORCID link status |
| `DELETE` | `/api/auth/orcid/link` | Unlink ORCID from the current account |

`language` accepts `ru`, `kz`, or `en`.

Example start response:

```json
{
  "authorization_url": "https://orcid.org/oauth/authorize?..."
}
```

Example status response:

```json
{
  "linked": true,
  "orcid": "0000-0002-1825-0097",
  "display_name": "Researcher Name",
  "linked_at": "2026-10-07T10:00:00"
}
```

The callback never places JWTs in the URL. It redirects the browser to the login page with a short-lived, single-use code, which the frontend exchanges through `/api/auth/orcid/exchange`.

## User flow

1. An authenticated user opens **Profile → Link ORCID**.
2. ORCID authenticates the user and returns the verified iD to the callback.
3. The Auth service stores the unique ORCID-to-user mapping and synchronizes the displayed iD to User Profile Service.
4. The user can then select **Sign in with ORCID** on the login page.
5. An unlinked ORCID is not automatically merged by name or email; the user is asked to sign in normally and link it from the profile.

## Security behavior

- OAuth `state` is random, stored only as a SHA-256 hash, expires after 10 minutes, and is single-use.
- Login exchange codes are stored only as hashes, expire after 2 minutes, and are single-use.
- An ORCID iD can belong to only one local account, and one local account can have only one ORCID iD.
- The client secret and ORCID code exchange remain on the backend.
- Existing manually entered ORCID values are not considered verified until the OAuth link is completed.
