"""
Google OAuth service for token verification and user data extraction.

This module handles Google ID token verification and extracts user information.
"""

import os
from django.conf import settings

# Optional imports - only if google-auth is installed
try:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token
    GOOGLE_AUTH_LIBRARY_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_LIBRARY_AVAILABLE = False
    google_requests = None
    id_token = None


class GoogleAuthService:
    """Service for handling Google OAuth authentication."""

    @staticmethod
    def verify_token(token: str) -> dict:
        """
        Verify Google ID token and return user information.

        Args:
            token: Google ID token string from frontend

        Returns:
            dict: User information from Google (email, name, picture, sub, etc.)

        Raises:
            ValueError: If token is invalid or verification fails
        """
        if not GOOGLE_AUTH_LIBRARY_AVAILABLE:
            raise ValueError("google-auth package is not installed. Install it with: pip install google-auth")
        
        try:
            # Get Google Client ID from settings or environment
            client_id = getattr(settings, "GOOGLE_CLIENT_ID", None) or os.getenv("GOOGLE_CLIENT_ID")
            
            if not client_id:
                raise ValueError("GOOGLE_CLIENT_ID is not configured")

            # Verify the token with clock skew tolerance (300 seconds = 5 minutes)
            # This handles cases where the server clock is slightly off
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id,
                clock_skew_in_seconds=300  # Allow up to 5 minutes clock difference
            )

            # Verify the token was issued for our app
            if idinfo['aud'] != client_id:
                raise ValueError("Token audience mismatch")

            # Return user information
            return {
                'google_id': idinfo['sub'],
                'email': idinfo.get('email'),
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'email_verified': idinfo.get('email_verified', False),
            }
        except ValueError as e:
            raise ValueError(f"Invalid Google token: {str(e)}")
        except Exception as e:
            raise ValueError(f"Google token verification failed: {str(e)}")
