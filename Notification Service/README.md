# Notification Service

## Email Notifications

This service can send email copies of notifications via SMTP.

Configure environment variables (use a `.env` file for Docker Compose substitution or set in your shell):

```
# SMTP settings (Mail.ru example)
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=465
EMAIL_USE_SSL=true

# Credentials
EMAIL_HOST_USER=zharshy@tau-edu.kz
EMAIL_HOST_PASSWORD=REPLACE_WITH_PASSWORD

# Sender address (optional; falls back to EMAIL_HOST_USER)
DEFAULT_FROM_EMAIL=zharshy@tau-edu.kz

# Toggle
EMAIL_ENABLED=true
```

Docker Compose already passes these to the `notifications` service. After setting variables, rebuild:

```powershell
docker compose up -d --build notifications
```

How it works:
- On notification creation, the service fetches recipient email via `AUTH_SERVICE_URL` (`/auth/users/{user_id}`) and sends using the configured SMTP server.
- If credentials are missing or lookup fails, it skips sending but still persists the notification.
