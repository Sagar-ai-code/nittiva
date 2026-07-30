"""
System / admin endpoints.

A-2 (Arjun): SMTP email status + send-test endpoint. Admin (or any
user with is_staff / is_superuser) can:
  - GET  /api/system/email_status/  → current email config (no secrets)
  - POST /api/system/email_status/test/  → send a test email to the
    caller. Returns whether delivery succeeded.
"""
from django.conf import settings
from django.core.mail import send_mail
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..utils.responses import success_response, error_response
from ..utils.tenant import get_current_tenant_id


def _email_status():
    """Return the current email config (no secrets leaked)."""
    configured = bool(
        getattr(settings, "EMAIL_HOST_USER", None)
        and getattr(settings, "EMAIL_HOST_PASSWORD", None)
    )
    return {
        "configured": configured,
        "backend": "smtp" if configured else "console",
        "host": getattr(settings, "EMAIL_HOST", ""),
        "port": getattr(settings, "EMAIL_PORT", ""),
        "use_tls": getattr(settings, "EMAIL_USE_TLS", False),
        "from_email": getattr(settings, "DEFAULT_FROM_EMAIL", ""),
        # The username is safe to show — not the password
        "username_set": bool(getattr(settings, "EMAIL_HOST_USER", None)),
    }


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def email_status(request):
    """GET /api/system/email_status/ — current email config (no secrets).

    Open to all authenticated users (so the admin UI on the manager
    dashboard can show the status to anyone in the tenant, not just
    staff). Returns no secrets — just the host, port, from_email, and
    whether the creds are set.
    """
    return Response({
        "success": True,
        "data": _email_status(),
    })


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def email_status_test(request):
    """POST /api/system/email_status/test/ — send a test email to the caller.

    Body (optional): { "to": "<email>" } — if omitted, sends to the
    caller's email. Returns { "sent": true, "to": "...", "backend": "..." }.

    Works with both SMTP and console backends. The console backend
    just logs the email; the SMTP backend actually sends.
    """
    to = request.data.get("to") or getattr(request.user, "email", None)
    if not to:
        return error_response(
            "No recipient email provided and the caller has no email.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    subject = "Nittiva email test"
    body = (
        f"Hi from Nittiva!\n\n"
        f"This is a test email sent at {request.build_absolute_uri('/')}.\n\n"
        f"If you got this, the email backend is working.\n\n"
        f"— Nittiva"
    )
    try:
        sent_count = send_mail(
            subject=subject,
            message=body,
            from_email=None,  # use DEFAULT_FROM_EMAIL
            recipient_list=[to],
            fail_silently=False,
        )
        return Response({
            "success": True,
            "data": {
                "sent": True,
                "to": to,
                "backend": _email_status()["backend"],
                "sent_count": sent_count,
            },
            "message": f"Test email sent to {to} via {_email_status()['backend']}.",
        })
    except Exception as e:
        return Response({
            "success": False,
            "data": {
                "sent": False,
                "to": to,
                "backend": _email_status()["backend"],
                "error": str(e),
            },
            "message": f"Test email failed: {e}",
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
