import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Bell,
  Globe,
  User as UserIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Flag,
  Calendar,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface Todo {
  id: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date?: string;
  project_id?: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
}

export default function Todos() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    status: "pending" as const,
    due_date: "",
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchTodos();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTodos();
      if (response.success && response.data) {
        setTodos(response.data);
      } else {
        toast.error(response.message || "Failed to load todos");
      }
    } catch (error) {
      toast.error("Failed to load todos");
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title) {
      toast.error("Title is required");
      return;
    }

    try {
      const response = await apiService.createTodo(newTodo);
      if (response.success) {
        toast.success("Todo created successfully");
        fetchTodos();
        setNewTodo({
          title: "",
          description: "",
          priority: "medium",
          status: "pending",
          due_date: "",
        });
        setShowAddDialog(false);
      } else {
        toast.error(response.message || "Failed to create todo");
      }
    } catch (error) {
      toast.error("Failed to create todo");
      console.error("Error creating todo:", error);
    }
  };

  const handleEditTodo = async () => {
    if (!editingTodo) return;

    try {
      const response = await apiService.updateTodo(editingTodo.id, editingTodo);
      if (response.success) {
        toast.success("Todo updated successfully");
        fetchTodos();
        setEditingTodo(null);
      } else {
        toast.error(response.message || "Failed to update todo");
      }
    } catch (error) {
      toast.error("Failed to update todo");
      console.error("Error updating todo:", error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      const response = await apiService.deleteTodo(id);
      if (response.success) {
        toast.success("Todo deleted successfully");
        fetchTodos();
      } else {
        toast.error(response.message || "Failed to delete todo");
      }
    } catch (error) {
      toast.error("Failed to delete todo");
      console.error("Error deleting todo:", error);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    const newStatus = todo.status === "completed" ? "pending" : "completed";
    try {
      const response = await apiService.updateTodo(todo.id, {
        ...todo,
        status: newStatus,
      });
      if (response.success) {
        toast.success(`Todo marked as ${newStatus}`);
        fetchTodos();
      } else {
        toast.error(response.message || "Failed to update todo");
      }
    } catch (error) {
      toast.error("Failed to update todo");
      console.error("Error updating todo:", error);
    }
  };

  const filteredTodos = todos.filter((todo) => {
    const matchesSearch =
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (todo.description &&
        todo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || todo.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || todo.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-500/20 text-green-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "high":
        return "bg-orange-500/20 text-orange-400";
      case "urgent":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500/20 text-blue-400";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getPriorityIcon = (priority: string) => {
    const iconClass = "w-4 h-4";
    switch (priority) {
      case "low":
        return <Flag className={`${iconClass} text-green-500`} />;
      case "medium":
        return <Flag className={`${iconClass} text-yellow-500`} />;
      case "high":
        return <Flag className={`${iconClass} text-orange-500`} />;
      case "urgent":
        return <Flag className={`${iconClass} text-red-500`} />;
      default:
        return <Flag className={`${iconClass} text-gray-400`} />;
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return (
      new Date(dueDate) < new Date() &&
      new Date(dueDate).toDateString() !== new Date().toDateString()
    );
  };

  const stats = {
    total: todos.length,
    pending: todos.filter((t) => t.status === "pending").length,
    in_progress: todos.filter((t) => t.status === "in_progress").length,
    completed: todos.filter((t) => t.status === "completed").length,
    overdue: todos.filter((t) => t.due_date && isOverdue(t.due_date)).length,
  };

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
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search todos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dashboard-bg border-dashboard-border text-white placeholder:text-gray-500"
              />
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
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-normal text-white mb-1">Todos</h1>
            <p className="text-gray-400 text-sm">
              Manage your personal tasks and todos
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-black hover:bg-accent/80">
                <Plus className="w-4 h-4 mr-2" />
                Add Todo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Todo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Title *</Label>
                  <Input
                    value={newTodo.title}
                    onChange={(e) =>
                      setNewTodo({ ...newTodo, title: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Todo title"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Description</Label>
                  <Textarea
                    value={newTodo.description}
                    onChange={(e) =>
                      setNewTodo({ ...newTodo, description: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                    placeholder="Todo description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-400">Priority</Label>
                    <Select
                      value={newTodo.priority}
                      onValueChange={(value: any) =>
                        setNewTodo({ ...newTodo, priority: value })
                      }
                    >
                      <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Status</Label>
                    <Select
                      value={newTodo.status}
                      onValueChange={(value: any) =>
                        setNewTodo({ ...newTodo, status: value })
                      }
                    >
                      <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Due Date</Label>
                  <Input
                    type="date"
                    value={newTodo.due_date}
                    onChange={(e) =>
                      setNewTodo({ ...newTodo, due_date: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddTodo}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Add Todo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="border-dashboard-border text-gray-400 hover:text-white flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, color: "blue" },
            { label: "Pending", value: stats.pending, color: "yellow" },
            { label: "In Progress", value: stats.in_progress, color: "blue" },
            { label: "Completed", value: stats.completed, color: "green" },
            { label: "Overdue", value: stats.overdue, color: "red" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              className="bg-card border border-dashboard-border rounded-lg p-4"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Todos List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4"
        >
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading todos...
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No todos found</div>
          ) : (
            filteredTodos.map((todo, index) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-card border border-dashboard-border rounded-lg p-4 hover:bg-dashboard-surface/50 transition-colors ${
                  todo.status === "completed" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => handleToggleComplete(todo)}
                  >
                    {todo.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 hover:text-white" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3
                          className={`text-sm font-medium ${
                            todo.status === "completed"
                              ? "line-through text-gray-400"
                              : "text-white"
                          }`}
                        >
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {todo.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(todo.priority)}
                            <Badge
                              className={`${getPriorityColor(todo.priority)} border-0 text-xs capitalize`}
                            >
                              {todo.priority}
                            </Badge>
                          </div>

                          <Badge
                            className={`${getStatusColor(todo.status)} border-0 text-xs capitalize`}
                          >
                            {todo.status.replace("_", " ")}
                          </Badge>

                          {todo.due_date && (
                            <div
                              className={`flex items-center gap-1 text-xs ${
                                isOverdue(todo.due_date)
                                  ? "text-red-400"
                                  : "text-gray-400"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {new Date(todo.due_date).toLocaleDateString()}
                              {isOverdue(todo.due_date) && (
                                <span className="text-red-400 font-medium">
                                  (Overdue)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-dashboard-surface border-dashboard-border"
                        >
                          <DropdownMenuItem
                            onClick={() => setEditingTodo(todo)}
                            className="text-gray-300 hover:text-white hover:bg-dashboard-bg"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={!!editingTodo} onOpenChange={() => setEditingTodo(null)}>
          <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Todo</DialogTitle>
            </DialogHeader>
            {editingTodo && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Title *</Label>
                  <Input
                    value={editingTodo.title}
                    onChange={(e) =>
                      setEditingTodo({ ...editingTodo, title: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Description</Label>
                  <Textarea
                    value={editingTodo.description || ""}
                    onChange={(e) =>
                      setEditingTodo({
                        ...editingTodo,
                        description: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-400">Priority</Label>
                    <Select
                      value={editingTodo.priority}
                      onValueChange={(value: any) =>
                        setEditingTodo({ ...editingTodo, priority: value })
                      }
                    >
                      <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Status</Label>
                    <Select
                      value={editingTodo.status}
                      onValueChange={(value: any) =>
                        setEditingTodo({ ...editingTodo, status: value })
                      }
                    >
                      <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Due Date</Label>
                  <Input
                    type="date"
                    value={editingTodo.due_date || ""}
                    onChange={(e) =>
                      setEditingTodo({
                        ...editingTodo,
                        due_date: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEditTodo}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Update Todo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingTodo(null)}
                    className="border-dashboard-border text-gray-400 hover:text-white flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
