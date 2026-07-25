"""
Settings package for Nittiva Backend.

This package contains Django settings organized by environment.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Determine which environment we're running in
ENVIRONMENT = os.getenv("DJANGO_ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    from .production import *
else:
    from .development import *

