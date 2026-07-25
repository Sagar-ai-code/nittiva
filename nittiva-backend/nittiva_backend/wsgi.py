"""
WSGI config for Nittiva Backend.

This module exposes the WSGI callable as a module-level variable named ``application``.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nittiva_backend.settings')
application = get_wsgi_application()