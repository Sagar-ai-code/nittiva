"""
ASGI config for Nittiva Backend.

This module exposes the ASGI callable as a module-level variable named ``application``.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nittiva_backend.settings')
application = get_asgi_application()