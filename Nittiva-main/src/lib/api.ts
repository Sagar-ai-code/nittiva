// API Configuration
import { API_BASE_URL, getTenantSubdomain } from "./config";

// Development mode flag
// const isDevelopment =
//   import.meta.env.DEV || import.meta.env.MODE === "development";

export const isDevelopment =
  import.meta.env.DEV || import.meta.env.MODE === "development";

// HYBRID MODE - Try real API first, fallback to mock in development
// const shouldUseMockData = isDevelopment;

// Log development mode status
// console.log(
//   `🔧 Development Mode: ${isDevelopment}, Mock Data Fallback: ${shouldUseMockData}`,
// );


export const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK ?? "false").toString().toLowerCase() === "true";

console.log(`🔧 DEV: ${isDevelopment} • USE_MOCK: ${USE_MOCK}`);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// New API response format
export interface ActualApiResponse<T = any> {
  error: boolean;
  message: string;
  access_token?: string;
  token_type?: string;
  user?: T;
  workspace?: any;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  status: boolean;
  email_verified: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  photo_url: string;
  // Keep legacy fields for backwards compatibility
  email_verified_at?: string;
  role_id?: number;
  workspace_id?: number;
  guard?: string;
  // Django user fields
  name?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  is_active?: boolean;
  company_id?: string; // Company ID from user's tenant
}

export interface LoginCredentials {
  email: string;
  password: string;
  company_id?: string; // Optional for managers, required for agents
  username?: string; // Support username for login
}

export interface RegisterCredentials {
  company_id?: string; // Required for agents, optional for managers
  first_name?: string;
  last_name?: string;
  email: string; // Used as username
  phone?: string;
  password: string;
  password_confirmation: string;
  company?: string;
  type?: string; // 'member', 'client', 'manager', or 'agent'
  role?: string; // 'manager' or 'agent'
  // Manager-specific fields
  company_name?: string;
  company_email?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordCredentials {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

export interface SocialLoginCredentials {
  provider: "google" | "linkedin" | "apple";
  token: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

export interface SocialAuthResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

// Additional interfaces for API
export interface Task {
  id: number;
  title: string;
  description?: string;
  status_id?: number;
  priority_id?: number;
  project_id?: number;
  assigned_to?: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  task_id?: number;
  start_time: string;
  end_time?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  task_id?: number;
  project_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

// ---- Django task shape + normalizer ----
type BackendTask = {
  id: number;
  project: number;                  // FK id
  title: string;
  description: string | null;
  status: "to-do" | "in-progress" | "completed" | "review";
  priority: "low" | "medium" | "high";
  progress: number;
  due_date: string | null;
  time_tracked_seconds: number;
  custom_fields: Record<string, any>;
  assignees: Array<{ id: number; email: string; name?: string }>;
  sprint?: number | null;            // Sprint FK id
  created_at: string;
  updated_at: string;
};

export function normalizeTask(t: BackendTask) {
  return {
    id: t.id,
    projectId: t.project,
    name: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    progress: t.progress ?? 0,
    dueDate: t.due_date ?? "",
    timeTracked: t.time_tracked_seconds ?? 0,
    customFields: t.custom_fields ?? {},
    assigneeIds: (t.assignees ?? []).map((u) => String(u.id)), // UI uses string ids
    sprint: (t as any).sprint || null, // Sprint ID
  };
}


class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("auth_token");
    
    // Get company_id from user data (stored in localStorage after login)
    let companyId: string | null = null;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        companyId = user?.company_id || null;
      }
    } catch (e) {
      console.warn("Failed to parse user from localStorage:", e);
    }
    
    // Fallback to tenant subdomain if company_id not available (for backward compatibility)
    const tenantSubdomain = getTenantSubdomain();
    
    // Log in development for debugging
    if (isDevelopment) {
      console.log("🏢 Using company_id:", companyId, "or subdomain:", tenantSubdomain);
    }
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      workspace_id: "1", // Required workspace_id header
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    // Priority: Send company_id if available (for company_id-based multi-tenancy)
    if (companyId) {
      headers["X-Company-ID"] = companyId;
    } else {
      // Fallback to subdomain for backward compatibility
      headers["X-Tenant-Subdomain"] = tenantSubdomain;
    }
    
    return headers;
  }

