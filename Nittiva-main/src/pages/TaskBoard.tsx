import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { useTask } from "@/context/TaskContext";
import { useUser } from "@/context/UserContext";
import { useProject } from "@/context/ProjectContext";
import { cn } from "@/lib/utils";
import {
  Calendar,
  User,
  Clock,
  Plus,
  MoreHorizontal,
  Flag,
  Users,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskTimeTracker } from "@/components/ui/task-time-tracker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskWithCustomFields } from "@/types/fieldTypes";
import { EmptyBoard } from "@/components/dashboard/EmptyBoard";

type Task = TaskWithCustomFields;

const statusConfig = {
  "to-do": {
    title: "To Do",
    color: "border-gray-500",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-400",
    count: 0,
  },
  "in-progress": {
    title: "In Progress",
    color: "border-orange-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
    count: 0,
  },
  completed: {
    title: "Completed",
    color: "border-green-500",
    bgColor: "bg-green-500/10",
    textColor: "text-green-400",
    count: 0,
  },
};

const priorityColors = {
  high: "text-red-400",
  medium: "text-orange-400",
  low: "text-gray-400",
};

const priorityBgColors = {
  high: "bg-red-500/10",
  medium: "bg-orange-500/10",
  low: "bg-gray-500/10",
};

export default function TaskBoard() {
  const navigate = useNavigate();
  const { tasks, moveTask, getTasksForProject } = useTask();
  const { users, getUserById } = useUser();
  const { currentProject } = useProject();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [lastMovedTask, setLastMovedTask] = useState<{
    id: number;
    status: string;
  } | null>(null);

  // Get tasks for current project
  const projectTasks = currentProject
    ? getTasksForProject(currentProject.id)
    : [];

  const getTasksByStatus = (status: Task["status"]) => {
    return projectTasks.filter((task) => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (status: Task["status"]) => {
    if (draggedTask && draggedTask.status !== status) {
      console.log(
        `Moving task ${draggedTask.name} from ${draggedTask.status} to ${status}`,
      );
      moveTask(draggedTask.id, status);
      setLastMovedTask({ id: draggedTask.id, status });
      // Clear the highlight after 2 seconds
      setTimeout(() => setLastMovedTask(null), 2000);
    }
    setDraggedTask(null);
  };

  const renderTaskCard = (task: Task) => (
    <motion.div
      key={task.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      className="bg-card border border-dashboard-border rounded-lg p-4 cursor-grab active:cursor-grabbing group hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
      draggable
      onDragStart={(e) => {
        handleDragStart(task);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id.toString());
      }}
      onDragEnd={(e) => {
        e.preventDefault();
        handleDragEnd();
      }}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-white font-normal text-sm leading-snug group-hover:text-accent transition-colors duration-300 line-clamp-2 flex-1">
          {task.name}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-dashboard-surface border-dashboard-border"
          >
            <DropdownMenuItem className="text-gray-300 hover:text-white">
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 hover:text-white">
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-400 hover:text-red-300">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task Details */}
      <div className="space-y-3">
        {/* Priority and Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className={cn("w-3 h-3", priorityColors[task.priority])} />
            <span
              className={cn(
                "text-xs font-medium capitalize",
                priorityColors[task.priority],
              )}
            >
              {task.priority}
            </span>
          </div>
          {task.progress > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {task.progress}%
              </span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {task.assigneeIds && task.assigneeIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-gray-400" />
            <div className="flex -space-x-1">
              {task.assigneeIds.slice(0, 3).map((assigneeId, index) => {
                const user = getUserById(assigneeId);
                return user ? (
                  <div
                    key={assigneeId}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-black border-2 border-dashboard-bg"
                    style={{ backgroundColor: user.color, zIndex: 10 - index }}
                    title={`${user.first_name} ${user.last_name}`}
                  >
                    {user.avatar}
                  </div>
                ) : null;
              })}
              {task.assigneeIds.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-dashboard-bg flex items-center justify-center text-xs text-white">
                  +{task.assigneeIds.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/tasks/${task.id}`);
            }}
          >
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year:
                  new Date().getFullYear() !==
                  new Date(task.dueDate).getFullYear()
                    ? "numeric"
                    : undefined,
              })}
            </span>
          </div>
        )}

        {/* Time Tracker */}
        <div className="pt-2 border-t border-dashboard-border/50">
          <TaskTimeTracker
            taskId={task.id.toString()}
            taskName={task.name}
            variant="badge"
            className="w-full justify-start"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderColumn = (status: Task["status"]) => {
    const tasksInStatus = getTasksByStatus(status);
    const config = statusConfig[status];
    const isDraggedOver = draggedTask && draggedTask.status !== status;

    return (
      <div
        key={status}
        className="flex-1 min-w-80"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(status);
        }}
      >
        {/* Column Header */}
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-t-lg border-t-2 transition-all duration-300",
            config.color,
            config.bgColor,
            isDraggedOver && "ring-2 ring-accent/50 bg-accent/5",
          )}
        >
          <div className="flex items-center gap-2">
            <h3 className={cn("font-normal text-sm", config.textColor)}>
              {config.title}
            </h3>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-normal",
                config.bgColor,
                config.textColor,
                "border-0",
              )}
            >
              {tasksInStatus.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 opacity-60 hover:opacity-100",
              config.textColor,
            )}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Tasks Container */}
        <div
          className={cn(
            "min-h-96 p-4 bg-dashboard-surface/30 border-x border-b border-dashboard-border rounded-b-lg transition-all duration-300",
            isDraggedOver && "border-accent/50 bg-accent/5 border-dashed",
          )}
        >
          <AnimatePresence>
            <div className="space-y-3">
              {tasksInStatus.map((task) => (
                <motion.div key={task.id} layout>
                  {renderTaskCard(task)}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Empty State */}
          {tasksInStatus.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-gray-500"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300",
                  isDraggedOver
                    ? "bg-accent/20 text-accent"
                    : "bg-dashboard-border",
                )}
              >
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-sm font-normal">
                No tasks in {config.title.toLowerCase()}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {isDraggedOver
                  ? "Drop task here"
                  : "Drag tasks here or add new ones"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full bg-dashboard-bg p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal text-white mb-2">
              {currentProject?.name || "Project"} Board
            </h1>
            <p className="text-gray-400 font-normal">
              Organize and track your tasks across different stages
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-dashboard-border text-gray-400 hover:text-white font-normal"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              size="sm"
              className="bg-accent text-black hover:bg-accent/90 font-normal"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Board Columns or Empty State */}
      {projectTasks.length === 0 ? (
        <EmptyBoard />
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6">
          {(Object.keys(statusConfig) as Array<Task["status"]>).map((status) =>
            renderColumn(status),
          )}
        </div>
      )}
    </motion.div>
  );
}
