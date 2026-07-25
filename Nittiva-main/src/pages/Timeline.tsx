import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  BarChart3,
  Edit,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { useTask } from "@/context/TaskContext";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, addDays, addWeeks, addMonths, addQuarters, subWeeks, subMonths, subQuarters, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from "date-fns";

type ViewMode = "gantt" | "calendar" | "list";
type TimeRange = "week" | "month" | "quarter";

interface Task {
  id: number;
  name: string;
  title?: string;
  description?: string;
  dueDate?: string;
  due_date?: string;
  startDate?: string;
  status: string;
  priority?: string;
  projectId?: string | number;
  project?: { id: number; name: string };
  assignees?: any[];
  assigneeIds?: number[];
  story_points?: number;
  time_tracked_seconds?: number;
  progress?: number;
}

export default function Timeline() {
  const { tasks, refresh, updateTask } = useTask();
  const { projects } = useProject();
  const { user } = useAuth();
  const isManager = (user as any)?.role === "manager" || (user as any)?.is_staff;
  const isAgent = (user as any)?.role === "agent";

  const [viewMode, setViewMode] = useState<ViewMode>("gantt");
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editForm, setEditForm] = useState({ due_date: "", start_date: "" });

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Get all unique assignees from tasks
  const assignees = useMemo(() => {
    const assigneeSet = new Set<string>();
    tasks.forEach((task: any) => {
      if (task.assignees && Array.isArray(task.assignees)) {
        task.assignees.forEach((assignee: any) => {
          if (assignee.email) assigneeSet.add(assignee.email);
        });
      }
    });
    return Array.from(assigneeSet);
  }, [tasks]);

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((t: Task) => {
      const taskName = t.name || t.title || "";
      const dueDate = t.dueDate || t.due_date;
      
      // Filter by project
      if (selectedProject && String(t.projectId || t.project?.id) !== selectedProject) {
        return false;
      }
      
      // Filter by status
      if (selectedStatus && t.status !== selectedStatus) {
        return false;
      }
      
      // Filter by assignee
      if (selectedAssignee) {
        const hasAssignee = t.assignees?.some((a: any) => a.email === selectedAssignee) ||
                           t.assigneeIds?.some((id: number) => {
                             // Check if this ID matches the selected assignee
                             return false; // Simplified for now
                           });
        if (!hasAssignee) return false;
      }
      
      // Filter by date range
      if (dueDate) {
        const taskDate = parseISO(dueDate);
        let rangeStart: Date, rangeEnd: Date;
        
        switch (timeRange) {
          case "week":
            rangeStart = startOfWeek(currentDate);
            rangeEnd = endOfWeek(currentDate);
            break;
          case "month":
            rangeStart = startOfMonth(currentDate);
            rangeEnd = endOfMonth(currentDate);
            break;
          case "quarter":
            rangeStart = startOfQuarter(currentDate);
            rangeEnd = endOfQuarter(currentDate);
            break;
          default:
            return true;
        }
        
        if (!isWithinInterval(taskDate, { start: rangeStart, end: rangeEnd })) {
          return false;
        }
      } else {
        // If no due date, only show if "All" is selected or in list view
        if (viewMode !== "list") return false;
      }
      
      return true;
    });
    
    return filtered.sort((a: Task, b: Task) => {
      const dateA = a.dueDate || a.due_date || "";
      const dateB = b.dueDate || b.due_date || "";
      if (dateA && dateB) {
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      }
      return 0;
    });
  }, [tasks, selectedProject, selectedStatus, selectedAssignee, timeRange, currentDate, viewMode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "in-progress":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "review":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "to-do":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      switch (timeRange) {
        case "week":
          setCurrentDate(subWeeks(currentDate, 1));
          break;
        case "month":
          setCurrentDate(subMonths(currentDate, 1));
          break;
        case "quarter":
          setCurrentDate(subQuarters(currentDate, 1));
          break;
      }
    } else {
      switch (timeRange) {
        case "week":
          setCurrentDate(addWeeks(currentDate, 1));
          break;
        case "month":
          setCurrentDate(addMonths(currentDate, 1));
          break;
        case "quarter":
          setCurrentDate(addQuarters(currentDate, 1));
          break;
      }
    }
  };

  const getDateRangeLabel = () => {
    let start: Date, end: Date;
    switch (timeRange) {
      case "week":
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
        break;
      case "month":
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case "quarter":
        start = startOfQuarter(currentDate);
        end = endOfQuarter(currentDate);
        break;
    }
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  const handleUpdateTaskDate = async (taskId: number, newDueDate: string) => {
    if (!isManager) {
      toast.error("Only managers can update task dates");
      return;
    }

    try {
      await updateTask(taskId, { due_date: newDueDate } as any);
      toast.success("Task date updated");
      refresh();
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task date");
    }
  };

  // Gantt Chart View
  const renderGanttView = () => {
    const getDateRange = () => {
      let start: Date, end: Date;
      switch (timeRange) {
        case "week":
          start = startOfWeek(currentDate);
          end = endOfWeek(currentDate);
          break;
        case "month":
          start = startOfMonth(currentDate);
          end = endOfMonth(currentDate);
          break;
        case "quarter":
          start = startOfQuarter(currentDate);
          end = endOfQuarter(currentDate);
          break;
      }
      return { start, end };
    };

    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });
    const totalDays = days.length;

    return (
      <div className="space-y-4">
        {/* Gantt Header */}
        <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4 overflow-x-auto">
          <div className="flex" style={{ minWidth: `${totalDays * 60}px` }}>
            <div className="w-64 flex-shrink-0 font-medium text-gray-400 text-sm">Task</div>
            <div className="flex-1 flex">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="flex-1 min-w-[60px] text-center text-xs text-gray-400 border-l border-dashboard-border p-2"
                >
                  <div>{format(day, "EEE")}</div>
                  <div className="font-medium">{format(day, "d")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt Rows */}
        <div className="space-y-2">
          {filteredTasks.map((task: Task) => {
            const dueDate = task.dueDate || task.due_date;
            if (!dueDate) return null;

            const taskDate = parseISO(dueDate);
            const dayIndex = days.findIndex((d) => isSameDay(d, taskDate));
            const leftOffset = dayIndex >= 0 ? (dayIndex / totalDays) * 100 : 0;

            return (
              <div
                key={task.id}
                className="bg-dashboard-surface border border-dashboard-border rounded-lg p-2 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-64 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white text-sm font-medium truncate">
                        {task.name || task.title}
                      </h4>
                      <Badge className={getStatusColor(task.status)} variant="outline">
                        {task.status.replace("-", " ")}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {task.project?.name || "No Project"}
                    </div>
                  </div>
                  <div className="flex-1 relative h-8 bg-dashboard-bg rounded">
                    {dayIndex >= 0 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "4px" }}
                        className={`absolute h-full ${getStatusColor(task.status).split(" ")[0]} rounded`}
                        style={{ left: `${leftOffset}%` }}
                      />
                    )}
                  </div>
                  <div className="w-32 flex-shrink-0 text-xs text-gray-400 text-right">
                    {format(taskDate, "MMM d")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No tasks found for the selected period.</p>
          </div>
        )}
      </div>
    );
  };

  // Calendar View
  const renderCalendarView = () => {
    const getDateRange = () => {
      let start: Date, end: Date;
      switch (timeRange) {
        case "week":
          start = startOfWeek(currentDate);
          end = endOfWeek(currentDate);
          break;
        case "month":
          start = startOfMonth(currentDate);
          end = endOfMonth(currentDate);
          break;
        case "quarter":
          start = startOfQuarter(currentDate);
          end = endOfQuarter(currentDate);
          break;
      }
      return { start, end };
    };

    const { start, end } = getDateRange();
    const days = eachDayOfInterval({ start, end });
    const weeks: Date[][] = [];
    
    // Group days into weeks
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const getTasksForDay = (day: Date) => {
      return filteredTasks.filter((task: Task) => {
        const dueDate = task.dueDate || task.due_date;
        if (!dueDate) return false;
        return isSameDay(parseISO(dueDate), day);
      });
    };

    return (
      <div className="space-y-4">
        <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="bg-dashboard-surface border border-dashboard-border rounded-lg p-2"
            >
              <div className="grid grid-cols-7 gap-2">
                {week.map((day, dayIndex) => {
                  const dayTasks = getTasksForDay(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[100px] p-2 border border-dashboard-border rounded ${
                        isToday ? "bg-accent/10 border-accent" : "bg-dashboard-bg"
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-accent" : "text-gray-400"}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task: Task) => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${getStatusColor(task.status)}`}
                            onClick={() => {
                              setSelectedTask(task);
                              setIsEditingTask(true);
                              setEditForm({
                                due_date: task.dueDate || task.due_date || "",
                                start_date: task.startDate || "",
                              });
                            }}
                          >
                            {task.name || task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // List View
  const renderListView = () => {
    return (
      <div className="space-y-4">
        {filteredTasks.map((task: Task, index: number) => {
          const dueDate = task.dueDate || task.due_date;
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4 hover:border-accent/50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedTask(task);
                setIsEditingTask(true);
                setEditForm({
                  due_date: task.dueDate || task.due_date || "",
                  start_date: task.startDate || "",
                });
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-medium">{task.name || task.title}</h3>
                    <Badge className={getStatusColor(task.status)} variant="outline">
                      {task.status.replace("-", " ")}
                    </Badge>
                    {task.priority && (
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dueDate ? format(parseISO(dueDate), "MMM d, yyyy") : "No due date"}
                    </span>
                    {task.project && (
                      <span>{task.project.name}</span>
                    )}
                    {task.story_points && (
                      <span>{task.story_points} SP</span>
                    )}
                    {task.time_tracked_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(task.time_tracked_seconds)}
                      </span>
                    )}
                    {task.progress !== undefined && (
                      <span>{task.progress}% complete</span>
                    )}
                  </div>
                </div>
                {isManager && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                      setIsEditingTask(true);
                      setEditForm({
                        due_date: task.dueDate || task.due_date || "",
                        start_date: task.startDate || "",
                      });
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-12 text-center">
            <List className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No tasks found for the selected filters.</p>
          </div>
        )}
      </div>
    );
  };

  // Statistics
  const statistics = useMemo(() => {
    const stats = {
      total: filteredTasks.length,
      completed: filteredTasks.filter((t: Task) => t.status === "completed").length,
      inProgress: filteredTasks.filter((t: Task) => t.status === "in-progress").length,
      overdue: filteredTasks.filter((t: Task) => {
        const dueDate = t.dueDate || t.due_date;
        if (!dueDate) return false;
        return parseISO(dueDate) < new Date() && t.status !== "completed";
      }).length,
      totalTime: filteredTasks.reduce((sum: number, t: Task) => sum + (t.time_tracked_seconds || 0), 0),
    };
    return stats;
  }, [filteredTasks]);

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
          <h1 className="text-3xl font-normal text-white">Timeline View</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate("prev")}
              className="border-dashboard-border text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate("next")}
              className="border-dashboard-border text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="border-dashboard-border text-gray-400 hover:text-white"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-green-400">{statistics.completed}</div>
            </CardContent>
          </Card>
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-orange-400">{statistics.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-red-400">{statistics.overdue}</div>
            </CardContent>
          </Card>
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white">
                {formatDuration(statistics.totalTime)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Controls */}
        <Card className="bg-dashboard-surface border-dashboard-border">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Project Filter */}
              <Select value={selectedProject || "all"} onValueChange={(value) => setSelectedProject(value === "all" ? null : value)}>
                <SelectTrigger className="w-[180px] bg-dashboard-bg border-dashboard-border text-white">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? null : value)}>
                <SelectTrigger className="w-[180px] bg-dashboard-bg border-dashboard-border text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="to-do">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              {/* Time Range */}
              <div className="flex gap-2">
                {(["week", "month", "quarter"] as TimeRange[]).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className={
                      timeRange === range
                        ? "bg-accent text-black"
                        : "border-dashboard-border text-gray-400 hover:text-white"
                    }
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Date Range Display */}
              <div className="flex-1 text-right text-sm text-gray-400">
                {getDateRangeLabel()}
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "gantt" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("gantt")}
                  className={
                    viewMode === "gantt"
                      ? "bg-accent text-black"
                      : "border-dashboard-border text-gray-400 hover:text-white"
                  }
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={
                    viewMode === "calendar"
                      ? "bg-accent text-black"
                      : "border-dashboard-border text-gray-400 hover:text-white"
                  }
                >
                  <Calendar className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list"
                      ? "bg-accent text-black"
                      : "border-dashboard-border text-gray-400 hover:text-white"
                  }
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Content */}
        <div>
          {viewMode === "gantt" && renderGanttView()}
          {viewMode === "calendar" && renderCalendarView()}
          {viewMode === "list" && renderListView()}
        </div>

        {/* Edit Task Dialog */}
        {isEditingTask && selectedTask && isManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dashboard-surface border border-dashboard-border rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-medium">Edit Task Dates</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingTask(false);
                    setSelectedTask(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Task</label>
                  <p className="text-white">{selectedTask.name || selectedTask.title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingTask(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 border-dashboard-border text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (editForm.due_date) {
                      await handleUpdateTaskDate(selectedTask.id, editForm.due_date);
                    }
                    setIsEditingTask(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 bg-accent text-black hover:bg-accent/80"
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
