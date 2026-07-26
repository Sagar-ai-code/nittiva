"""
Lightweight root views for the Nittiva backend.
"""

from django.http import JsonResponse


def api_root(request):
    """Return a friendly status payload for the backend root URL."""
    return JsonResponse(
        {
            "name": "Nittiva API",
            "version": "1.0.0",
            "status": "ok",
            "documentation": "/api/docs/",
            "admin": "/admin/",
            "health": "/api/healthz",
        }
    )
