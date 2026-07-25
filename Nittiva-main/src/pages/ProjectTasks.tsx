import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Bell, Globe, User, ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TaskList, { TaskListRef } from "@/components/dashboard/TaskList";
import { useProject } from "@/context/ProjectContext";
import { useTask } from "@/context/TaskContext";
import { Link } from "react-router-dom";
import { InviteUserDialog } from "@/components/project/InviteUserDialog";

export default function ProjectTasks() {
  const { projectId } = useParams();
  const { projects, currentProject, selectProject } = useProject();
  const { addTask } = useTask();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const taskListRef = React.useRef<TaskListRef>(null);

  // Find and set the current project if not already set
  const project = projects.find((p) => p.id === projectId);
  if (project && (!currentProject || currentProject.id !== projectId)) {
    selectProject(project);
  }

  if (!project) {
    return (
      <div className="h-full bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-normal text-white mb-4">
            Project Not Found
          </h1>
          <Link to="/" className="text-accent hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-dashboard-bg">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-dashboard-surface border-b border-dashboard-border px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 hover:bg-sidebar-hover rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </Link>
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks [CTRL + K]"
                  className="pl-10 bg-dashboard-bg border-dashboard-border text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >
              <span className="text-sm">English</span>
            </Button>
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Project Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-2xl font-normal text-white mb-1">
                {project.name}
              </h1>
              <p className="text-gray-400 text-sm">
                {project.taskCount} tasks • Project Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-dashboard-border text-gray-400 hover:text-white flex items-center gap-2"
              onClick={() => setInviteDialogOpen(true)}
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </Button>
            <Button
              size="sm"
              className="bg-accent text-black hover:bg-accent/80"
              onClick={() => {
                if (taskListRef.current) {
                  taskListRef.current.addNewTask();
                }
              }}
            >
              Add Task
            </Button>
          </div>
        </motion.div>

        {/* Task List */}
        <TaskList ref={taskListRef} />
      </div>

      {/* Invite User Dialog */}
      {project && (
        <InviteUserDialog
          isOpen={inviteDialogOpen}
          onClose={() => setInviteDialogOpen(false)}
          projectId={project.id}
          projectName={project.name}
          onInviteSent={() => {
            // Refresh project data if needed
          }}
        />
      )}
    </div>
  );
}
