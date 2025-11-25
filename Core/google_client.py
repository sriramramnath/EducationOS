import logging
from typing import Optional

from allauth.socialaccount.models import SocialApp, SocialToken
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token'


def _get_social_token(user) -> Optional[SocialToken]:
    """
    Fetch the most relevant social token for the provided user.

    We prefer tokens whose associated app has the Google provider. If the
    SocialAccount provider string was saved incorrectly (observed as a numeric
    value in some databases), we gracefully fall back to whichever token exists
    for the user so that integrations continue to work.
    """
    token = (
        SocialToken.objects.filter(account__user=user, app__provider='google')
        .select_related('app', 'account')
        .order_by('-id')
        .first()
    )

    if token:
        return token

    fallback = (
        SocialToken.objects.filter(account__user=user)
        .select_related('app', 'account')
        .order_by('-id')
        .first()
    )

    if fallback:
        logger.warning(
            "Falling back to first available social token for %s; "
            "the social account provider value appears to be inconsistent.",
            user.email,
        )

    return fallback


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

    if social_token.expires_at:
        creds.expiry = social_token.expires_at

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

