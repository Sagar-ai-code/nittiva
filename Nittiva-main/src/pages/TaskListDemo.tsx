import React from "react";
import { motion } from "framer-motion";
import { TaskList } from "@/components/dashboard/TaskList";

export default function TaskListDemo() {
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
          <div>
            <h1 className="text-2xl font-normal text-white mb-1">
              Dynamic Task List
            </h1>
            <p className="text-gray-400 text-sm">
              Manage tasks with customizable fields and horizontal scrolling
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-6">
        <TaskList />
      </div>
    </div>
  );
}
