import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Tag,
  Star,
  Building,
  MessageCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Calendar,
  StickyNote,
  Plane,
  ListTodo,
  BellRing,
  Receipt,
  User,
  LogOut,
  Settings,
  Shield,
  Building2,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { useTask } from "@/context/TaskContext";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sidebarItems = [
  {
    title: "ADMIN",
    items: [
      { name: "Create Tenant", icon: Building2, path: "/dashboard/admin/tenants" },
    ],
  },
  {
    title: "DASHBOARD",
    items: [{ name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" }],
  },
  {
    title: "PROJECT MANAGEMENT",
    items: [
      { name: "Tasks", icon: CheckSquare, path: "/dashboard/tasks" },
      { name: "Progress", icon: TrendingUp, path: "/dashboard/progress" },
      { name: "Timeline", icon: Calendar, path: "/dashboard/timeline" },
      { name: "Sprint", icon: Target, path: "/dashboard/sprint" },
      { name: "Statuses", icon: Tag, path: "/dashboard/statuses" },
      { name: "Priorities", icon: Star, path: "/dashboard/priorities" },
    ],
  },
  {
    title: "COLLABORATION",
    items: [
      { name: "Meetings", icon: Calendar, path: "/dashboard/meetings" },
      { name: "Notes", icon: StickyNote, path: "/dashboard/notes" },
      { name: "Todos", icon: ListTodo, path: "/dashboard/todos" },
      { name: "Chat", icon: MessageCircle, path: "/dashboard/chat" },
      { name: "Invoice", icon: Receipt, path: "/dashboard/invoice" },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { name: "Clients", icon: Building, path: "/dashboard/clients" },
      { name: "Workspaces", icon: Building, path: "/dashboard/workspaces" },
    ],
  },
  {
    title: "TEAM & HR",
    items: [
      { name: "Users", icon: Users, path: "/dashboard/users" },
      { name: "Leave Requests", icon: Plane, path: "/dashboard/leave-requests" },
      { name: "Notifications", icon: BellRing, path: "/dashboard/notifications" },
    ],
  },
];

function isAssignedToMe(task: any, myId: string) {
  if (Array.isArray(task?.assigneeIds) && task.assigneeIds.length) {
    return task.assigneeIds.some((id: any) => String(id) === String(myId));
  }
  if (Array.isArray(task?.assignees) && task.assignees.length) {
    return task.assignees.some((u: any) => String(u?.id) === String(myId));
  }
  return false;
}

function taskProjectId(task: any): string | null {
  // support either projectId or project (number or string)
  const pid = task?.projectId ?? task?.project;
  return pid == null ? null : String(pid);
}

export default function EnhancedSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const { projects, currentProject, loading: projectsLoading,  addProject, selectProject, deleteProject } =
    useProject();

  const { user, logout } = useAuth();
  const { tasks } = useTask();
  const [visibleProjects, setVisibleProjects] = useState<any[]>([]);
  const [sprintCount, setSprintCount] = useState(0);

  const me = useMemo(() => apiService.getCurrentUser(), []);
  const myId = String(me?.id ?? user?.id ?? "");
  const isAgent = (user as any)?.role === "agent" || (me as any)?.role === "agent";

  // Map of projectId -> number of tasks assigned to the current user
  const myProjectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (!isAssignedToMe(t, myId)) continue;
      const pid = taskProjectId(t);
      if (!pid) continue;
      counts[pid] = (counts[pid] || 0) + 1;
    }
    return counts;
  }, [tasks, myId]);

  // Load sprint count for agents
  useEffect(() => {
    if (isAgent && (user?.id || me?.id)) {
      const loadSprintCount = async () => {
        try {
          const response = await apiService.getSprints();
          if (response.success && response.data) {
            const dataArray = Array.isArray(response.data) ? response.data : (response.data.results || []);
            // Count sprints where agent is a member or has tasks assigned
            setSprintCount(dataArray.length);
          }
        } catch (error) {
          console.error("Failed to load sprint count:", error);
        }
      };
      loadSprintCount();
    }
  }, [isAgent, user?.id, me?.id]);

  
  // If admin -> show all projects. Otherwise -> only those with at least one assigned task.
  // const visibleProjects = useMemo(() => {
  //   const role = (user as any)?.role || me?.role;
  //   const all = projects ?? [];
  //   if (String(role).toLowerCase() === "admin") {
  //     return all.map((p: any) => ({
  //       ...p,
  //       // show total if provided, else fallback to my assigned count
  //       taskCount: typeof p.taskCount === "number" ? p.taskCount : (myProjectTaskCounts[String(p.id)] || 0),
  //     }));
  //   }
  //   // non-admin: filter to only projects where user has tasks

  //   return all
  //     .filter((p: any) => myProjectTaskCounts[String(p.id)] > 0)
  //     .map((p: any) => ({
  //       ...p,
  //       taskCount: myProjectTaskCounts[String(p.id)] || 0,
  //     }));
  // }, [projects, myProjectTaskCounts, me?.role, user]);

  
