import { motion } from "framer-motion";
import { Plus, List, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTask } from "@/context/TaskContext";

interface Todo {
  id: string;
  title: string;
  date: string;
  status: "active" | "completed";
}

export default function TodoOverview() {
  const { tasks } = useTask();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Convert tasks to todos format
    const taskTodos: Todo[] = tasks
      .filter((task) => task.status !== "completed")
      .slice(0, 10)
      .map((task) => ({
        id: String(task.id),
        title: task.name || "Untitled Task",
        date: new Date().toLocaleString(),
        status: task.status === "completed" ? "completed" : "active" as const,
      }));
    
    setTodos(taskTodos);
    setLoading(false);
  }, [tasks]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card border border-dashboard-border rounded-lg h-full flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
        <h3 className="text-lg font-normal text-white">Todos overview</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-accent text-black hover:bg-accent/80 h-7 w-7 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white h-7 w-7 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No active todos
          </div>
        ) : (
          todos.map((todo, index) => (
          <motion.div
            key={todo.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-dashboard-surface rounded-lg border border-dashboard-border hover:border-accent/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="rounded border-dashboard-border bg-transparent"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {todo.title}
                </span>
                <span className="text-xs text-gray-400">{todo.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-accent text-black text-xs font-normal"
              >
                {todo.status}
              </Badge>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
