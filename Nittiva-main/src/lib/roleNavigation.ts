// Role-based navigation utility
export type UserRole =
  | "admin"
  | "manager"
  | "developer"
  | "designer"
  | "member";

export interface RoleRedirectConfig {
  route: string;
  description: string;
}

// Define role-based redirect configurations
export const roleRedirects: Record<UserRole, RoleRedirectConfig> = {
  admin: {
    route: "/dashboard/users", // Admins go to user management
    description: "Access admin dashboard with user management",
  },
  manager: {
    route: "/dashboard/projects", // Managers go to project overview
    description: "Access project management dashboard",
  },
  developer: {
    route: "/dashboard/tasks", // Developers go to task management
    description: "Access development task dashboard",
  },
  designer: {
    route: "/dashboard/projects", // Designers go to projects
    description: "Access design project dashboard",
  },
  member: {
    route: "/dashboard", // Regular members go to main dashboard
    description: "Access general dashboard",
  },
};

/**
 * Get the appropriate redirect route based on user role
 * @param role - User role
 * @returns Redirect route path
 */
export function getRedirectRoute(role?: string): string {
  // Default to member role if no role provided or role is unrecognized
  const userRole = (role as UserRole) || "member";

  // Check if the role exists in our configuration
  if (userRole in roleRedirects) {
    return roleRedirects[userRole].route;
  }

  // Fallback to general dashboard
  return roleRedirects.member.route;
}

/**
 * Get role description for logging/debugging purposes
 * @param role - User role
 * @returns Role description
 */
export function getRoleDescription(role?: string): string {
  const userRole = (role as UserRole) || "member";

  if (userRole in roleRedirects) {
    return roleRedirects[userRole].description;
  }

  return roleRedirects.member.description;
}