useEffect(() => {
  if (projectsLoading) return;

  const all = projects ?? [];

  // Always show every accessible project; counts are only for the badge.
  setVisibleProjects(
    all.map((p: any) => ({
      ...p,
      taskCount:
        typeof p.taskCount === "number"
          ? p.taskCount
          : (myProjectTaskCounts[String(p.id)] || 0),
    }))
  );
}, [projectsLoading, projects, myProjectTaskCounts]);


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName("");
      setShowProjectForm(false);
    }
  };

  const handleProjectSelect = (project: any) => {
    selectProject(project);
    navigate(`/dashboard/projects/${project.id}`);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "h-screen bg-sidebar border-r border-dashboard-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-dashboard-border">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-black font-bold text-xs">N</span>
                  </div>
                  <span className="font-semibold text-lg tracking-wide">
                    <span className="text-white">NI</span>
                    <span className="text-accent">T</span>
                    <span className="text-accent">T</span>
                    <span className="text-white">IVA</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-sidebar-hover transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Admin section first (if user is admin/superuser) */}
        {sidebarItems.filter(section => section.title === "ADMIN").map((section, idx) => {
          const userRole = (user as any)?.role || (me as any)?.role || "";
          const isSuperUser = (user as any)?.is_superuser || (me as any)?.is_superuser || false;
          const isAdmin = String(userRole).toLowerCase() === "admin" || isSuperUser;
          if (!isAdmin) return null;
          
          return (
            <div key={idx} className="mb-6">
              {!isCollapsed && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              <div className="space-y-1 px-2">
                {section.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "sidebar-item group",
                      isActive(item.path) && "active",
                      isCollapsed && "justify-center px-2",
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Dashboard section */}
        {sidebarItems.filter(section => section.title === "DASHBOARD").map((section, idx) => (
          <div key={idx} className="mb-6">
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
            )}
            <div className="space-y-1 px-2">
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "sidebar-item group",
                    isActive(item.path) && "active",
                    isCollapsed && "justify-center px-2",
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Projects */}
        <div className="mb-6">
          {!isCollapsed && (
            <div className="px-4 mb-2 flex items-center justify-between">
              <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                Projects
              </h3>
              {/* Only show create button for managers, not agents */}
              {(user as any)?.role !== "agent" && (
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="text-gray-500 hover:text-accent transition-colors p-1 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          {showProjectForm && !isCollapsed && (
            <div className="px-4 mb-2">
              <div className="flex gap-1">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  className="bg-dashboard-bg border-dashboard-border text-white text-xs h-7"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddProject();
                    if (e.key === "Escape") setShowProjectForm(false);
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddProject}
                  className="h-7 px-2 bg-accent text-black hover:bg-accent/80"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-1 px-2">
            {projectsLoading && !isCollapsed && (
    <div className="px-2 py-1 text-xs text-gray-500">Loading projects…</div>
  )}

  {!projectsLoading && visibleProjects.length === 0 && !isCollapsed && (
    <div className="px-2 py-1 text-xs text-gray-500">
      No projects assigned to you yet.
    </div>
  )}
            {visibleProjects.map((project: any) => {
              const isExpanded = expandedProjects.includes(String(project.id));
              const isCurrentProject = String(currentProject?.id) === String(project.id);

              return (
                <div key={project.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-normal transition-all duration-200 hover:bg-sidebar-hover group cursor-pointer",
                      isCurrentProject && "bg-accent/10 text-accent",
                      isCollapsed && "justify-center",
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleProjectExpand(String(project.id))}
                        className="text-gray-400 hover:text-white"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        <ChevronDown
                          className={cn(
                            "w-3 h-3 transition-transform",
                            !isExpanded && "-rotate-90",
                          )}
                        />
                      </button>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || "#befeaa" }}
                      />
                      {!isCollapsed && (
                        <div
                          className="flex items-center justify-between flex-1 min-w-0"
                          onClick={() => handleProjectSelect(project)}
                        >
                          <span className="truncate">{project.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                              {project.taskCount ?? 0}
                            </span>
                            {/* Hide delete menu for agents */}
                            {(user as any)?.role !== "agent" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-hover rounded transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => deleteProject(project.id)}
                                    className="text-red-400 focus:text-red-300"
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete Project
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project sub-items */}
                  {isExpanded && !isCollapsed && (
                    <div className="ml-6 space-y-1">
                      <Link
                        to={`/dashboard/projects/${project.id}`}
                        className={cn(
                          "sidebar-item text-xs",
                          isActive(`/dashboard/projects/${project.id}`) && "active",
                        )}
                      >
                        <CheckSquare className="w-4 h-4 flex-shrink-0" />
                        <span>Task List</span>
                      </Link>
                      <Link
                        to={`/dashboard/projects/${project.id}/board`}
                        className={cn(
                          "sidebar-item text-xs",
                          isActive(`/dashboard/projects/${project.id}/board`) && "active",
                        )}
                      >
                        <FolderOpen className="w-4 h-4 flex-shrink-0" />
                        <span>Board</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Other sections (skip ADMIN and DASHBOARD as they're shown separately) */}
        {sidebarItems.filter(s => s.title !== "ADMIN" && s.title !== "DASHBOARD").map((section, idx) => {
          const userRole = (user as any)?.role || (me as any)?.role || "";
          const isManager = userRole === "manager";
          
          return (
            <div key={idx + 1} className="mb-6">
              {!isCollapsed && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-normal text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              <div className="space-y-1 px-2">
                {section.items
                  .filter((item) => {
                    // Hide Tasks link for managers
                    if (item.name === "Tasks" && isManager) {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={cn(
                        "sidebar-item group",
                        isActive(item.path) && "active",
                        isCollapsed && "justify-center px-2",
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.name}</span>
                      )}
                      {isAgent && item.name === "Sprint" && sprintCount > 0 && (
                        <Badge 
                          variant="default" 
                          className="ml-auto bg-accent text-black text-xs font-bold min-w-[20px] h-5 flex items-center justify-center px-1.5"
                        >
                          {sprintCount}
                        </Badge>
                      )}
                    </Link>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dashboard-border">
        <AnimatePresence>
          {!isCollapsed && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-hover transition-colors w-full text-left">
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-normal text-white truncate">
                        {(user as any).full_name ||
                          (user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.name || user.email)}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {user.email}
                      </div>
                      {(user as any).company_id && (user as any).role === "manager" && (
                        <div className="text-xs text-accent mt-1 font-mono">
                          Company ID: {(user as any).company_id}
                        </div>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 focus:text-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="text-xs text-gray-500 text-center">
                Task Management v1.0
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed avatar */}
        {isCollapsed && user && (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 bg-accent rounded-full flex items-center justify-center hover:bg-accent/80 transition-colors">
                  <User className="w-4 h-4 text-black" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-normal">
                  {(user as any).full_name ||
                    (user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.name || user.email)}
                </div>
                <div className="px-2 py-1.5 text-xs text-muted-foreground mb-1">
                  {user.email}
                </div>
                {(user as any).company_id && (user as any).role === "manager" && (
                  <div className="px-2 py-1.5 text-xs text-accent font-mono mb-1">
                    Company ID: {(user as any).company_id}
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 focus:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </motion.div>
  );
}