  // Mock responses for development when API is not available
  private getMockResponse<T>(
    endpoint: string,
    method: string,
    body?: any,
  ): Promise<ApiResponse<T>> {
    console.log(`🎭 Mock API: ${method} ${endpoint}`);

    return new Promise((resolve) => {
      setTimeout(() => {
        if (
          (endpoint === "/authenticate" ||
            endpoint === "/users/authenticate" ||
            endpoint === "/login" ||
            endpoint === "/users/login" ||
            endpoint === "/auth/login") &&
          method === "POST"
        ) {
          const credentials = JSON.parse(body || "{}");
          if (
            credentials.email === "demo@example.com" &&
            credentials.password === "password"
          ) {
            resolve({
              success: true,
              data: {
                                user: {
                  id: 1,
                  first_name: "Demo",
                  last_name: "User",
                  full_name: "Demo User",
                  email: "demo@example.com",
                  phone: "1234567890",
                  address: null,
                  city: null,
                  state: null,
                  country: null,
                  zip: null,
                  status: true,
                  email_verified: true,
                  role: "admin",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
                  // Legacy fields for compatibility
                  role_id: 1,
                  email_verified_at: new Date().toISOString(),
                  workspace_id: 1,
                  guard: "web",
                },
                token: "mock-jwt-token-" + Date.now(),
              } as any,
            });
          } else {
            resolve({
              success: false,
              message:
                "Invalid credentials. Use demo@example.com / password for mock login.",
            });
          }
                } else if (
          (endpoint === "/signup/create_account" ||
            endpoint === "/signup" ||
            endpoint === "/register" ||
            endpoint === "/users/signup" ||
            endpoint === "/users/register" ||
            endpoint === "/auth/register" ||
            endpoint === "/users/store") &&
          method === "POST"
        ) {
          const registrationData = JSON.parse(body || "{}");
          resolve({
            success: true,
            data: ({
              user: {
                id: Date.now(),
                first_name: registrationData.first_name || "Demo",
                last_name: registrationData.last_name || "User",
                full_name: `${registrationData.first_name || "Demo"} ${registrationData.last_name || "User"}`,
                email: registrationData.email || "demo@example.com",
                                phone: registrationData.phone || "+1234567890",
                address: null,
                city: null,
                state: null,
                country: null,
                zip: null,
                status: true,
                email_verified: false,
                role: registrationData.type || "member",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
              },
              access_token: "mock-registration-token-" + Date.now(),
              message: "User registered successfully",
            } as any) as T,
            message: "User registered successfully",
          });
        } else if (
          (endpoint === "/password/reset-request" ||
            endpoint === "/password/email") &&
          method === "POST"
        ) {
          resolve({
            success: true,
            message:
              "Verification email sent! Please check your inbox and spam folder.",
          });
        } else if (endpoint === "/email/verify" && method === "POST") {
          resolve({
            success: true,
            message: "Email verified successfully! You can now log in.",
                        data: ({
              user: {
                id: 1,
                first_name: "Demo",
                last_name: "User",
                full_name: "Demo User",
                email: "demo@example.com",
                phone: "1234567890",
                address: null,
                city: null,
                state: null,
                country: null,
                zip: null,
                status: true,
                email_verified: true,
                role: "member",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
                // Legacy fields for compatibility
                role_id: 2,
                email_verified_at: new Date().toISOString(),
                workspace_id: 1,
                guard: "web",
              },
            } as any) as T,
          });
        } else if (endpoint === "/user" && method === "GET") {
          resolve({
            success: true,
                        data: {
              id: 1,
              first_name: "Demo",
              last_name: "User",
              full_name: "Demo User",
              email: "demo@example.com",
              phone: "1234567890",
              address: null,
              city: null,
              state: null,
              country: null,
              zip: null,
              status: true,
              email_verified: true,
              role: "admin",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
              // Legacy fields for compatibility
              role_id: 1,
              email_verified_at: new Date().toISOString(),
              workspace_id: 1,
              guard: "web",
            } as any,
          });
        } else if (
          (endpoint === "/auth/social/google" ||
            endpoint === "/auth/social/linkedin" ||
            endpoint === "/auth/social/apple" ||
            endpoint === "/social/auth") &&
          method === "POST"
        ) {
          const socialCredentials = JSON.parse(body || "{}");
          const providerName =
            socialCredentials.provider || endpoint.split("/").pop();

          // Demo social login - always succeed with mock user data
          resolve({
            success: true,
            data: {
                            user: {
                id: Date.now(), // Unique ID based on timestamp
                first_name: `${providerName.charAt(0).toUpperCase()}${providerName.slice(1)}`,
                last_name: "User",
                full_name: `${providerName.charAt(0).toUpperCase()}${providerName.slice(1)} User`,
                email: `demo@${providerName}.com`,
                phone: "1234567890",
                address: null,
                city: null,
                state: null,
                country: null,
                zip: null,
                status: true,
                email_verified: true,
                role: "member",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                photo_url: "https://taskify.softcofrnds.com/storage/photos/no-image.jpg",
                // Legacy fields for compatibility
                role_id: 2,
                email_verified_at: new Date().toISOString(),
                workspace_id: 1,
                guard: "web",
              },
              token: `mock-${providerName}-token-${Date.now()}`,
              isNewUser: Math.random() > 0.5, // Randomly simulate new vs existing user
            } as any,
          });
        } else if (endpoint === "/dashboard/statistics" && method === "GET") {
          resolve({
            success: true,
            data: {
              totalProjects: 12,
              activeTasks: 28,
              completedTasks: 45,
              totalUsers: 8,
            } as any,
          });
        } else if (endpoint === "/projects" && method === "GET") {
          resolve({
            success: true,
            data: [
              {
                id: 1,
                name: "Website Redesign",
                description: "Complete redesign of company website",
                status: "active",
                start_date: "2024-01-15",
                end_date: "2024-03-15",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 2,
                name: "Mobile App Development",
                description: "Native iOS and Android app",
                status: "planning",
                start_date: "2024-02-01",
                end_date: "2024-06-01",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ] as any,
          });
        } else if (endpoint === "/tasks" && method === "GET") {
          resolve({
            success: true,
            data: [
              {
                id: 1,
                title: "Design homepage mockup",
                description:
                  "Create wireframes and mockups for the new homepage",
                status_id: 1,
                priority_id: 2,
                project_id: 1,
                assigned_to: 1,
                due_date: "2024-02-15",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 2,
                title: "Set up project repository",
                description:
                  "Initialize Git repository and set up CI/CD pipeline",
                status_id: 2,
                priority_id: 1,
                project_id: 1,
                assigned_to: 1,
                due_date: "2024-02-10",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ] as any,
          });
        } else {
          resolve({
            success: true,
            data: [] as any,
          });
        }
      }, 300); // Simulate network delay (shorter for better UX)
    });
  }

private async makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // If mock is explicitly enabled, serve mock and stop here
  if (USE_MOCK) {
    return this.getMockResponse<T>(
      endpoint,
      (options.method as string) || "GET",
      options.body,
    );
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    if (isDevelopment) {
      console.log("🌐 API Request:", {
        method: options.method || "GET",
        url,
        headers: this.getAuthHeaders(),
        body: options.body,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("Request timeout"), 15000);

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
      mode: "cors",
      credentials: "omit",
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        console.warn("⚠️ Authentication failed (401). Token may be expired.");
        // Try to refresh token if we have a refresh token (only once per request)
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken && !(options as any)._retrying) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: refreshToken }),
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              const newAccessToken = refreshData.access || refreshData.data?.access;
              if (newAccessToken) {
                localStorage.setItem("auth_token", newAccessToken);
                // Retry the original request with new token (mark as retrying to prevent loops)
                const retryHeaders = this.getAuthHeaders();
                const retryOptions = { ...options, _retrying: true, headers: retryHeaders };
                const retryResponse = await fetch(url, retryOptions);
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json().catch(() => null);
                  return { success: true, data: retryData?.data ?? retryData, message: retryData?.message };
                }
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }
        }
        
