"""
Test email configuration script.

Run this to test if email sending is working correctly.
Usage: python test_email.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nittiva_backend.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail

def test_email():
    """Test email sending configuration."""
    print("="*80)
    print("📧 Testing Email Configuration")
    print("="*80)
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
    print(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
    print(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Not set')}")
    print(f"EMAIL_HOST_USER: {getattr(settings, 'EMAIL_HOST_USER', 'Not set')}")
    print(f"EMAIL_HOST_PASSWORD: {'Set' if getattr(settings, 'EMAIL_HOST_PASSWORD', None) else 'Not Set'}")
    print(f"DEFAULT_FROM_EMAIL: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set')}")
    print("="*80)
    
    # Get test email from user
    test_email_address = input("\nEnter email address to send test email to: ").strip()
    
    if not test_email_address:
        print("❌ No email address provided. Exiting.")
        return
    
    print(f"\n📤 Sending test email to: {test_email_address}")
    print("="*80)
    
    try:
        send_mail(
            subject='Test Email from Nittiva Backend',
            message='This is a test email to verify email configuration is working correctly.',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nittiva.com'),
            recipient_list=[test_email_address],
            fail_silently=False,
        )
        print("\n✅ Test email sent successfully!")
        print(f"Check inbox: {test_email_address}")
        print("="*80)
    except Exception as e:
        print(f"\n❌ Failed to send test email!")
        print(f"Error: {str(e)}")
        print(f"Error Type: {type(e).__name__}")
        print("\nFull Traceback:")
        import traceback
        traceback.print_exc()
        print("="*80)

if __name__ == '__main__':
    test_email()


