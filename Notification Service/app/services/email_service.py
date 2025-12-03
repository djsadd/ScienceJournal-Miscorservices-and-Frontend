import smtplib
from email.message import EmailMessage
from typing import Optional
import logging

from app import config


logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    text: str,
    html: Optional[str] = None,
) -> None:
    if not config.EMAIL_ENABLED:
        logger.info("Email sending disabled; skipping for %s", to_email)
        return

    if not config.EMAIL_HOST_USER or not config.EMAIL_HOST_PASSWORD:
        logger.warning("Email credentials not configured; cannot send to %s", to_email)
        return

    msg = EmailMessage()
    msg["From"] = config.DEFAULT_FROM_EMAIL or config.EMAIL_HOST_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(text or "")
    if html:
        msg.add_alternative(html, subtype="html")

    if config.EMAIL_USE_SSL:
        with smtplib.SMTP_SSL(config.EMAIL_HOST, config.EMAIL_PORT) as server:
            server.login(config.EMAIL_HOST_USER, config.EMAIL_HOST_PASSWORD)
            server.send_message(msg)
    else:
        with smtplib.SMTP(config.EMAIL_HOST, config.EMAIL_PORT) as server:
            server.starttls()
            server.login(config.EMAIL_HOST_USER, config.EMAIL_HOST_PASSWORD)
            server.send_message(msg)
