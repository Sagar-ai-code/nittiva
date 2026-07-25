"""
Password reset service.

This module handles password reset token generation and email sending.
"""

import os
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings


class PasswordResetService:
    """Service for handling password reset operations."""

    @staticmethod
    def generate_reset_token(user):
        """
        Generate a password reset token for a user.
        
        Returns a tuple of (uidb64, token):
        - uidb64: URL-safe base64 encoded user ID
        - token: Password reset token
        """
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        return uidb64, token

    @staticmethod
    def get_user_from_token(uidb64, token):
        """
        Validate token and return user if valid.
        
        Returns:
            User object if token is valid, None otherwise
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return None
        
        # Check if token is valid
        if default_token_generator.check_token(user, token):
            return user
        
        return None

    @staticmethod
    def send_reset_email(user, reset_url):
        """
        Send password reset email to user.
        
        Args:
            user: User object
            reset_url: Full URL for password reset page
        """
        subject = "Password Reset Request - Nittiva"
        
        message = f"""
Hello {user.name or user.email},

You requested a password reset for your Nittiva account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
Nittiva Team
        """.strip()
        
        # Get email from settings or use default
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nittiva.com')
        
        try:
            # Log email attempt
            import sys
            print("\n" + "="*80, file=sys.stderr)
            print("📧 Attempting to send password reset email...", file=sys.stderr)
            print("="*80, file=sys.stderr)
            print(f"Email Backend: {settings.EMAIL_BACKEND}", file=sys.stderr)
            print(f"SMTP Host: {getattr(settings, 'EMAIL_HOST', 'Not set')}", file=sys.stderr)
            print(f"SMTP Port: {getattr(settings, 'EMAIL_PORT', 'Not set')}", file=sys.stderr)
            print(f"From: {from_email}", file=sys.stderr)
            print(f"To: {user.email}", file=sys.stderr)
            print("="*80, file=sys.stderr)
            sys.stderr.flush()
            
            # Send email
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            # Success message
            print("\n✅ Email sent successfully!", file=sys.stderr)
            print("="*80, file=sys.stderr)
            print("🔗🔗🔗 PASSWORD RESET LINK - COPY THIS URL 🔗🔗🔗", file=sys.stderr)
            print("="*80, file=sys.stderr)
            print(f"To: {user.email}", file=sys.stderr)
            print(f"\nRESET LINK: {reset_url}\n", file=sys.stderr)
            print("="*80 + "\n", file=sys.stderr)
            sys.stderr.flush()
            
            return True
        except Exception as e:
            # Log detailed error for debugging
            import sys
            import traceback
            print("\n" + "="*80, file=sys.stderr)
            print("❌ FAILED to send password reset email", file=sys.stderr)
            print("="*80, file=sys.stderr)
            print(f"Error Type: {type(e).__name__}", file=sys.stderr)
            print(f"Error Message: {str(e)}", file=sys.stderr)
            print("\nFull Traceback:", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            print("="*80 + "\n", file=sys.stderr)
            sys.stderr.flush()
            return False

