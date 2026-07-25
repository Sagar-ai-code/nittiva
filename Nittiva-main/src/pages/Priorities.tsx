import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  AlertTriangle,
  Settings,
  BarChart3,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface TaskPriority {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  order: number;
  weight: number;
  description?: string;
  is_active: boolean;
  task_count?: number;
  created_at?: string;
  updated_at?: string;
}

const defaultColors = [
  { name: "Red", value: "#ef4444", border: "#dc2626" },
  { name: "Orange", value: "#f97316", border: "#ea580c" },
  { name: "Yellow", value: "#f59e0b", border: "#d97706" },
  { name: "Blue", value: "#3b82f6", border: "#2563eb" },
  { name: "Green", value: "#10b981", border: "#059669" },
  { name: "Purple", value: "#8b5cf6", border: "#7c3aed" },
  { name: "Pink", value: "#ec4899", border: "#db2777" },
  { name: "Indigo", value: "#6366f1", border: "#4f46e5" },
  { name: "Teal", value: "#14b8a6", border: "#0d9488" },
  { name: "Gray", value: "#6b7280", border: "#4b5563" },
];

export default function Priorities() {
  const { user } = useAuth();
  const isManager = user?.role === "manager" || user?.role === "admin" || user?.is_staff;

  const [priorities, setPriorities] = useState<TaskPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPriority, setEditingPriority] = useState<TaskPriority | null>(null);
  const [deletingPriority, setDeletingPriority] = useState<TaskPriority | null>(null);
  const [statistics, setStatistics] = useState<any[]>([]);
  const [showStatistics, setShowStatistics] = useState(false);

  const [priorityForm, setPriorityForm] = useState({
    name: "",
    slug: "",
    color: "#ef4444",
    icon: "",
    order: 0,
    weight: 0,
    description: "",
    is_active: true,
  });

  useEffect(() => {
    loadPriorities();
    loadStatistics();
  }, []);

  const loadPriorities = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTaskPriorities({ is_active: true });
      if (response.success && response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : (response.data.results || []);
        setPriorities(dataArray.sort((a, b) => a.order - b.order || b.weight - a.weight));
      }
    } catch (error: any) {
      console.error("Failed to load priorities:", error);
      toast.error("Failed to load priorities");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiService.getTaskPriorityStatistics();
      if (response.success && response.data) {
        setStatistics(response.data.statistics || []);
      }
    } catch (error: any) {
      console.error("Failed to load statistics:", error);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleCreatePriority = async () => {
    if (!priorityForm.name.trim()) {
      toast.error("Priority name is required");
      return;
    }

    if (!priorityForm.slug.trim()) {
      priorityForm.slug = generateSlug(priorityForm.name);
    }

    try {
      const response = await apiService.createTaskPriority({
        ...priorityForm,
        order: priorities.length,
      });

      if (response.success) {
        toast.success(`Priority "${priorityForm.name}" created successfully`);
        setIsCreating(false);
        setPriorityForm({
          name: "",
          slug: "",
          color: "#ef4444",
          icon: "",
          order: 0,
          weight: 0,
          description: "",
          is_active: true,
        });
        loadPriorities();
        loadStatistics();
      } else {
        toast.error(response.message || "Failed to create priority");
      }
    } catch (error: any) {
      console.error("Failed to create priority:", error);
      toast.error(error.message || "Failed to create priority");
    }
  };

  const handleUpdatePriority = async () => {
    if (!editingPriority || !priorityForm.name.trim()) {
      toast.error("Priority name is required");
      return;
    }

    try {
      const response = await apiService.updateTaskPriority(editingPriority.id, priorityForm);

      if (response.success) {
        toast.success("Priority updated successfully");
        setEditingPriority(null);
        setPriorityForm({
          name: "",
          slug: "",
          color: "#ef4444",
          icon: "",
          order: 0,
          weight: 0,
          description: "",
          is_active: true,
        });
        loadPriorities();
        loadStatistics();
      } else {
        toast.error(response.message || "Failed to update priority");
      }
    } catch (error: any) {
      console.error("Failed to update priority:", error);
      toast.error(error.message || "Failed to update priority");
    }
  };

  const handleDeletePriority = async () => {
    if (!deletingPriority) return;

    try {
      const response = await apiService.deleteTaskPriority(deletingPriority.id);

      if (response.success) {
        toast.success("Priority deleted successfully");
        setDeletingPriority(null);
        loadPriorities();
        loadStatistics();
      } else {
        toast.error(response.message || "Failed to delete priority");
      }
    } catch (error: any) {
      console.error("Failed to delete priority:", error);
      toast.error(error.message || "Failed to delete priority");
    }
  };

  const openEditDialog = (priority: TaskPriority) => {
    setEditingPriority(priority);
    setPriorityForm({
      name: priority.name,
      slug: priority.slug,
      color: priority.color,
      icon: priority.icon || "",
      order: priority.order,
      weight: priority.weight,
      description: priority.description || "",
      is_active: priority.is_active,
    });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newPriorities = [...priorities];
    [newPriorities[index - 1], newPriorities[index]] = [newPriorities[index], newPriorities[index - 1]];
    
    const orders = newPriorities.map((p, i) => ({ id: p.id, order: i }));
    await handleReorder(orders);
  };

  const handleMoveDown = async (index: number) => {
    if (index === priorities.length - 1) return;
    const newPriorities = [...priorities];
    [newPriorities[index], newPriorities[index + 1]] = [newPriorities[index + 1], newPriorities[index]];
    
    const orders = newPriorities.map((p, i) => ({ id: p.id, order: i }));
    await handleReorder(orders);
  };

  const handleReorder = async (newOrder: Array<{ id: string; order: number }>) => {
    try {
      const response = await apiService.bulkReorderTaskPriorities(newOrder);
      if (response.success) {
        loadPriorities();
      } else {
        toast.error("Failed to reorder priorities");
      }
    } catch (error: any) {
      console.error("Failed to reorder priorities:", error);
      toast.error("Failed to reorder priorities");
    }
  };

  if (loading && priorities.length === 0) {
    return (
      <div className="h-full bg-dashboard-bg p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
          <div>
            <h1 className="text-3xl font-normal text-white">Task Priorities</h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage custom priorities for your organization
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStatistics(!showStatistics)}
              className="border-dashboard-border text-gray-400 hover:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </Button>
            {isManager && (
              <Button
                onClick={() => {
                  setIsCreating(true);
                  setPriorityForm({
                    name: "",
                    slug: "",
                    color: "#ef4444",
                    icon: "",
                    order: priorities.length,
                    weight: 0,
                    description: "",
                    is_active: true,
                  });
                }}
                className="bg-accent text-black hover:bg-accent/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Priority
              </Button>
            )}
          </div>
        </div>

        {/* Statistics */}
        {showStatistics && statistics.length > 0 && (
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Priority Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statistics.map((stat: any) => {
                  const priority = priorities.find((p) => p.id === stat.id);
                  return (
                    <div
                      key={stat.id}
                      className="bg-dashboard-bg border border-dashboard-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {priority && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: priority.color }}
                            />
                          )}
                          <span className="text-white text-sm font-medium">
                            {stat.name}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-dashboard-surface text-gray-400">
                          {stat.task_count || 0}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {stat.task_count || 0} task{stat.task_count !== 1 ? "s" : ""} using this priority
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priorities List */}
        {priorities.length === 0 ? (
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardContent className="py-12 text-center">
              <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No Priorities Yet</h3>
              <p className="text-gray-400 text-sm mb-4">
                Create your first custom priority to get started
              </p>
              {isManager && (
                <Button
                  onClick={() => setIsCreating(true)}
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Priority
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {priorities.map((priority, index) => (
              <motion.div
                key={priority.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="bg-dashboard-surface border-dashboard-border hover:border-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === priorities.length - 1}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full border-2"
                          style={{
                            backgroundColor: priority.color,
                            borderColor: priority.color,
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-medium">{priority.name}</h3>
                            {!priority.is_active && (
                              <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-400 border-gray-500/30">
                                Inactive
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                              Weight: {priority.weight}
                            </Badge>
                          </div>
                          {priority.description && (
                            <p className="text-gray-400 text-sm mt-1">{priority.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Slug: {priority.slug}</span>
                            <span>Order: {priority.order}</span>
                            {priority.task_count !== undefined && (
                              <span>{priority.task_count} task{priority.task_count !== 1 ? "s" : ""}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isManager && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(priority)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPriority(priority)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Priority</DialogTitle>
              <DialogDescription className="text-gray-400">
                Define a new priority for your tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-400">Priority Name *</Label>
                <Input
                  value={priorityForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setPriorityForm({
                      ...priorityForm,
                      name,
                      slug: priorityForm.slug || generateSlug(name),
                    });
                  }}
                  placeholder="e.g., Critical"
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-400">Slug</Label>
                <Input
                  value={priorityForm.slug}
                  onChange={(e) => setPriorityForm({ ...priorityForm, slug: e.target.value })}
                  placeholder="e.g., critical"
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly identifier (auto-generated from name)
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-400">Color</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {defaultColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setPriorityForm({ ...priorityForm, color: color.value })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        priorityForm.color === color.value
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-dashboard-surface scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{
                        backgroundColor: color.value,
                        borderColor: color.border,
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="text"
                    value={priorityForm.color}
                    onChange={(e) => setPriorityForm({ ...priorityForm, color: e.target.value })}
                    placeholder="#ef4444"
                    className="bg-dashboard-bg border-dashboard-border text-white flex-1"
                  />
                  <div
                    className="w-10 h-10 rounded border border-dashboard-border"
                    style={{ backgroundColor: priorityForm.color }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-400">Weight</Label>
                  <Input
                    type="number"
                    value={priorityForm.weight}
                    onChange={(e) =>
                      setPriorityForm({ ...priorityForm, weight: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher weight = more important (for sorting)
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Order</Label>
                  <Input
                    type="number"
                    value={priorityForm.order}
                    onChange={(e) =>
                      setPriorityForm({ ...priorityForm, order: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Display order (lower = first)
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-400">Description</Label>
                <Textarea
                  value={priorityForm.description}
                  onChange={(e) => setPriorityForm({ ...priorityForm, description: e.target.value })}
                  placeholder="Optional description for this priority"
                  rows={3}
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="create_is_active"
                  checked={priorityForm.is_active}
                  onCheckedChange={(checked) =>
                    setPriorityForm({ ...priorityForm, is_active: checked })
                  }
                />
                <Label htmlFor="create_is_active" className="text-sm text-gray-400 cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="border-dashboard-border text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePriority}
                className="bg-accent text-black hover:bg-accent/80"
              >
                Create Priority
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingPriority} onOpenChange={(open) => !open && setEditingPriority(null)}>
          <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Priority</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update priority details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-400">Priority Name *</Label>
                <Input
                  value={priorityForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setPriorityForm({
                      ...priorityForm,
                      name,
                      slug: priorityForm.slug || generateSlug(name),
                    });
                  }}
                  placeholder="e.g., Critical"
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-400">Slug</Label>
                <Input
                  value={priorityForm.slug}
                  onChange={(e) => setPriorityForm({ ...priorityForm, slug: e.target.value })}
                  placeholder="e.g., critical"
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-400">Color</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {defaultColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setPriorityForm({ ...priorityForm, color: color.value })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        priorityForm.color === color.value
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-dashboard-surface scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{
                        backgroundColor: color.value,
                        borderColor: color.border,
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="text"
                    value={priorityForm.color}
                    onChange={(e) => setPriorityForm({ ...priorityForm, color: e.target.value })}
                    placeholder="#ef4444"
                    className="bg-dashboard-bg border-dashboard-border text-white flex-1"
                  />
                  <div
                    className="w-10 h-10 rounded border border-dashboard-border"
                    style={{ backgroundColor: priorityForm.color }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-400">Weight</Label>
                  <Input
                    type="number"
                    value={priorityForm.weight}
                    onChange={(e) =>
                      setPriorityForm({ ...priorityForm, weight: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Order</Label>
                  <Input
                    type="number"
                    value={priorityForm.order}
                    onChange={(e) =>
                      setPriorityForm({ ...priorityForm, order: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-400">Description</Label>
                <Textarea
                  value={priorityForm.description}
                  onChange={(e) => setPriorityForm({ ...priorityForm, description: e.target.value })}
                  placeholder="Optional description for this priority"
                  rows={3}
                  className="bg-dashboard-bg border-dashboard-border text-white mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit_is_active"
                  checked={priorityForm.is_active}
                  onCheckedChange={(checked) =>
                    setPriorityForm({ ...priorityForm, is_active: checked })
                  }
                />
                <Label htmlFor="edit_is_active" className="text-sm text-gray-400 cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingPriority(null)}
                className="border-dashboard-border text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePriority}
                className="bg-accent text-black hover:bg-accent/80"
              >
                Update Priority
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingPriority} onOpenChange={(open) => !open && setDeletingPriority(null)}>
          <AlertDialogContent className="bg-dashboard-surface border-dashboard-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Priority</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Are you sure you want to delete "{deletingPriority?.name}"? This action cannot be undone.
                {deletingPriority?.task_count && deletingPriority.task_count > 0 && (
                  <span className="block mt-2 text-red-400">
                    Warning: This priority is used by {deletingPriority.task_count} task(s). You must reassign those tasks first.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-dashboard-border text-gray-400 hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePriority}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
