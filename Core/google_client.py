import logging
from typing import Optional
from datetime import timezone as dt_timezone

from allauth.socialaccount.models import SocialApp, SocialToken
from django.utils import timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token'


def _get_social_token(user) -> Optional[SocialToken]:
    """
    Fetch the most relevant social token for the provided user.

    We first prefer tokens whose associated SocialAccount provider is google.
    If that data was imported incorrectly, we fall back to tokens whose
    SocialApp provider is google, and finally to any token available.
    """
    base_qs = (
        SocialToken.objects.filter(account__user=user)
        .select_related('app', 'account')
        .order_by('-id')
    )

    token = base_qs.filter(account__provider='google').first()
    if token:
        return token

    token = base_qs.filter(app__provider='google').first()
    if token:
        logger.warning(
            "SocialAccount provider mismatch for %s; using token matched via SocialApp.",
            user.email,
        )
        return token

    fallback = base_qs.first()
    if fallback:
        logger.warning(
            "Falling back to first available social token for %s; "
            "no Google-specific token could be found.",
            user.email,
        )

    return fallback


def _normalize_expiry(value):
    """Return a naive UTC datetime compatible with google-auth."""
    if not value:
        return None
    if timezone.is_naive(value):
        aware = timezone.make_aware(value, dt_timezone.utc)
    else:
        aware = value.astimezone(dt_timezone.utc)
    return aware.replace(tzinfo=None)


def build_google_credentials(user) -> Optional[Credentials]:
    """Return a Google Credentials object for the specified user."""
    social_token = _get_social_token(user)
    if not social_token:
        logger.warning("No Google social token found for user %s", user.email)
        return None

    google_app = social_token.app or SocialApp.objects.filter(provider='google').first()
    if not google_app:
        logger.error("No Google SocialApp configured in Django admin.")
        return None

    refresh_token = social_token.token_secret or None
    creds = Credentials(
        token=social_token.token,
        refresh_token=refresh_token,
        token_uri=GOOGLE_TOKEN_URI,
        client_id=google_app.client_id,
        client_secret=google_app.secret,
    )

    expiry = _normalize_expiry(social_token.expires_at)
    if expiry:
        creds.expiry = expiry

    return creds


def build_google_service(user, api_name: str, api_version: str):
    """Build a Google API service client for the provided user."""
    creds = build_google_credentials(user)
    if not creds:
        return None

    try:
        return build(api_name, api_version, credentials=creds, cache_discovery=False)
    except Exception as exc:  # pragma: no cover - discovery errors are logged
        logger.error(
            "Error building Google %s service for %s: %s",
            api_name,
            user.email,
            exc,
            exc_info=True,
        )
        return None

