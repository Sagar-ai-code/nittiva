// src/context/TaskContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,  
} from "react";
import { apiService, normalizeTask } from "@/lib/api";
import { TaskWithCustomFields, CustomField } from "@/types/fieldTypes";

type Task = TaskWithCustomFields & {
  projectId?: string; // we keep projectId as string for the UI
};

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  customFields: CustomField[];
  setCustomFields: React.Dispatch<React.SetStateAction<CustomField[]>>;
  loading: boolean;
  error: string | null;

  // data operations
  refresh: (projectId?: string | number) => Promise<void>;
  addTask: (task: Omit<Task, "id">, projectId?: string | number) => Promise<Task | null>;
  updateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  moveTask: (taskId: number, newStatus: Task["status"]) => Promise<void>;

  // helpers
  setTaskAssignees: (taskId: number, assigneeIds: string[]) => Promise<void>;
  getTasksForProject: (projectId: string) => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// ------- Custom field defaults for the table -------
const initialCustomFields: CustomField[] = [
  {
    id: "status-field",
    name: "Status",
    type: "dropdown",
    width: 120,
    options: ["Not Started", "In Progress", "Review", "Done"],
  },
  { id: "budget-field", name: "Budget", type: "money", width: 100 },
  { id: "rating-field", name: "Priority Rating", type: "rating", width: 140 },
];

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customFields, setCustomFields] =
    useState<CustomField[]>(initialCustomFields);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ------- Load tasks from backend (optionally filter by project) -------
// ------- Load tasks from backend (optionally filter by project) -------
const refresh = useCallback(async (projectId?: string | number) => {
  setLoading(true);
  setError(null);
  try {
    const filters =
      projectId !== undefined && projectId !== null
        ? { project: Number(projectId) }
        : undefined;

    const res = await apiService.getTasks(filters as any);
    if (!res.success) {
      setError(res.message || "Failed to load tasks");
      setTasks([]);
      return;
    }

    const list = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.results ?? [];

    const normalized = list.map((t: any) => normalizeTask(t)) as Task[];
    setTasks(normalized);
  } catch (e: any) {
    setError(e?.message || "Failed to load tasks");
    setTasks([]);
  } finally {
    setLoading(false);
  }
}, []);

  // ------- Load custom fields from backend -------
  const refreshCustomFields = useCallback(async () => {
    try {
      const res = await apiService.getCustomFields();
      if (res.success && res.data) {
        const fields: CustomField[] = res.data.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.field_type,
          width: f.width || 150,
          options: f.options || [],
        }));
        setCustomFields(fields);
      }
    } catch (e: any) {
      console.error("Failed to load custom fields:", e);
    }
  }, []);


  useEffect(() => {
    // Load all tasks initially; pages that are project-scoped can call refresh(projectId)
    refresh().catch(() => undefined);
    // Load custom fields from backend
    refreshCustomFields().catch(() => undefined);
  }, [refresh, refreshCustomFields]);

  // ------- Create -------
  const addTask = async (
    newTask: Omit<Task, "id">,
    projectId?: string | number
  ) => {
    try {
      const payload = {
        // UI-friendly -> apiService will remap internally
        projectId:
          newTask.projectId !== undefined
            ? Number(newTask.projectId)
            : projectId !== undefined
            ? Number(projectId)
            : undefined,
        name: newTask.name ?? newTask.title ?? "New Task",
        description: (newTask as any).description ?? "",
        status: newTask.status ?? "to-do",
        priority: newTask.priority ?? "medium",
        progress: newTask.progress ?? 0,
        dueDate: newTask.dueDate || null,
        customFields: newTask.customFields ?? {},
        assigneeIds: newTask.assigneeIds ?? [], // string[]
      };

      const res = await apiService.createTask(payload as any);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to create task");
      }

      const created = normalizeTask(res.data as any) as Task;
      setTasks((prev) => [created, ...prev]);
      return created;
    } catch (e) {
      console.error("addTask error:", e);
      return null;
    }
  };

  // ------- Update (partial) -------
  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      // Pass UI-style patch; apiService.updateTask will remap to Django fields
      const res = await apiService.updateTask(taskId, updates as any);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to update task");
      }
      const updated = normalizeTask(res.data as any) as Task;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (e) {
      console.error("updateTask error:", e);
      throw e;
    }
  };

  // ------- Delete -------
  const deleteTask = async (taskId: number) => {
    try {
      const res = await apiService.deleteTask(taskId);
      if (!res.success) {
        throw new Error(res.message || "Failed to delete task");
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) {
      console.error("deleteTask error:", e);
      throw e;
    }
  };

  // ------- Move between statuses (helper) -------
  const moveTask = async (taskId: number, newStatus: Task["status"]) => {
    return updateTask(taskId, { status: newStatus });
  };

  // ------- Save assignees (used by the Assignee popover "Done" button) -------
  const setTaskAssignees = async (taskId: number, assigneeIds: string[]) => {
    // You can use the generic updateTask (which maps assigneeIds for you)…
    const res = await apiService.updateTask(taskId, { assigneeIds } as any);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to update assignees");
    }
    const updated = normalizeTask(res.data as any) as Task;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  // ------- Utility: filter tasks by project -------
  const getTasksForProject = (projectId: string) =>
    tasks.filter((t) => String(t.projectId) === projectId);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        setTasks,
        customFields,
        setCustomFields,
        loading,
        error,
        refresh,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        setTaskAssignees,
        getTasksForProject,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTask must be used within a TaskProvider");
  return ctx;
}