        // If refresh failed or no refresh token, return error
        // DON'T clear localStorage here - let AuthContext handle it
        // This prevents redirect loops when multiple API calls fail simultaneously
      }
      
      let errorData: any = {};
      try { errorData = await response.json(); } catch {}
      return {
        success: false,
        message:
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        errors: errorData?.errors,
      };
    }

    // Handle DELETE operations that return 204 No Content
    if (response.status === 204 || (options.method === "DELETE" && response.status === 200)) {
      return { success: true, data: null as any, message: "Deleted successfully" };
    }

    // Try to parse JSON, but handle empty responses gracefully
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // If no JSON content type, return success with empty data
      return { success: true, data: null as any, message: "Operation successful" };
    }

    const data = await response.json().catch(() => null);
    if (data == null) {
      // For DELETE operations, empty response is OK
      if (options.method === "DELETE") {
        return { success: true, data: null as any, message: "Deleted successfully" };
      }
      return { success: false, message: "Invalid JSON response from server" };
    }

    return { success: true, data: data.data ?? data, message: data.message };
  } catch (error: any) {
    console.error("🚨 API Error:", error);
    return {
      success: false,
      message:
        error?.name === "AbortError"
          ? "Request timeout"
          : error?.message || "Network error occurred",
    };
  }
}


  // Authentication endpoints
async login(
  credentials: LoginCredentials,
): Promise<ApiResponse<{ user: User | null; token: string }>> {
  // Never mock here unless USE_MOCK=true
  if (USE_MOCK) {
    return this.getMockResponse<{ user: User; token: string }>(
      "/auth/login",
      "POST",
      JSON.stringify(credentials),
    );
  }

  const endpoint = "/auth/login";
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ 
        email: credentials.email, 
        password: credentials.password,
        company_id: credentials.company_id,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return {
        success: false,
        message: err?.message || `HTTP ${res.status}: ${res.statusText}`,
        errors: err?.errors,
      };
    }

    const raw = await res.json();

    // normalize tokens
    const access =
      raw?.data?.access ?? raw?.access ?? raw?.token ?? raw?.access_token ?? null;
    const refresh =
      raw?.data?.refresh ?? raw?.refresh ?? raw?.refresh_token ?? null;

    if (!access) {
      return { success: false, message: "Login failed - no access token returned" };
    }

    // store tokens
    localStorage.setItem("auth_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);

    // fetch profile right away so refresh doesn’t flip you back to Demo
    const profile = await this.getProfile();
    if (profile.success && profile.data) {
      localStorage.setItem("user", JSON.stringify(profile.data));
    }

    return {
      success: true,
      data: { user: (profile.success && profile.data) || null, token: access },
      message: raw?.message || "Login successful",
    };
  } catch (e: any) {
    return { success: false, message: e?.message || "Network error" };
  }
}




