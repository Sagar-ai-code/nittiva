import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Target,
  CheckCircle2,
  Plus,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  Settings,
  FileText,
  Download,
} from "lucide-react";
import { useTask } from "@/context/TaskContext";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";

interface Sprint {
  id: number;
  name: string;
  project_id: number;
  project_name?: string;
  goal?: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: "planning" | "active" | "completed" | "cancelled";
  velocity_target?: number;
  actual_velocity?: number;
  task_count?: number;
  completed_task_count?: number;
  total_story_points?: number;
  completed_story_points?: number;
  progress_percentage?: number;
  duration_days?: number;
  members?: any[];
}

interface SprintTask {
  id: number;
  title: string;
  status: string;
  story_points?: number;
  assignees?: any[];
  priority?: string;
}

export default function Sprint() {
  const { tasks, refresh: refreshTasks } = useTask();
  const { projects } = useProject();
  const { user } = useAuth();
  const isManager = (user as any)?.role === "manager" || (user as any)?.is_staff;
  const isAgent = (user as any)?.role === "agent";

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [sprintTasks, setSprintTasks] = useState<SprintTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [burndownData, setBurndownData] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("board");

  const [sprintForm, setSprintForm] = useState({
    name: "",
    goal: "",
    description: "",
    project_id: "",
    start_date: "",
    end_date: "",
    status: "planning",
    velocity_target: "",
  });

  // Load sprints from API
  useEffect(() => {
    loadSprints();
  }, []);

  // Load sprint details when selected (only once per sprint selection)
  useEffect(() => {
    if (selectedSprint?.id) {
      const sprintId = selectedSprint.id;
      // Only load if not already loading
      if (!loadingRef.current.loading || loadingRef.current.sprintId !== sprintId) {
        loadSprintDetails(sprintId);
        loadBurndown(sprintId);
        loadStatistics(sprintId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSprint?.id]); // Only depend on sprint ID to prevent infinite loops

  const loadSprints = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSprints();
      if (response.success && response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : (response.data.results || []);
        setSprints(dataArray);
      }
    } catch (error: any) {
      console.error("Failed to load sprints:", error);
      toast.error("Failed to load sprints");
    } finally {
      setLoading(false);
    }
  };

  // Use refs to prevent multiple simultaneous loads
  const loadingRef = useRef<{ sprintId: number | null; loading: boolean }>({ 
    sprintId: null, 
    loading: false 
  });
  const tasksLoadingRef = useRef<{ sprintId: number | null; projectId: number | null; loading: boolean }>({
    sprintId: null,
    projectId: null,
    loading: false
  });

  // Load tasks dynamically from API for the sprint
  const loadSprintTasks = useCallback(async (sprintId: number, projectId: number) => {
    // Prevent multiple simultaneous loads for the same sprint/project
    if (tasksLoadingRef.current.loading && 
        tasksLoadingRef.current.sprintId === sprintId && 
        tasksLoadingRef.current.projectId === projectId) {
      return;
    }

    tasksLoadingRef.current = { sprintId, projectId, loading: true };

    try {

      // Load all tasks for the project
      const tasksResponse = await apiService.getTasks({ project: projectId });
      if (tasksResponse.success && tasksResponse.data) {
        const allTasks = Array.isArray(tasksResponse.data) 
          ? tasksResponse.data 
          : (tasksResponse.data.results || []);
        
        // Filter tasks that belong to this sprint
        const sprintTasksList = allTasks
          .filter((t: any) => {
            const taskSprintId = t.sprint || (t.custom_fields?.sprint_id);
            return taskSprintId === sprintId || Number(taskSprintId) === sprintId;
          })
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            story_points: t.story_points || t.custom_fields?.story_points,
            assignees: t.assignees || [],
            priority: t.priority,
            project_id: t.project || projectId,
            progress: t.progress || 0,
            description: t.description || "",
          }));
        
        setSprintTasks(sprintTasksList);
        
        // Don't refresh tasks context here - it causes infinite loops
        // The sprint tasks are loaded independently and don't need to sync with global tasks
      }
    } catch (error: any) {
      console.error("Failed to load sprint tasks:", error);
      // Fallback to local tasks if API fails
      const localTasks = tasks.filter((t: any) => {
        const taskSprintId = t.sprint || (t.customFields as any)?.sprint_id;
        return taskSprintId === sprintId || Number(taskSprintId) === sprintId;
      });
      setSprintTasks(localTasks.map((t: any) => ({
        id: t.id,
        title: t.name,
        status: t.status,
        story_points: (t.customFields as any)?.story_points,
        assignees: t.assigneeIds?.map((id: string) => ({ id: Number(id) })) || [],
        priority: t.priority,
        project_id: t.projectId,
        progress: t.progress || 0,
        description: t.description || "",
      })));
    } finally {
      tasksLoadingRef.current = { sprintId: null, projectId: null, loading: false };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - tasks loaded from API, not local state

  const loadSprintDetails = useCallback(async (sprintId: number) => {
    // Prevent multiple simultaneous loads for the same sprint
    if (loadingRef.current.loading && loadingRef.current.sprintId === sprintId) {
      return;
    }
    
    loadingRef.current = { sprintId, loading: true };
    
    try {
      const response = await apiService.getSprint(sprintId);
      if (response.success && response.data) {
        const sprint = response.data;
        // Only update if sprint ID is different to prevent loops
        setSelectedSprint((prev) => {
          if (prev?.id === sprint.id) {
            return prev;
          }
          return sprint;
        });
        
        // Load tasks dynamically from API filtered by sprint and project
        const projectId = sprint.project_id || sprint.project;
        if (projectId) {
          await loadSprintTasks(sprintId, projectId);
        }
      }
    } catch (error: any) {
      console.error("Failed to load sprint details:", error);
      toast.error("Failed to load sprint details");
    } finally {
      loadingRef.current = { sprintId: null, loading: false };
    }
  }, [loadSprintTasks]);

  const loadBurndown = useCallback(async (sprintId: number) => {
    try {
      const response = await apiService.getSprintBurndown(sprintId);
      if (response.success && response.data) {
        setBurndownData(response.data.burndown || []);
      }
    } catch (error: any) {
      console.error("Failed to load burndown data:", error);
    }
  }, []);

  const loadStatistics = useCallback(async (sprintId: number) => {
    try {
      const response = await apiService.getSprintStatistics(sprintId);
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error: any) {
      console.error("Failed to load statistics:", error);
    }
  }, []);

  const handleCreateSprint = async () => {
    if (!sprintForm.name || !sprintForm.start_date || !sprintForm.end_date || !sprintForm.project_id) {
      toast.error("Please fill in all required fields (Name, Project, Start Date, End Date)");
      return;
    }

    try {
      const response = await apiService.createSprint({
        name: sprintForm.name,
        project_id: parseInt(sprintForm.project_id),
        goal: sprintForm.goal,
        description: sprintForm.description,
        start_date: sprintForm.start_date,
        end_date: sprintForm.end_date,
        status: sprintForm.status,
        velocity_target: sprintForm.velocity_target ? parseInt(sprintForm.velocity_target) : undefined,
      });

      if (response.success) {
        toast.success(`Sprint "${sprintForm.name}" created successfully`);
        setIsCreatingSprint(false);
        setSprintForm({
          name: "",
          goal: "",
          description: "",
          project_id: "",
          start_date: "",
          end_date: "",
          status: "planning",
          velocity_target: "",
        });
        loadSprints();
      } else {
        toast.error(response.message || "Failed to create sprint");
      }
    } catch (error: any) {
      console.error("Failed to create sprint:", error);
      toast.error("Failed to create sprint");
    }
  };

  const handleUpdateSprint = async () => {
    if (!selectedSprint) return;

    try {
      const response = await apiService.updateSprint(selectedSprint.id, {
        name: sprintForm.name,
        goal: sprintForm.goal,
        description: sprintForm.description,
        start_date: sprintForm.start_date,
        end_date: sprintForm.end_date,
        status: sprintForm.status,
        velocity_target: sprintForm.velocity_target ? parseInt(sprintForm.velocity_target) : undefined,
      });

      if (response.success) {
        toast.success("Sprint updated successfully");
        setIsEditingSprint(false);
        loadSprints();
        if (selectedSprint) {
          loadSprintDetails(selectedSprint.id);
        }
      } else {
        toast.error(response.message || "Failed to update sprint");
      }
    } catch (error: any) {
      console.error("Failed to update sprint:", error);
      toast.error("Failed to update sprint");
    }
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!confirm("Are you sure you want to delete this sprint?")) return;

    try {
      const response = await apiService.deleteSprint(sprintId);
      if (response.success) {
        toast.success("Sprint deleted successfully");
        if (selectedSprint?.id === sprintId) {
          setSelectedSprint(null);
        }
        loadSprints();
      } else {
        toast.error(response.message || "Failed to delete sprint");
      }
    } catch (error: any) {
      console.error("Failed to delete sprint:", error);
      toast.error("Failed to delete sprint");
    }
  };

  const openEditDialog = (sprint: Sprint) => {
    setSprintForm({
      name: sprint.name,
      goal: sprint.goal || "",
      description: sprint.description || "",
      project_id: String(sprint.project_id),
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      status: sprint.status,
      velocity_target: sprint.velocity_target ? String(sprint.velocity_target) : "",
    });
    setIsEditingSprint(true);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const statusColors: Record<string, string> = {
    planning: "bg-gray-500",
    active: "bg-green-500",
    completed: "bg-blue-500",
    cancelled: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    planning: "Planning",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  if (loading && sprints.length === 0) {
    return (
      <div className="h-full bg-dashboard-bg p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Sprint Detail View
  if (selectedSprint) {
    // Filter tasks by project for accurate progress tracking
    const projectId = selectedSprint.project_id || selectedSprint.project;
    const projectTasks = sprintTasks.filter((t) => 
      (t.project_id === projectId) || (Number(t.project_id) === Number(projectId))
    );
    
    // Calculate progress metrics for this project's tasks
    const completedTasks = projectTasks.filter((t) => t.status === "completed").length;
    const totalTasks = projectTasks.length;
    const totalStoryPoints = projectTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedStoryPoints = projectTasks
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + (t.story_points || 0), 0);
    const velocity = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <div className="h-full bg-dashboard-bg p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedSprint(null);
                  setSprintTasks([]);
                  setBurndownData([]);
                  setStatistics(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-normal text-white">{selectedSprint.name}</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedSprint.project_name} • {statusLabels[selectedSprint.status]}
                </p>
              </div>
            </div>
            {isManager && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(selectedSprint)}
                  className="border-dashboard-border text-gray-400 hover:text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteSprint(selectedSprint.id)}
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Sprint Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-dashboard-surface border-dashboard-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-white">
                  {completedTasks} / {totalTasks} tasks
                </div>
                <div className="w-full bg-dashboard-bg rounded-full h-2 mt-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dashboard-surface border-dashboard-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Story Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-white">
                  {completedStoryPoints} / {totalStoryPoints} SP
                </div>
                <div className="w-full bg-dashboard-bg rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dashboard-surface border-dashboard-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-white">{velocity}%</div>
                {selectedSprint.velocity_target && (
                  <div className="text-xs text-gray-400 mt-1">
                    Target: {selectedSprint.velocity_target} SP
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-dashboard-surface border-dashboard-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-white">
                  {selectedSprint.duration_days || 0} days
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(selectedSprint.start_date).toLocaleDateString()} -{" "}
                  {new Date(selectedSprint.end_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sprint Goal */}
          {selectedSprint.goal && (
            <Card className="bg-dashboard-surface border-dashboard-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Sprint Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{selectedSprint.goal}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-dashboard-surface border-dashboard-border">
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="burndown">Burndown</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              {isManager && <TabsTrigger value="retrospective">Retrospective</TabsTrigger>}
            </TabsList>

            {/* Kanban Board */}
            <TabsContent value="board" className="mt-4">
              <div className="grid grid-cols-4 gap-4">
                {["to-do", "in-progress", "review", "completed"].map((status) => {
                  // Filter tasks by project and status
                  const statusTasks = projectTasks.filter((t) => t.status === status);
                  return (
                    <div
                      key={status}
                      className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium capitalize">
                          {status.replace("-", " ")}
                        </h3>
                        <Badge variant="secondary" className="bg-dashboard-bg text-gray-400">
                          {statusTasks.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {statusTasks.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No tasks</p>
                        ) : (
                          statusTasks.map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-dashboard-bg border border-dashboard-border rounded p-3 hover:border-accent/50 transition-colors cursor-pointer group"
                              onClick={() => {
                                // Navigate to task detail
                                window.location.href = `/dashboard/tasks/${task.id}`;
                              }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-white text-sm font-medium flex-1">{task.title}</div>
                                {/* Status update dropdown for agents */}
                                {isAgent && (
                                  <select
                                    className="ml-2 bg-dashboard-surface border border-dashboard-border rounded px-2 py-1 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    value={task.status}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={async (e) => {
                                      const newStatus = e.target.value;
                                      try {
                                        await apiService.updateTask(task.id, { status: newStatus });
                                        toast.success("Task status updated");
                                        
                                        // Update local state immediately for better UX
                                        setSprintTasks(prev => prev.map(t => 
                                          t.id === task.id ? { ...t, status: newStatus } : t
                                        ));
                                        
                                        // Reload sprint tasks from API to ensure consistency
                                        // Use a small delay to avoid rapid API calls
                                        setTimeout(async () => {
                                          await loadSprintTasks(selectedSprint.id, projectId);
                                          await loadBurndown(selectedSprint.id);
                                          await loadStatistics(selectedSprint.id);
                                        }, 300);
                                      } catch (error) {
                                        console.error("Failed to update task status:", error);
                                        toast.error("Failed to update task status");
                                        // Revert on error
                                        setSprintTasks(prev => prev.map(t => 
                                          t.id === task.id ? { ...t, status: task.status } : t
                                        ));
                                      }
                                    }}
                                  >
                                    <option value="to-do">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                )}
                              </div>
                              {task.story_points && (
                                <div className="text-xs text-gray-400 mb-2">
                                  {task.story_points} SP
                                </div>
                              )}
                              {task.priority && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs mb-2 ${
                                    task.priority === "high" ? "border-red-500 text-red-400" :
                                    task.priority === "medium" ? "border-orange-500 text-orange-400" :
                                    "border-gray-500 text-gray-400"
                                  }`}
                                >
                                  {task.priority}
                                </Badge>
                              )}
                              {task.progress > 0 && (
                                <div className="mb-2">
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Progress</span>
                                    <span>{task.progress}%</span>
                                  </div>
                                  <div className="w-full bg-dashboard-surface rounded-full h-1.5">
                                    <div 
                                      className="bg-accent h-1.5 rounded-full transition-all"
                                      style={{ width: `${task.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {task.assignees && task.assignees.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Users className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">
                                    {task.assignees.length} assignee(s)
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Burndown Chart */}
            <TabsContent value="burndown" className="mt-4">
              <Card className="bg-dashboard-surface border-dashboard-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Burndown Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {burndownData.length > 0 ? (
                    <ChartContainer
                      config={{
                        remaining: { color: "hsl(var(--accent))" },
                        ideal: { color: "hsl(var(--muted-foreground))" },
                      }}
                      className="h-[400px]"
                    >
                      <LineChart data={burndownData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="remaining_points"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          name="Remaining Points"
                        />
                        <Line
                          type="monotone"
                          dataKey="total_points"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Ideal Burndown"
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No burndown data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics */}
            <TabsContent value="statistics" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statistics && (
                  <>
                    <Card className="bg-dashboard-surface border-dashboard-border">
                      <CardHeader>
                        <CardTitle className="text-white">Task Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statistics.task_counts && statistics.task_counts.length > 0 ? (
                          <ChartContainer
                            config={{
                              tasks: { color: "hsl(var(--accent))" },
                            }}
                            className="h-[300px]"
                          >
                            <BarChart data={statistics.task_counts}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis
                                dataKey="status"
                                stroke="hsl(var(--muted-foreground))"
                                tickFormatter={(value) => value.replace("-", " ")}
                              />
                              <YAxis stroke="hsl(var(--muted-foreground))" />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="count" fill="hsl(var(--accent))" name="Tasks" />
                            </BarChart>
                          </ChartContainer>
                        ) : (
                          <p className="text-gray-400 text-center py-8">No task data available</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-dashboard-surface border-dashboard-border">
                      <CardHeader>
                        <CardTitle className="text-white">Time Tracking</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-400">Total Time</p>
                            <p className="text-2xl font-semibold text-white">
                              {statistics.total_time_seconds
                                ? formatDuration(statistics.total_time_seconds)
                                : "0m"}
                            </p>
                          </div>
                          {statistics.agent_contributions &&
                            statistics.agent_contributions.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-400 mb-2">Agent Contributions</p>
                                <div className="space-y-2">
                                  {statistics.agent_contributions.map((contrib: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center p-2 bg-dashboard-bg rounded"
                                    >
                                      <span className="text-sm text-white">
                                        {contrib.assignees__name || contrib.assignees__email || "Unknown"}
                                      </span>
                                      <span className="text-sm text-gray-400">
                                        {contrib.task_count} tasks, {contrib.story_points || 0} SP
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Retrospective (Manager Only) */}
            {isManager && (
              <TabsContent value="retrospective" className="mt-4">
                <Card className="bg-dashboard-surface border-dashboard-border">
                  <CardHeader>
                    <CardTitle className="text-white">Sprint Retrospective</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm mb-4">
                      Document what went well, what to improve, and action items for the next sprint.
                    </p>
                    {/* Retrospective form would go here */}
                    <p className="text-gray-500 text-center py-8">Retrospective form coming soon</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>

        {/* Edit Sprint Dialog */}
        {isEditingSprint && selectedSprint && (
          <Dialog open={isEditingSprint} onOpenChange={setIsEditingSprint}>
            <DialogContent className="bg-dashboard-surface border-dashboard-border text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Sprint</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Update sprint details and settings.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-sprint-name" className="text-gray-300">
                    Sprint Name *
                  </Label>
                  <Input
                    id="edit-sprint-name"
                    value={sprintForm.name}
                    onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sprint-goal" className="text-gray-300">
                    Sprint Goal
                  </Label>
                  <Input
                    id="edit-sprint-goal"
                    value={sprintForm.goal}
                    onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sprint-description" className="text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="edit-sprint-description"
                    value={sprintForm.description}
                    onChange={(e) => setSprintForm({ ...sprintForm, description: e.target.value })}
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-sprint-start" className="text-gray-300">
                      Start Date *
                    </Label>
                    <Input
                      id="edit-sprint-start"
                      type="date"
                      value={sprintForm.start_date}
                      onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })}
                      className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-sprint-end" className="text-gray-300">
                      End Date *
                    </Label>
                    <Input
                      id="edit-sprint-end"
                      type="date"
                      value={sprintForm.end_date}
                      onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })}
                      className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-sprint-status" className="text-gray-300">
                      Status
                    </Label>
                    <select
                      id="edit-sprint-status"
                      value={sprintForm.status}
                      onChange={(e) => setSprintForm({ ...sprintForm, status: e.target.value })}
                      className="w-full bg-dashboard-bg border border-dashboard-border text-white rounded px-3 py-2 mt-1"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-sprint-velocity" className="text-gray-300">
                      Velocity Target (SP)
                    </Label>
                    <Input
                      id="edit-sprint-velocity"
                      type="number"
                      value={sprintForm.velocity_target}
                      onChange={(e) => setSprintForm({ ...sprintForm, velocity_target: e.target.value })}
                      className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingSprint(false)}
                  className="border-dashboard-border text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateSprint} className="bg-accent text-black hover:bg-accent/80">
                  Update Sprint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Sprint List View
  return (
    <div className="h-full bg-dashboard-bg p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-normal text-white">Sprint View</h1>
          {isManager && (
            <Button
              onClick={() => {
                setSprintForm({
                  name: "",
                  goal: "",
                  description: "",
                  project_id: projects.length > 0 ? String(projects[0].id) : "",
                  start_date: "",
                  end_date: "",
                  status: "planning",
                  velocity_target: "",
                });
                setIsCreatingSprint(true);
              }}
              className="bg-accent text-black hover:bg-accent/80 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Sprint
            </Button>
          )}
        </div>

        {sprints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sprints.map((sprint) => (
              <motion.div
                key={sprint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedSprint(sprint)}
                className="bg-dashboard-surface border border-dashboard-border rounded-lg p-6 cursor-pointer hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-medium text-lg mb-1">{sprint.name}</h3>
                    <p className="text-sm text-gray-400">{sprint.project_name}</p>
                  </div>
                  <Badge
                    className={`${statusColors[sprint.status]} text-white`}
                  >
                    {statusLabels[sprint.status]}
                  </Badge>
                </div>
                {sprint.goal && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{sprint.goal}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>
                    {new Date(sprint.start_date).toLocaleDateString()} -{" "}
                    {new Date(sprint.end_date).toLocaleDateString()}
                  </span>
                  <span>{sprint.duration_days || 0} days</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Tasks</p>
                    <p className="text-sm font-semibold text-white">
                      {sprint.completed_task_count || 0} / {sprint.task_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Story Points</p>
                    <p className="text-sm font-semibold text-white">
                      {sprint.completed_story_points || 0} / {sprint.total_story_points || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Progress</p>
                    <p className="text-sm font-semibold text-white">
                      {sprint.progress_percentage?.toFixed(0) || 0}%
                    </p>
                  </div>
                </div>
                {isManager && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-dashboard-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(sprint);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSprint(sprint.id);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-12 text-center">
            <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No sprints found.</p>
            <p className="text-sm text-gray-500 mb-6">
              {isManager
                ? "Create your first sprint to organize and track your tasks."
                : "No sprints are available. Contact your manager to create a sprint."}
            </p>
            {isManager && (
              <Button
                onClick={() => setIsCreatingSprint(true)}
                className="bg-accent text-black hover:bg-accent/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Sprint
              </Button>
            )}
          </div>
        )}

        {/* Create Sprint Dialog */}
        <Dialog open={isCreatingSprint} onOpenChange={setIsCreatingSprint}>
          <DialogContent className="bg-dashboard-surface border-dashboard-border text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Sprint</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new sprint to organize and track your tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="sprint-name" className="text-gray-300">
                  Sprint Name *
                </Label>
                <Input
                  id="sprint-name"
                  placeholder="Sprint 1"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sprint-goal" className="text-gray-300">
                  Sprint Goal
                </Label>
                <Input
                  id="sprint-goal"
                  placeholder="Complete payment integration"
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sprint-description" className="text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="sprint-description"
                  placeholder="Detailed sprint description..."
                  value={sprintForm.description}
                  onChange={(e) => setSprintForm({ ...sprintForm, description: e.target.value })}
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="sprint-project" className="text-gray-300">
                  Project *
                </Label>
                <select
                  id="sprint-project"
                  value={sprintForm.project_id}
                  onChange={(e) => setSprintForm({ ...sprintForm, project_id: e.target.value })}
                  className="w-full bg-dashboard-bg border border-dashboard-border text-white rounded px-3 py-2 mt-1"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sprint-start" className="text-gray-300">
                    Start Date *
                  </Label>
                  <Input
                    id="sprint-start"
                    type="date"
                    value={sprintForm.start_date}
                    onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })}
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sprint-end" className="text-gray-300">
                    End Date *
                  </Label>
                  <Input
                    id="sprint-end"
                    type="date"
                    value={sprintForm.end_date}
                    onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })}
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sprint-status" className="text-gray-300">
                    Status
                  </Label>
                  <select
                    id="sprint-status"
                    value={sprintForm.status}
                    onChange={(e) => setSprintForm({ ...sprintForm, status: e.target.value })}
                    className="w-full bg-dashboard-bg border border-dashboard-border text-white rounded px-3 py-2 mt-1"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="sprint-velocity" className="text-gray-300">
                    Velocity Target (Story Points)
                  </Label>
                  <Input
                    id="sprint-velocity"
                    type="number"
                    placeholder="Optional"
                    value={sprintForm.velocity_target}
                    onChange={(e) => setSprintForm({ ...sprintForm, velocity_target: e.target.value })}
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreatingSprint(false)}
                className="border-dashboard-border text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSprint} className="bg-accent text-black hover:bg-accent/80">
                Create Sprint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
