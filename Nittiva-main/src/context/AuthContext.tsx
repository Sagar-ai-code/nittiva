// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  apiService,
  User,
  LoginCredentials,
  RegisterCredentials,
  SocialLoginCredentials,
} from "@/lib/api";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;

  login: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; user?: User }>;

  socialLogin: (
    credentials: SocialLoginCredentials,
  ) => Promise<{ success: boolean; user?: User }>;

  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        return true;
      } else {
        // Profile fetch failed - token might be invalid
        // Don't clear immediately - let the next request fail naturally
        console.warn("Profile fetch failed:", response.message);
        return false;
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // Don't throw - let ProtectedRoute handle auth state
      return false;
    }
  };

  // Initial auth bootstrap (runs once)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          // pick token from storage and expose it
          const tokenFromStorage = localStorage.getItem("auth_token");
          if (tokenFromStorage) setAccessToken(tokenFromStorage);

          // seed user from storage (written at last login)
          const storedUser = apiService.getCurrentUser();
          if (storedUser) {
            setUser(storedUser);
            // silently refresh from server (don't throw on error to prevent loops)
            refreshUser().then((success) => {
              if (!success && tokenFromStorage) {
                // If refresh failed but we have a token, token might be expired
                // Don't clear immediately - let ProtectedRoute handle it
                console.warn("Token refresh failed, but keeping auth state for now");
              }
            }).catch((err) => {
              console.warn("Silent refresh error:", err);
            });
          } else {
            // No stored user, try to fetch profile
            const success = await refreshUser();
            if (!success && !tokenFromStorage) {
              // Only clear if we have no token at all
              apiService.logout();
              setAccessToken(null);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Don't clear auth on init error - let user try to use the app
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (
    credentials: LoginCredentials,
  ): Promise<{ success: boolean; user?: User; message?: string; errors?: any }> => {
    try {
      setIsLoading(true);

      // allow username or email field coming from the form
      const loginCredentials: LoginCredentials = {
        email: (credentials as any).username || credentials.email,
        password: credentials.password,
        company_id: credentials.company_id, // Include company_id for agent login
      };

      const response = await apiService.login(loginCredentials);
      if (!response.success || !response.data) {
        // Show detailed error messages
        if (response.errors) {
          Object.values(response.errors).flat().forEach((err: any) => {
            if (typeof err === 'string') {
              toast.error(err);
            } else if (Array.isArray(err)) {
              err.forEach((e: string) => toast.error(e));
            }
          });
        } else {
          toast.error(response.message || "Login failed");
        }
        return { success: false, message: response.message, errors: response.errors };
      }

      // normalize possible shapes
      const data: any = response.data;
      const access: string | undefined = data.access ?? data.token;
      const refresh: string | undefined = data.refresh;

      if (!access) {
        toast.error("Login failed: missing access token");
        return { success: false };
      }

      // store tokens
      localStorage.setItem("auth_token", access);
      if (refresh) localStorage.setItem("refresh_token", refresh);
      setAccessToken(access);

      // Check if login response includes user data
      let nextUser: User | null = null;
      if (data.user) {
        // Use user data from login response (includes is_superuser)
        nextUser = data.user as User;
      } else {
        // Try to decode JWT for quick user
        try {
          const payloadPart = access.split(".")[1];
          const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(atob(normalized));
          nextUser = {
            id: payload.user_id,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            is_superuser: payload.is_superuser || false,
            is_staff: payload.is_staff || false,
          } as any;
        } catch (e) {
          // fallback to profile
        }
      }

      if (!nextUser) {
        const prof = await apiService.getProfile().catch(() => null);
        if (prof?.success && prof.data) nextUser = prof.data as User;
      }

      if (nextUser) {
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
        toast.success(`Welcome back${nextUser.name ? ", " + nextUser.name : ""}!`);
        return { success: true, user: nextUser };
      }

      toast.success("Login successful");
      return { success: true };
    } catch (error: any) {
      console.error("❌ Login error:", error);
      toast.error(`Login error: ${error.message || "An unexpected error occurred"}`);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.register(credentials);

      if (!response.success || !response.data) {
        if (response.errors) {
          Object.values(response.errors).flat().forEach((err: any) => toast.error(err));
        } else {
          toast.error(response.message || "Registration failed");
        }
        return false;
      }

      // If API returns tokens, auto-login
      const data: any = response.data;
      const userFromApi: User | undefined = data.user;
      const access: string | undefined = data.access_token ?? data.access ?? data.token;
      const refresh: string | undefined = data.refresh_token ?? data.refresh;

      if (access) {
        localStorage.setItem("auth_token", access);
        if (refresh) localStorage.setItem("refresh_token", refresh);
        setAccessToken(access);
      }

      if (userFromApi) {
        setUser(userFromApi);
        localStorage.setItem("user", JSON.stringify(userFromApi));
        toast.success(
          `Welcome to NITTIVA${
            userFromApi.name ? ", " + userFromApi.name : ""
          }! Your account has been created.`,
        );
      } else {
        toast.success(response.message || "Registration successful!");
      }

      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(`Registration error: ${error.message || "An unexpected error occurred"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (
    credentials: SocialLoginCredentials,
  ): Promise<{ success: boolean; user?: User }> => {
    try {
      setIsLoading(true);
      const response = await apiService.socialLogin(credentials);

      if (!response.success || !response.data) {
        toast.error(response.message || `${credentials.provider} login failed`);
        return { success: false };
      }

      // optional: if your API returns tokens in social login, capture them
      const data: any = response.data;
      const access: string | undefined = data.access ?? data.token;
      const refresh: string | undefined = data.refresh;
      if (access) {
        localStorage.setItem("auth_token", access);
        if (refresh) localStorage.setItem("refresh_token", refresh);
        setAccessToken(access);
      }

      const nextUser: User = data.user;
      setUser(nextUser);
      localStorage.setItem("user", JSON.stringify(nextUser));

      const providerName =
        credentials.provider.charAt(0).toUpperCase() + credentials.provider.slice(1);
      toast.success(
        data.isNewUser
          ? `Welcome to NITTIVA! Your ${providerName} account has been linked.`
          : `Welcome back! Signed in with ${providerName}.`,
      );

      return { success: true, user: nextUser };
    } catch (error: any) {
      console.error("Social login error:", error);
      toast.error(`Social login error: ${error.message || "An unexpected error occurred"}`);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();               // should clear storage it manages
    // ensure local cleanup as well
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setUser(null);
    setAccessToken(null);
    toast.success("Logged out successfully");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    accessToken,
    login,
    socialLogin,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
