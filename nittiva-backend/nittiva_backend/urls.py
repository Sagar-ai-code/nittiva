"""
Main URL configuration for Nittiva Backend.

This module contains the root URL patterns for the Django project.
"""

from django.contrib import admin
from django.urls import path, include

from .views import api_root

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Include API URLs
]
