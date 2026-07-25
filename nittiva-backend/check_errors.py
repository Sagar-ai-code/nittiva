#!/usr/bin/env python
"""
Backend Error Checking Script
Checks for hard errors (syntax, imports) and soft errors (warnings, issues)
"""
import sys
import os

def check_imports():
    """Check if all required modules can be imported"""
    errors = []
    warnings = []
    
    print("=" * 60)
    print("Checking Python Imports...")
    print("=" * 60)
    
    # Check Django
    try:
        import django
        print(f"✓ Django {django.get_version()}")
    except ImportError as e:
        errors.append(f"✗ Django not installed: {e}")
        return errors, warnings
    
    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nittiva_backend.settings')
    try:
        django.setup()
        print("✓ Django setup successful")
    except Exception as e:
        errors.append(f"✗ Django setup failed: {e}")
        return errors, warnings
    
    # Check required packages
    packages = [
        'rest_framework',
        'djangorestframework_simplejwt',
        'django_filters',
        'drf_spectacular',
        'corsheaders',
        'dotenv',
        'google.auth',
        'google.oauth2',
    ]
    
    for package in packages:
        try:
            __import__(package)
            print(f"✓ {package}")
        except ImportError as e:
            errors.append(f"✗ {package} not installed: {e}")
        except Exception as e:
            warnings.append(f"⚠ {package} import issue: {e}")
    
    return errors, warnings

def check_models():
    """Check if models can be imported and have no errors"""
    errors = []
    warnings = []
    
    print("\n" + "=" * 60)
    print("Checking Models...")
    print("=" * 60)
    
    try:
        from api.models import User, Client, Project, Task
        print("✓ All models imported successfully")
        
        # Check User model fields
        user_fields = [f.name for f in User._meta.get_fields()]
        required_fields = ['email', 'google_id', 'profile_image_url', 'auth_provider']
        for field in required_fields:
            if field in user_fields:
                print(f"✓ User model has {field} field")
            else:
                errors.append(f"✗ User model missing {field} field")
                
    except Exception as e:
        errors.append(f"✗ Model import failed: {e}")
    
    return errors, warnings

def check_views():
    """Check if views can be imported"""
    errors = []
    warnings = []
    
    print("\n" + "=" * 60)
    print("Checking Views...")
    print("=" * 60)
    
    try:
        from api.views.auth import google_auth, LoginView, register
        print("✓ Auth views imported successfully")
    except Exception as e:
        errors.append(f"✗ Auth views import failed: {e}")
    
    try:
        from api.services.google_auth import GoogleAuthService
        print("✓ Google auth service imported successfully")
    except Exception as e:
        errors.append(f"✗ Google auth service import failed: {e}")
    
    return errors, warnings

def check_settings():
    """Check settings configuration"""
    errors = []
    warnings = []
    
    print("\n" + "=" * 60)
    print("Checking Settings...")
    print("=" * 60)
    
    try:
        from django.conf import settings
        
        # Check Google OAuth settings
        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        if google_client_id:
            print(f"✓ GOOGLE_CLIENT_ID configured: {google_client_id[:20]}...")
        else:
            warnings.append("⚠ GOOGLE_CLIENT_ID not configured in settings")
        
        # Check database
        db_engine = settings.DATABASES['default']['ENGINE']
        print(f"✓ Database engine: {db_engine}")
        
        # Check installed apps
        if 'api' in settings.INSTALLED_APPS:
            print("✓ API app in INSTALLED_APPS")
        else:
            errors.append("✗ API app not in INSTALLED_APPS")
            
    except Exception as e:
        errors.append(f"✗ Settings check failed: {e}")
    
    return errors, warnings

def check_urls():
    """Check URL configuration"""
    errors = []
    warnings = []
    
    print("\n" + "=" * 60)
    print("Checking URLs...")
    print("=" * 60)
    
    try:
        from django.urls import reverse
        from api.urls import urlpatterns
        
        # Check if google auth endpoint exists
        patterns = [str(p.pattern) for p in urlpatterns]
        if any('google' in str(p) for p in urlpatterns):
            print("✓ Google auth URL pattern found")
        else:
            errors.append("✗ Google auth URL pattern not found")
        
        print(f"✓ Found {len(patterns)} URL patterns")
        
    except Exception as e:
        errors.append(f"✗ URL check failed: {e}")
    
    return errors, warnings

def main():
    """Run all checks"""
    all_errors = []
    all_warnings = []
    
    print("\nBACKEND ERROR CHECKER")
    print("=" * 60)
    
    # Run all checks
    errors, warnings = check_imports()
    all_errors.extend(errors)
    all_warnings.extend(warnings)
    
    if errors:
        print("\n❌ Import errors found. Cannot continue with other checks.")
        print("\nErrors:")
        for error in errors:
            print(f"  {error}")
        return
    
    errors, warnings = check_models()
    all_errors.extend(errors)
    all_warnings.extend(warnings)
    
    errors, warnings = check_views()
    all_errors.extend(errors)
    all_warnings.extend(warnings)
    
    errors, warnings = check_settings()
    all_errors.extend(errors)
    all_warnings.extend(warnings)
    
    errors, warnings = check_urls()
    all_errors.extend(errors)
    all_warnings.extend(warnings)
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if all_errors:
        print(f"\n❌ HARD ERRORS FOUND: {len(all_errors)}")
        for error in all_errors:
            print(f"  {error}")
    else:
        print("\n✅ No hard errors found!")
    
    if all_warnings:
        print(f"\n⚠️  WARNINGS: {len(all_warnings)}")
        for warning in all_warnings:
            print(f"  {warning}")
    else:
        print("\n✅ No warnings!")
    
    print("\n" + "=" * 60)
    
    if all_errors:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
