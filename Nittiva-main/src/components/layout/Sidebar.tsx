// src/components/layout/Sidebar.tsx
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { useTask } from "@/context/TaskContext";
import { useProject } from "@/context/ProjectContext";
import { Badge } from "@/components/ui/badge";

// Small helper chip
function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-200 border border-dashboard-border">
      {count}
    </span>
  );
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const me = useMemo(() => apiService.getCurrentUser(), []);
  const myId = String(me?.id ?? "");

  // contexts
  const { tasks, refresh: refreshTasks, loading: tasksLoading } = useTask();
  const {
    projects,
    refresh: refreshProjects, // assumes your ProjectContext exposes this
  } = useProject();

  // initial load
  useEffect(() => {
    // load both, once
    refreshProjects?.().catch(() => undefined);
    refreshTasks().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log("sushant tasks", tasks);

  // compute my projects from my assigned tasks
  const myProjectStats = useMemo(() => {
    // tasks assigned to me
    const mine = tasks.filter((t) => (t.assigneeIds || []).includes(myId));
    const byProject: Record<string, number> = {};
    for (const t of mine) {
      const pid = String(t.projectId ?? "");
      if (!pid) continue;
      byProject[pid] = (byProject[pid] || 0) + 1;
    }
    return byProject; // { "10": 2, "11": 5, ... }
  }, [tasks, myId]);

  const myProjectIds = useMemo(
    () => Object.keys(myProjectStats),
    [myProjectStats],
  );

  // final project list for sidebar = only projects where I have tasks
  const myProjects = useMemo(() => {
    if (!projects?.length) return [];
    const setIds = new Set(myProjectIds.map(String));
    return projects
      .filter((p: any) => setIds.has(String(p.id)))
      .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
  }, [projects, myProjectIds]);

  // helper: active route highlight
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
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-black font-normal text-sm">TM</span>
                </div>
                <span className="text-white font-normal text-lg">
                  TaskManager
                </span>
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
        {/* Dashboard */}
        <SectionTitle visible={!isCollapsed} title="DASHBOARD" />
        <NavItem
          collapsed={isCollapsed}
          icon={LayoutDashboard}
          label="Dashboard"
          to="/dashboard"
          active={isActive("/dashboard")}
        />

        {/* Projects (only mine) */}
        <SectionTitle visible={!isCollapsed} title="PROJECTS" />
        {/* Optional: for admins show "All Projects" entry */}
        {me?.role === "admin" && (
          <NavItem
            collapsed={isCollapsed}
            icon={FolderOpen}
            label="All Projects"
            to="/dashboard/projects"
            active={location.pathname.startsWith("/dashboard/projects") &&
              location.pathname === "/dashboard/projects"}
          />
        )}

        {/* My projects list */}
        {tasksLoading && !myProjects.length ? (
          <div className={cn("px-4 text-xs text-gray-500", isCollapsed && "hidden")}>
            Loading…
          </div>
        ) : myProjects.length === 0 ? (
          <div className={cn("px-4 text-xs text-gray-500", isCollapsed && "hidden")}>
            No projects assigned yet.
          </div>
        ) : (
          <div className="space-y-1 px-2 mt-1">
            {myProjects.map((p: any) => {
              const path = `/dashboard/projects/${p.id}`;
              const myCount = myProjectStats[String(p.id)] || 0;
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(path)}
                  className={cn(
                    "sidebar-item group w-full text-left",
                    isActive(path) && "active",
                    isCollapsed && "justify-center px-2",
                  )}
                  title={p.name}
                >
                  <FolderOpen className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="truncate"
                      >
                        {p.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isCollapsed && <CountBadge count={myCount} />}
                </button>
              );
            })}
          </div>
        )}

        {/* Project/Task mgmt (keep whatever you already had) */}
        <SectionTitle visible={!isCollapsed} title="PROJECT MANAGEMENT" />
        <NavItem
          collapsed={isCollapsed}
          icon={CheckSquare}
          label="Task List"
          to="/dashboard/tasks"
          active={isActive("/dashboard/tasks")}
        />
        <NavItem
          collapsed={isCollapsed}
          icon={Tag}
          label="Statuses"
          to="/dashboard/statuses"
          active={isActive("/dashboard/statuses")}
        />
        <NavItem
          collapsed={isCollapsed}
          icon={Star}
          label="Priorities"
          to="/dashboard/priorities"
          active={isActive("/dashboard/priorities")}
        />

        {/* Team / Collab – unchanged */}
        <SectionTitle visible={!isCollapsed} title="TEAM" />
        <NavItem
          collapsed={isCollapsed}
          icon={Building}
          label="Workspaces"
          to="/dashboard/workspaces"
          active={isActive("/dashboard/workspaces")}
        />
        <NavItem
          collapsed={isCollapsed}
          icon={MessageCircle}
          label="Chat"
          to="/dashboard/chat"
          active={isActive("/dashboard/chat")}
        />
        <NavItem
          collapsed={isCollapsed}
          icon={Users}
          label="Users"
          to="/dashboard/users"
          active={isActive("/dashboard/users")}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dashboard-border">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-gray-500"
            >
              Task Management v1.0
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SectionTitle({ visible, title }: { visible: boolean; title: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 mb-2 mt-4"
        >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavItem({
  collapsed,
  icon: Icon,
  label,
  to,
  active,
}: {
  collapsed: boolean;
  icon: any;
  label: string;
  to: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "sidebar-item group",
        active && "active",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