// Returns: ApiResponse<{ user: User; access_token: string }>
async register(
  credentials: RegisterCredentials
): Promise<ApiResponse<{ user: User; access_token: string }>> {
  const endpoint = "/auth/register"; // Django: .../api/auth/register

  try {
    console.log(`📝 Using registration endpoint: ${endpoint}`);

    // Send registration data based on role (manager or agent)
    const registrationData: any = {
      first_name: credentials.first_name || "",
      last_name: credentials.last_name || "",
      phone_number: credentials.phone || (credentials as any).phone_number || "",
      company: credentials.company || "",
      email: credentials.email, // Used as username
      password: credentials.password,
      password_confirmation: credentials.password_confirmation,
      role: credentials.role || credentials.type || "user",
    };
    
    // Add role-specific fields
    if (credentials.role === "manager" || credentials.type === "manager") {
      registrationData.company_name = credentials.company_name || "";
      registrationData.company_email = credentials.company_email || "";
      // Company ID will be auto-generated by backend for managers
    } else if (credentials.role === "agent" || credentials.type === "agent") {
      registrationData.company_id = credentials.company_id || "";
    } else {
      // Legacy/default: require company_id
      registrationData.company_id = credentials.company_id || "";
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      // Do NOT send Authorization for register; just JSON
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      return {
        success: false,
        message: errorData.message || "Registration failed",
        errors: errorData.errors,
      };
    }

    // Parse once
    const raw: any = await response.json();
    console.log("🧾 Register response:", raw);

    // Normalize shapes:
    // { success, data: { user, access_token, refresh_token } }
    // or { user, access_token } or { data: { access } }
    const user: User | null = raw?.data?.user ?? raw?.user ?? null;

    const access_token: string | null =
      raw?.data?.access_token ??
      raw?.access_token ??
      raw?.data?.access ??
      raw?.access ??
      null;

    const refresh_token: string | null =
      raw?.data?.refresh_token ?? raw?.refresh_token ?? raw?.data?.refresh ?? raw?.refresh ?? null;

    if (!user || !access_token) {
      return {
        success: false,
        message:
          raw?.message ||
          "Registration failed - invalid response (missing user or access token)",
        errors: raw?.errors,
      };
    }

    // Persist session
    localStorage.setItem("auth_token", access_token);
    if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("user", JSON.stringify(user));

    return {
      success: true,
      data: { user, access_token },
      message: raw?.message || "Registration successful",
    };
  } catch (error: any) {
    console.log(`⚠️ Registration endpoint ${endpoint} failed:`, error?.message);
  }

  // Dev fallback
  if (isDevelopment) {
    console.warn("🔄 Registration API failed, using emergency mock fallback");
    return this.getMockResponse<{ user: User; access_token: string; message: string }>(
      "/users/signup",
      "POST",
      JSON.stringify(credentials)
    );
  }

  return {
    success: false,
    message:
      "Registration failed - unable to connect to registration service. Please contact support.",
  };
}

  async requestPasswordReset(
    email: ResetPasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>("/password/email", {
      method: "POST",
      body: JSON.stringify(email),
    });
  }

  async resendEmailVerification(
    email: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>("/password/email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(
    token: string,
  ): Promise<ApiResponse<{ message: string; user?: User }>> {
    return this.makeRequest<{ message: string; user?: User }>("/email/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async resetPassword(
    credentials: ResetPasswordCredentials,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>("/password/reset", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

async getProfile(): Promise<ApiResponse<User>> {
  if (USE_MOCK) return this.getMockResponse<User>("/user", "GET");
  return this.makeRequest<User>("/users/me/");
}

  // User Management - matching documentation
async getUsers(): Promise<ApiResponse<User[]>> {
  return this.makeRequest<User[]>("/users/");        // <-- add trailing slash
}

  async getUser(id: number): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/users/${id}`);
  }

  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/dashboard/statistics");
  }

  async getTasks(params?: { project?: number }): Promise<ApiResponse<BackendTask[]>> {
  const qs = params?.project ? `?project=${params.project}` : "";
  return this.makeRequest<BackendTask[]>(`/tasks/${qs}`);
}

  // Task Management - matching documentation
async createTask(task: Partial<Task> & {
  // allowing UI-friendly fields if they're passed
  projectId?: number;
  name?: string;
  assigneeIds?: string[];
  customFields?: Record<string, any>;
}): Promise<ApiResponse<BackendTask>> {
  // map UI -> backend
  const body: any = {};
  
  // Project: convert to number if provided
  const projectId = task.project_id ?? task.projectId;
  if (projectId !== undefined && projectId !== null) {
    body.project = typeof projectId === 'string' ? Number(projectId) : projectId;
  }
  
  // Title/Name
  body.title = task.title ?? task.name ?? "New Task";
  
  // Description
  body.description = task.description ?? "";
  
  // Status
  if (task.status_id) {
    // If status_id is provided, don't include status
  } else {
    body.status = (task as any).status || "to-do";
  }
  
  // Priority
  if (task.priority_id) {
    // If priority_id is provided, don't include priority
  } else {
    body.priority = (task as any).priority || "medium";
  }
  
  // Progress
  body.progress = (task as any).progress ?? 0;
  
  // Due date: convert empty string to null
  const dueDate = task.due_date ?? (task as any).dueDate;
  body.due_date = (dueDate && dueDate.trim() !== "") ? dueDate : null;
  
  // Custom fields
  body.custom_fields = task.customFields ?? {};

  // Assignees: only include if provided
  const uiAssignees = (task as any).assigneeIds as string[] | undefined;
  if (uiAssignees && uiAssignees.length > 0) {
    body.assignee_ids = uiAssignees.map((s) => Number(s)).filter(Number.isFinite);
  }

  return this.makeRequest<BackendTask>("/tasks/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}


async updateTask(
  id: number,
  patch: Partial<{
    projectId: number;
    name: string;
    description: string;
    status: string;
    priority: string;
    progress: number;
    dueDate: string | null;
    assigneeIds: string[];
    customFields: Record<string, any>;
  } & Task>
): Promise<ApiResponse<BackendTask>> {
  const body: any = {};

  // Project: convert to number if provided, prioritize projectId over project_id
  if (patch.projectId !== undefined) {
    body.project = typeof patch.projectId === 'string' ? Number(patch.projectId) : patch.projectId;
  } else if ((patch as any).project_id !== undefined) {
    body.project = typeof (patch as any).project_id === 'string' ? Number((patch as any).project_id) : (patch as any).project_id;
  }
  
  // Title/Name: prioritize name over title
  if (patch.name !== undefined) {
    body.title = patch.name;
  } else if ((patch as any).title !== undefined) {
    body.title = (patch as any).title;
  }
  
  // Description
  if (patch.description !== undefined) {
    body.description = patch.description;
  }
  
  // Status
  if ((patch as any).status !== undefined) {
    body.status = (patch as any).status;
  }
  
  // Priority
  if ((patch as any).priority !== undefined) {
    body.priority = (patch as any).priority;
  }
  
  // Progress
  if ((patch as any).progress !== undefined) {
    body.progress = (patch as any).progress;
  }
  
  // Due date: convert empty string to null
  if (patch.dueDate !== undefined) {
    body.due_date = (patch.dueDate && patch.dueDate.trim && patch.dueDate.trim() !== "") ? patch.dueDate : null;
  } else if ((patch as any).due_date !== undefined) {
    const dueDate = (patch as any).due_date;
    body.due_date = (dueDate && typeof dueDate === 'string' && dueDate.trim() !== "") ? dueDate : null;
  }
  
  // Sprint: handle sprint assignment
  if ((patch as any).sprint !== undefined) {
    body.sprint = (patch as any).sprint === null ? null : Number((patch as any).sprint);
  } else if ((patch as any).sprint_id !== undefined) {
    body.sprint = (patch as any).sprint_id === null ? null : Number((patch as any).sprint_id);
  }
  
  // Custom fields
  if (patch.customFields !== undefined) {
    body.custom_fields = patch.customFields;
  }

  // Assignees: only include if provided and not empty
  if (patch.assigneeIds !== undefined && patch.assigneeIds.length > 0) {
    body.assignee_ids = patch.assigneeIds.map((s) => Number(s)).filter(Number.isFinite);
  } else if (patch.assigneeIds !== undefined && patch.assigneeIds.length === 0) {
    // Explicitly set empty array if provided
    body.assignee_ids = [];
  }

  return this.makeRequest<BackendTask>(`/tasks/${id}/`, {
    method: "PATCH",                          // <-- PATCH not PUT
    body: JSON.stringify(body),
  });
}


  async deleteTask(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/tasks/${id}/`, {
      method: "DELETE",
    });
  }

  // Task Media
  async getTaskMedia(taskId: number): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/tasks/get-media?task_id=${taskId}`);
  }

  async uploadTaskMedia(taskId: number, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("task_id", taskId.toString());

    return this.makeRequest<any>("/tasks/upload-media", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });
  }

  // Project Management
 async getProjects(): Promise<ApiResponse<Project[]>> {
  return this.makeRequest<Project[]>("/projects/");  // <-- add trailing slash
}

  async createProject(
    project: Partial<Project>,
  ): Promise<ApiResponse<Project>> {
    return this.makeRequest<Project>("/projects/", {
      method: "POST",
      body: JSON.stringify(project),
    });
  }

  async updateProject(
    id: number,
    project: Partial<Project>,
  ): Promise<ApiResponse<Project>> {
    return this.makeRequest<Project>("/projects/update", {
      method: "PUT",
      body: JSON.stringify({ id, ...project }),
    });
  }

async deleteProject(id: number): Promise<ApiResponse<any>> {
  // note the id in the path and trailing slash, no body needed
  return this.makeRequest<any>(`/projects/${id}/`, {
    method: "DELETE",
  });
}

  // Status Management
  async getStatuses(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/statuses");
  }

  async createStatus(status: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/status/store", {
      method: "POST",
      body: JSON.stringify(status),
    });
  }

  // Priority Management
  async getPriorities(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/priorities");
  }

  async createPriority(priority: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/priority/store", {
      method: "POST",
      body: JSON.stringify(priority),
    });
  }

  // Notes Management
  async getNotes(): Promise<ApiResponse<Note[]>> {
    return this.makeRequest<Note[]>("/notes");
  }

  async createNote(note: Partial<Note>): Promise<ApiResponse<Note>> {
    return this.makeRequest<Note>("/notes/store", {
      method: "POST",
      body: JSON.stringify(note),
    });
  }

  async updateNote(
    id: number,
    note: Partial<Note>,
  ): Promise<ApiResponse<Note>> {
    return this.makeRequest<Note>("/notes/update", {
      method: "PUT",
      body: JSON.stringify({ id, ...note }),
    });
  }

  async deleteNote(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/notes/destroy", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Meetings Management
  async getMeetings(): Promise<ApiResponse<Meeting[]>> {
    return this.makeRequest<Meeting[]>("/meetings");
  }

  async createMeeting(
    meeting: Partial<Meeting>,
  ): Promise<ApiResponse<Meeting>> {
    return this.makeRequest<Meeting>("/meetings/store", {
      method: "POST",
      body: JSON.stringify(meeting),
    });
  }

  async updateMeeting(
    id: number,
    meeting: Partial<Meeting>,
  ): Promise<ApiResponse<Meeting>> {
    return this.makeRequest<Meeting>("/meetings/update", {
      method: "PUT",
      body: JSON.stringify({ id, ...meeting }),
    });
  }

  async deleteMeeting(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/meetings/destroy", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Todos Management - matching documentation
  async getTodos(): Promise<ApiResponse<Todo[]>> {
    return this.makeRequest<Todo[]>("/todos");
  }

  async createTodo(todo: Partial<Todo>): Promise<ApiResponse<Todo>> {
    return this.makeRequest<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(todo),
    });
  }

  async updateTodo(id: number, todo: Partial<Todo>): Promise<ApiResponse<Todo>> {
    return this.makeRequest<Todo>("/todos", {
      method: "PUT",
      body: JSON.stringify({ id, ...todo }),
    });
  }

  async deleteTodo(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/todos/${id}`, {
      method: "DELETE",
    });
  }

  // Time Logs - Backend API
  async getTimeLogs(params?: { task?: number; user?: number; start_date?: string; end_date?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.task) queryParams.append("task", String(params.task));
    if (params?.user) queryParams.append("user", String(params.user));
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);
    
    const query = queryParams.toString();
    const url = query ? `/time-logs/?${query}` : `/time-logs/`;
    return this.makeRequest<any[]>(url);
  }

  async createTimeLog(data: { task_id?: number; description: string; duration_seconds?: number; started_at?: string; ended_at?: string }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/time-logs/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async logWork(data: { description: string; task_id?: number; duration_seconds?: number; started_at?: string; ended_at?: string }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/time-logs/log_work/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTimeLog(id: string, data: Partial<any>): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/time-logs/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTimeLog(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/time-logs/${id}/`, {
      method: "DELETE",
    });
  }

  async getTimeLogSummary(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/time-logs/summary/");
  }

  async getAgentsSummary(params?: { start_date?: string; end_date?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);
    
    const query = queryParams.toString();
    return this.makeRequest<any>(`/time-logs/agents_summary/${query ? `?${query}` : ""}`);
  }

  // Legacy Time Tracker methods (for backward compatibility)
  async startTimeTracker(data?: { task_id?: number; description?: string }): Promise<ApiResponse<TimeEntry>> {
    return this.makeRequest<TimeEntry>("/time-logs/start_timer/", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  }

  async stopTimeTracker(id: number): Promise<ApiResponse<TimeEntry>> {
    return this.makeRequest<TimeEntry>(`/time-logs/${id}/stop_timer/`, {
      method: "POST",
    });
  }

  async getTimeEntries(): Promise<ApiResponse<TimeEntry[]>> {
    return this.getTimeLogs();
  }

  async deleteTimeEntry(id: number): Promise<ApiResponse<any>> {
    return this.deleteTimeLog(String(id));
  }

  // Tags Management - as per documentation
  async getTags(): Promise<ApiResponse<Tag[]>> {
    return this.makeRequest<Tag[]>("/tags");
  }

  async createTag(tag: Partial<Tag>): Promise<ApiResponse<Tag>> {
    return this.makeRequest<Tag>("/tags", {
      method: "POST",
      body: JSON.stringify(tag),
    });
  }

  async updateTag(id: number, tag: Partial<Tag>): Promise<ApiResponse<Tag>> {
    return this.makeRequest<Tag>(`/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify(tag),
    });
  }

  async deleteTag(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/tags/${id}`, {
      method: "DELETE",
    });
  }

  // Support Tickets - as per documentation
  async getTickets(): Promise<ApiResponse<SupportTicket[]>> {
    return this.makeRequest<SupportTicket[]>("/tickets");
  }

  async createTicket(ticket: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    return this.makeRequest<SupportTicket>("/tickets", {
      method: "POST",
      body: JSON.stringify(ticket),
    });
  }

  async getTicket(id: number): Promise<ApiResponse<SupportTicket>> {
    return this.makeRequest<SupportTicket>(`/tickets/${id}`);
  }

  // Leave Requests
  async getLeaveRequests(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/leave-requests");
  }

  async createLeaveRequest(request: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/leave-requests/store", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async updateLeaveRequest(
    id: number,
    request: any,
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/leave-requests/update", {
      method: "POST",
      body: JSON.stringify({ id, ...request }),
    });
  }

  async deleteLeaveRequest(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/leave-requests/destroy/${id}`, {
      method: "DELETE",
    });
  }

  // Workspaces
  async getWorkspaces(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/workspaces");
  }

  async createWorkspace(workspace: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/workspaces/store", {
      method: "POST",
      body: JSON.stringify(workspace),
    });
  }

 // Notifications Service Methods
