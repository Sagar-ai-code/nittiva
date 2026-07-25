// src/context/ProjectContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export type Project = {
  id: string;               // keep string for UI consistency
  name: string;
  color?: string;
  taskCount?: number;
  status?: string;
  // add anything else you show in the sidebar card
};

type ProjectCtx = {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // actions
  reloadProjects: () => Promise<void>;
  selectProject: (projectOrId: string | Project) => void;
  addProject: (name: string) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<void>;
};

const ProjectContext = createContext<ProjectCtx | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken,isLoading: authLoading } = useAuth(); // ← important: wait for token/user
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always fetch ALL accessible projects (owner OR member) – no filter here.
  const reloadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getProjects(); // GET /api/projects/
      if (!res.success) throw new Error(res.message || "Failed to load projects");

      const list = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      const normalized: Project[] = list.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        color: p.color || "#BEFCA9",
        taskCount: p.task_count ?? p.taskCount ?? 0,
        status: p.status ?? "to-do",
      }));

      setProjects(normalized);

      // keep selection if still present; else auto-select first
      if (normalized.length) {
        if (currentProject) {
          const stillExists = normalized.find(p => p.id === currentProject.id);
          setCurrentProject(stillExists ?? normalized[0]);
        } else {
          setCurrentProject(normalized[0]);
        }
      } else {
        setCurrentProject(null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load projects");
      setProjects([]);
      setCurrentProject(null);
    } finally {
      setLoading(false);
    }
  };

  // Select without mutating the list
  const selectProject = (projectOrId: string | Project) => {
    const id = typeof projectOrId === "string" ? projectOrId : projectOrId.id;
    const found = projects.find(p => p.id === id);
    if (found) setCurrentProject(found);
  };

  const addProject = async (name: string) => {
    try {
      const res = await apiService.createProject({ name }); // POST /api/projects/
      if (!res.success || !res.data) throw new Error(res.message || "Failed to create project");

      const created: Project = {
        id: String(res.data.id),
        name: res.data.name,
        color: res.data.color || "#BEFCA9",
        taskCount: res.data.task_count ?? 0,
        status: res.data.status ?? "to-do",
      };

      setProjects(prev => [created, ...prev]);
      setCurrentProject(created);
      return created;
    } catch (e) {
      console.error("addProject error:", e);
      return null;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const res = await apiService.deleteProject(id); // DELETE /api/projects/:id/
      if (!res.success) throw new Error(res.message || "Failed to delete project");
      setProjects(prev => prev.filter(p => p.id !== id));
      setCurrentProject(prev => (prev?.id === id ? null : prev));
    } catch (e) {
      console.error("deleteProject error:", e);
      throw e;
    }
  };

  // 🔑 First-load (or user switches) — wait until token is present
  useEffect(() => {
    if (authLoading) return;  
    if (!accessToken || !user) {
      // user not ready yet; keep empty state but not error
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }
    // token & user ready → fetch
    reloadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user?.id]);

  const value = useMemo(
    () => ({
      projects,
      currentProject,
      loading,
      error,
      reloadProjects,
      selectProject,
      addProject,
      deleteProject,
    }),
    [projects, currentProject, loading, error],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within a ProjectProvider");
  return ctx;
};
