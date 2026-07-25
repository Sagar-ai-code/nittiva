import React from "react";
import { motion } from "framer-motion";
import { Plus, CheckSquare, Users, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/context/ProjectContext";
import { useTask } from "@/context/TaskContext";

interface EmptyTaskListProps {
  onCreateTask?: () => void;
}

export function EmptyTaskList({ onCreateTask }: EmptyTaskListProps) {
  const { currentProject } = useProject();
  const { addTask } = useTask();

const handleCreateFirstTask = () => {
  // If parent provided a creator, delegate to it (avoids double-create).
  if (onCreateTask) {
    onCreateTask();
    return;
  }

  // Fallback: create here only when no onCreateTask is passed.
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

  if (currentProject?.id) {
    addTask(newTask, currentProject.id);
  }
};


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-96 bg-card border border-dashboard-border rounded-lg p-12"
    >
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
          <CheckSquare className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-normal text-white mb-2">
          Start organizing your work
        </h3>
        <p className="text-gray-400 max-w-md">
          Create your first task in{" "}
          <span className="text-accent font-medium">
            {currentProject?.name || "this project"}
          </span>{" "}
          to start tracking progress and collaborating with your team.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
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
          <Target className="w-4 h-4 mr-2" />
          Import Tasks
        </Button>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center p-4 bg-dashboard-surface/50 rounded-lg border border-dashboard-border/50 hover:border-accent/30 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-5 h-5 text-blue-400" />
          </div>
          <h4 className="text-sm font-normal text-white mb-1 group-hover:text-accent transition-colors">
            Add Tasks
          </h4>
          <p className="text-xs text-gray-500">
            Create and organize your work items
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center p-4 bg-dashboard-surface/50 rounded-lg border border-dashboard-border/50 hover:border-accent/30 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <h4 className="text-sm font-normal text-white mb-1 group-hover:text-accent transition-colors">
            Assign Team
          </h4>
          <p className="text-xs text-gray-500">Collaborate with team members</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-center p-4 bg-dashboard-surface/50 rounded-lg border border-dashboard-border/50 hover:border-accent/30 transition-colors group cursor-pointer"
        >
          <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5 text-orange-400" />
          </div>
          <h4 className="text-sm font-normal text-white mb-1 group-hover:text-accent transition-colors">
            Set Deadlines
          </h4>
          <p className="text-xs text-gray-500">Track progress and due dates</p>
        </motion.div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-6 mt-8 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <span>TO DO</span>
          <span className="text-gray-600">0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span>IN PROGRESS</span>
          <span className="text-gray-600">0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>COMPLETED</span>
          <span className="text-gray-600">0</span>
        </div>
      </div>
    </motion.div>
  );
}

export default EmptyTaskList;
