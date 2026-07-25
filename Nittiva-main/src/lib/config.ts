
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.nittiva.com/api";

// Get tenant subdomain from URL (ideal) or fallback to header/localStorage
export const getTenantSubdomain = (): string => {
  // Method 1: Extract from URL subdomain (IDEAL - production)
  // e.g., acme.nittiva.com -> "acme"
  // e.g., acme.localhost:8080 -> "acme"
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    const parts = hostname.split('.');
    
    // Handle localhost for development
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      // Check if there's a subdomain prefix (e.g., acme.localhost)
      if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
        return parts[0];
      }
    } else {
      // Production: extract subdomain (e.g., acme.nittiva.com -> acme)
      if (parts.length >= 3) {
        return parts[0];
      }
    }
  }
  
  // Method 2: Check localStorage (for manual switching)
  const stored = localStorage.getItem("tenant_subdomain");
  if (stored) return stored;
  
  // Method 3: Check environment variable
  if (import.meta.env.VITE_TENANT_SUBDOMAIN) {
    return import.meta.env.VITE_TENANT_SUBDOMAIN;
  }
  
  // Method 4: Default for development
  return "default";
};

export const API_BASE_URL = (() => {
  // Check if we're in development mode (Vite automatically sets this)
  if (import.meta.env.DEV || import.meta.env.MODE === 'developement') {
    return 'http://localhost:8000/api';
  }
  // Use environment variable if set, otherwise fallback to production URL
  return import.meta.env.VITE_API_BASE_URL || 'https://api.nittiva.com/api';
})();
