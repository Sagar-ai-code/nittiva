import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";

export default function Tasks() {
  return (
    <div className="h-full bg-dashboard-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center h-full"
      >
        <div className="text-center">
          <div className="w-24 h-24 bg-purple/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <CheckSquare className="w-12 h-12 text-purple" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Tasks</h1>
          <p className="text-gray-400 text-lg max-w-md">
            This page will contain the comprehensive task management system.
            Features will include task creation, assignment, tracking, and
            progress monitoring.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
