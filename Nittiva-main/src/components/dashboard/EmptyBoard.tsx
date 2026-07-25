import React from "react";
import { motion } from "framer-motion";
import { Plus, Kanban, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/context/ProjectContext";
import { useTask } from "@/context/TaskContext";

interface EmptyBoardProps {
  onCreateTask?: () => void;
}

export function EmptyBoard({ onCreateTask }: EmptyBoardProps) {
  const { currentProject } = useProject();
  const { addTask } = useTask();

  const handleCreateFirstTask = () => {
    const newTask = {
      name: "My First Task",
      assigneeId: "",
      assigneeIds: [],
      dueDate: "",
      priority: "medium" as const,
      progress: 0,
      status: "to-do" as const,
      customFields: {},
    };
    addTask(newTask, currentProject?.id);
    if (onCreateTask) {
      onCreateTask();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-96 p-12">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-6">
          <Kanban className="w-10 h-10 text-accent" />
        </div>
        <h3 className="text-2xl font-normal text-white mb-3">
          Your board is ready
        </h3>
        <p className="text-gray-400 max-w-md">
          Create your first task in{" "}
          <span className="text-accent font-medium">
            {currentProject?.name || "this project"}
          </span>{" "}
          and watch it flow through your workflow stages.
        </p>
      </motion.div>

      {/* Column Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex gap-6 mb-8 w-full max-w-3xl"
      >
        {/* To Do Column */}
        <div className="flex-1 bg-dashboard-surface/50 rounded-lg border border-dashboard-border/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-sm text-gray-400 font-normal">To Do</span>
              <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                0
              </span>
            </div>
          </div>
          <div className="h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-500">Drop tasks here</span>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex-1 bg-dashboard-surface/50 rounded-lg border border-dashboard-border/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-400 font-normal">
                In Progress
              </span>
              <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">
                0
              </span>
            </div>
          </div>
          <div className="h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-500">Drop tasks here</span>
          </div>
        </div>

        {/* Completed Column */}
        <div className="flex-1 bg-dashboard-surface/50 rounded-lg border border-dashboard-border/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-400 font-normal">
                Completed
              </span>
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                0
              </span>
            </div>
          </div>
          <div className="h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-500">Drop tasks here</span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <Button
          onClick={handleCreateFirstTask}
          className="bg-accent text-black hover:bg-accent/90 font-normal"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create First Task
        </Button>
        <Button
          variant="outline"
          className="border-dashboard-border text-gray-400 hover:text-white font-normal"
        >
          <Users className="w-4 h-4 mr-2" />
          Invite Team
        </Button>
      </motion.div>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-center"
      >
        <p className="text-xs text-gray-500 mb-2">New to kanban boards?</p>
        <div className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 cursor-pointer transition-colors">
          <span>Learn how to organize your workflow</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </motion.div>
    </div>
  );
}

export default EmptyBoard;