async getNotificationTypes(): Promise<ApiResponse<any[]>> {
  return this.makeRequest<any[]>("/notifications/types");
}

async listNotifications(): Promise<ApiResponse<any[]>> {
  return this.makeRequest<any[]>("/notifications");
}

async getUnreadNotificationsCount(): Promise<ApiResponse<{ count: number }>> {
  return this.makeRequest<{ count: number }>("/unread-notifications");
}

async getNotificationUrl(id: number): Promise<ApiResponse<{ url: string }>> {
  return this.makeRequest<{ url: string }>(`/notifications/${id}/url`);
}

async markAllAsRead(): Promise<ApiResponse<any>> {
  return this.makeRequest<any>("/notifications/mark-as-read", {
    method: "POST",
  });
}

async updateNotificationStatus(
  id: number,
  status: string
): Promise<ApiResponse<any>> {
  return this.makeRequest<any>(`/notifications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

async deleteNotification(id: number): Promise<ApiResponse<any>> {
  return this.makeRequest<any>(`/notifications/destroy/${id}`, {
    method: "DELETE",
  });
}

async deleteMultipleNotifications(ids: number[]): Promise<ApiResponse<any>> {
  return this.makeRequest<any>("/notifications", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}
  // Clients
  async getClients(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/clients");
  }

  async createClient(client: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/clients/store", {
      method: "POST",
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: number, client: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/clients/update", {
      method: "POST",
      body: JSON.stringify({ id, ...client }),
    });
  }

  async deleteClient(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/clients/destroy/${id}`, {
      method: "DELETE",
    });
  }

  // Settings
  async getSettings(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/settings/general_settings");
  }

  async updateSettings(settings: any): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/settings/update", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // User Management
  async updateUser(
    id: number,
    userData: Partial<User>,
  ): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async createUser(userData: any): Promise<ApiResponse<User>> {
    return this.makeRequest<User>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  logout(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Test API connectivity
  // Social Authentication
  async socialLogin(
    credentials: SocialLoginCredentials,
  ): Promise<ApiResponse<SocialAuthResponse>> {
    // Try multiple possible social auth endpoints
    const endpoints = [
      `/auth/google`, // Google OAuth endpoint
      `/auth/social/${credentials.provider}`, // RESTful pattern
      "/social/auth", // Generic social auth endpoint
      "/auth/social", // Alternative pattern
      `/login/${credentials.provider}`, // Simple pattern
    ];

    for (const endpoint of endpoints) {
      try {
        if (isDevelopment) {
          console.log(`🔐 Trying social login endpoint: ${endpoint}`);
        }

        // For Google auth endpoint, send just the token
        const requestBody = endpoint === '/auth/google' 
          ? JSON.stringify({ token: credentials.token })
          : JSON.stringify({
              ...credentials,
              isApi: true,
            });

        const response = await this.makeRequest<SocialAuthResponse>(endpoint, {
          method: "POST",
          body: requestBody,
        });

        if (response.success && response.data) {
          // Handle different response formats
          const accessToken = (response.data as any).access_token || (response.data as any).token;
          const user = (response.data as any).user;
          
          if (accessToken && user) {
            localStorage.setItem("auth_token", accessToken);
            localStorage.setItem("user", JSON.stringify(user));
            
            // Update response data format
            response.data = {
              user: user,
              token: accessToken,
            } as SocialAuthResponse;
            
            if (isDevelopment) {
              console.log(
                `✅ Social login successful with endpoint: ${endpoint}`,
              );
            }
            return response;
          }
        } else if (response.success === false) {
          // Check if this is a routing error vs authentication error
          if (
            response.message?.includes("404") ||
            response.message?.includes("Method Not Allowed") ||
            response.message?.includes("not supported") ||
            response.message?.toLowerCase().includes("route")
          ) {
            if (isDevelopment) {
              console.log(
                `⚠️ Endpoint ${endpoint} not available, trying next...`,
              );
            }
            // Continue to next endpoint
          } else {
            // This is a real authentication error, return it
            console.log(
              `❌ Social login failed with valid endpoint ${endpoint}:`,
              response.message,
            );
            return response;
          }
        }
      } catch (error: any) {
        console.log(`⚠️ Endpoint ${endpoint} failed:`, error.message);
        // Continue to next endpoint
      }
    }

    // If all endpoints fail in development, try mock response as emergency fallback
    if (isDevelopment) {
      console.warn(
        "🔄 All social login endpoints failed, using emergency mock fallback",
      );
      return this.getMockResponse<SocialAuthResponse>(
        `/auth/social/${credentials.provider}`,
        "POST",
        JSON.stringify(credentials),
      );
    }

    // In production, return detailed error
    return {
      success: false,
      message:
        "Social login failed - unable to find working authentication endpoint. Tried: " +
        endpoints.join(", ") +
        ". Please contact support.",
    };
  }

  async assignUsersToTask(taskId: number, userIds: number[]) {
    return this.makeRequest<any>(`/tasks/${taskId}/assign_users/`, {
      method: "POST",
      body: JSON.stringify({ user_ids: userIds }),
    });
  }


  async testConnection(): Promise<{ success: boolean; message: string }> {
    console.log("🔍 Testing API connectivity...");

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort("Request timeout");
      }
    }, 5000);

    try {
      // Try a simple GET request to test connectivity
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          success: true,
          message:
            "✅ API connection successful! Server is reachable and responding.",
        };
      } else {
        return {
          success: false,
          message: `⚠️ API responded with status ${response.status}: ${response.statusText}. Check server configuration.`,
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("🚨 API connectivity test failed:", error);

      let errorMessage = "🔌 Connection failed: ";

      if (error.name === "AbortError") {
        errorMessage +=
          "Request timeout (5s) - server is not responding in time. This is normal during development.";
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        errorMessage +=
          "Network error - server may be down or CORS not configured.";
      } else if (error.message && error.message.includes("CORS")) {
        errorMessage +=
          "CORS policy blocking request - check server CORS settings.";
      } else {
        errorMessage += error.message || "Unknown network error";
      }

      if (isDevelopment) {
        errorMessage +=
          "\n\n🔧 Development Mode: Mock data is available with credentials:\n📧 Email: demo@example.com\n🔒 Password: password";
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // Invitation methods
  async inviteUserToProject(
    projectId: string | number,
    email: string,
    role: "admin" | "member" | "viewer" = "member",
    message?: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest(`/projects/${projectId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email, role, message }),
    });
  }

  async getProjectInvitations(projectId: string | number): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/projects/${projectId}/invitations`);
  }

  async acceptInvitation(token: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async getInvitationByToken(token: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/invitations/${token}`);
  }

  // Tenant Management (Super-admin only)
  async getTenants(): Promise<ApiResponse<any[]>> {
    return this.makeRequest("/tenants/");
  }

  async getTenant(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tenants/${id}/`);
  }

  async createTenant(data: {
    company_id?: string;
    subdomain?: string;
    name: string;
    email?: string;
    is_active?: boolean;
    is_trial?: boolean;
    // Optional initial admin user fields
    admin_email?: string;
    admin_password?: string;
    admin_first_name?: string;
    admin_last_name?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest("/tenants/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTenant(
    id: string,
    data: Partial<{
      company_id: string;
      subdomain: string;
      name: string;
      email: string;
      is_active: boolean;
      is_trial: boolean;
    }>
  ): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tenants/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTenant(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tenants/${id}/`, {
      method: "DELETE",
    });
  }

  async activateTenant(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tenants/${id}/activate/`, {
      method: "POST",
    });
  }

  async deactivateTenant(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/tenants/${id}/deactivate/`, {
      method: "POST",
    });
  }

  // Goals & Alignment
  async getGoals(params?: { status?: string }): Promise<ApiResponse<any[]>> {
    const qs = params?.status ? `?status=${params.status}` : "";
    return this.makeRequest<any[]>(`/goals/${qs}`);
  }

  async createGoal(goal: {
    title: string;
    description?: string;
    status?: string;
    target_value?: number;
    weight?: number;
    start_date?: string;
    target_date?: string;
    parent_goal?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest("/goals/", {
      method: "POST",
      body: JSON.stringify(goal),
    });
  }

  async updateGoal(id: string, goal: Partial<any>): Promise<ApiResponse<any>> {
    return this.makeRequest(`/goals/${id}/`, {
      method: "PUT",
      body: JSON.stringify(goal),
    });
  }

  async deleteGoal(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/goals/${id}/`, {
      method: "DELETE",
    });
  }

  async linkEntityToGoal(goalId: string, entityType: string, entityId: string, weight?: number): Promise<ApiResponse<any>> {
    return this.makeRequest(`/goals/${goalId}/link_entity/`, {
      method: "POST",
      body: JSON.stringify({ entity_type: entityType, entity_id: entityId, weight: weight || 1.0 }),
    });
  }

  async getGoalProgress(goalId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/goals/${goalId}/progress/`);
  }

  // Comments
  async getComments(contentType: string, objectId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/comments/?content_type=${contentType}&object_id=${objectId}`);
  }

  async createComment(comment: {
    content_type: string;
    object_id: string;
    content: string;
    parent?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest("/comments/", {
      method: "POST",
      body: JSON.stringify(comment),
    });
  }

  async updateComment(id: string, content: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/comments/${id}/`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/comments/${id}/`, {
      method: "DELETE",
    });
  }

  // Attachments
  async getAttachments(contentType: string, objectId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/attachments/?content_type=${contentType}&object_id=${objectId}`);
  }

  async createAttachment(attachment: {
    content_type: string;
    object_id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest("/attachments/", {
      method: "POST",
      body: JSON.stringify(attachment),
    });
  }

  async deleteAttachment(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/attachments/${id}/`, {
      method: "DELETE",
    });
  }

  async startTimer(taskId: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/time-logs/start_timer/", {
      method: "POST",
      body: JSON.stringify({ task_id: taskId }),
    });
  }

  async stopTimer(timeLogId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/time-logs/${timeLogId}/stop_timer/`, {
      method: "POST",
    });
  }

  async getActiveTimer(): Promise<ApiResponse<any>> {
    return this.makeRequest("/time-logs/active_timer/");
  }

  // Custom Fields
  async getCustomFields(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>("/custom-fields/");
  }

  async createCustomField(field: {
    name: string;
    field_type: string;
    width?: number;
    options?: string[];
    order?: number;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest("/custom-fields/", {
      method: "POST",
      body: JSON.stringify(field),
    });
  }

  async updateCustomField(id: string, field: Partial<{
    name: string;
    field_type: string;
    width: number;
    options: string[];
    order: number;
  }>): Promise<ApiResponse<any>> {
    return this.makeRequest(`/custom-fields/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(field),
    });
  }

  async deleteCustomField(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/custom-fields/${id}/`, {
      method: "DELETE",
    });
  }

  // Sprint Management
  async getSprints(params?: { project?: number; status?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.project) queryParams.append("project", String(params.project));
    if (params?.status) queryParams.append("status", params.status);
    
    const query = queryParams.toString();
    return this.makeRequest<any[]>(`/sprints/${query ? `?${query}` : ""}`);
  }

  async getSprint(id: string | number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/sprints/${id}/`);
  }

  async createSprint(data: {
    name: string;
    project_id: number;
    goal?: string;
    description?: string;
    start_date: string;
    end_date: string;
    status?: string;
    velocity_target?: number;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/sprints/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSprint(id: string | number, data: Partial<{
    name?: string;
    goal?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    velocity_target?: number;
    actual_velocity?: number;
    retrospective_notes?: string;
    what_went_well?: string;
    what_to_improve?: string;
    action_items?: string;
  }>): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/sprints/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteSprint(id: string | number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/sprints/${id}/`, {
      method: "DELETE",
    });
  }

  async addSprintMember(sprintId: string | number, userId: number, role?: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/sprints/${sprintId}/add_member/`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, role }),
    });
  }

  async removeSprintMember(sprintId: string | number, userId: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/sprints/${sprintId}/remove_member/`, {
      method: "DELETE",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getSprintBurndown(sprintId: string | number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/sprints/${sprintId}/burndown/`);
  }

  async getSprintStatistics(sprintId: string | number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/sprints/${sprintId}/statistics/`);
  }

  async addTasksToSprint(sprintId: string | number, taskIds: number[]): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/sprints/${sprintId}/add_tasks/`, {
      method: "POST",
      body: JSON.stringify({ task_ids: taskIds }),
    });
  }

  async removeTasksFromSprint(sprintId: string | number, taskIds: number[]): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/sprints/${sprintId}/remove_tasks/`, {
      method: "POST",
      body: JSON.stringify({ task_ids: taskIds }),
    });
  }

  // Task Status Management
  async getTaskStatuses(params?: { is_active?: boolean }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) queryParams.append("is_active", String(params.is_active));
    const query = queryParams.toString();
    return this.makeRequest<any[]>(`/task-statuses/${query ? `?${query}` : ""}`);
  }

  async getTaskStatus(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/task-statuses/${id}/`);
  }

  async createTaskStatus(data: {
    name: string;
    slug: string;
    color?: string;
    icon?: string;
    order?: number;
    is_default?: boolean;
    is_final?: boolean;
    description?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/task-statuses/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTaskStatus(id: string, data: Partial<{
    name?: string;
    slug?: string;
    color?: string;
    icon?: string;
    order?: number;
    is_default?: boolean;
    is_final?: boolean;
    description?: string;
    is_active?: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/task-statuses/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTaskStatus(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/task-statuses/${id}/`, {
      method: "DELETE",
    });
  }

  async reorderTaskStatus(id: string, order: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/task-statuses/${id}/reorder/`, {
      method: "POST",
      body: JSON.stringify({ order }),
    });
  }

  async bulkReorderTaskStatuses(orders: Array<{ id: string; order: number }>): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/task-statuses/bulk_reorder/", {
      method: "POST",
      body: JSON.stringify({ orders }),
    });
  }

  async getTaskStatusStatistics(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/task-statuses/statistics/");
  }

  // Task Priority Management
  async getTaskPriorities(params?: { is_active?: boolean }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) queryParams.append("is_active", String(params.is_active));
    const query = queryParams.toString();
    return this.makeRequest<any[]>(`/task-priorities/${query ? `?${query}` : ""}`);
  }

  async getTaskPriority(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/task-priorities/${id}/`);
  }

  async createTaskPriority(data: {
    name: string;
    slug: string;
    color?: string;
    icon?: string;
    order?: number;
    weight?: number;
    description?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/task-priorities/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTaskPriority(id: string, data: Partial<{
    name?: string;
    slug?: string;
    color?: string;
    icon?: string;
    order?: number;
    weight?: number;
    description?: string;
    is_active?: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/task-priorities/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTaskPriority(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/task-priorities/${id}/`, {
      method: "DELETE",
    });
  }

  async reorderTaskPriority(id: string, order: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/task-priorities/${id}/reorder/`, {
      method: "POST",
      body: JSON.stringify({ order }),
    });
  }

  async bulkReorderTaskPriorities(orders: Array<{ id: string; order: number }>): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/task-priorities/bulk_reorder/", {
      method: "POST",
      body: JSON.stringify({ orders }),
    });
  }

  async getTaskPriorityStatistics(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>("/task-priorities/statistics/");
  }
}

export const apiService = new ApiService();
