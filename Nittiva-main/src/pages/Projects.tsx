import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Folder,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { useProject, Project } from "@/context/ProjectContext";

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const getStatusColor = (status?: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "in-progress":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "archived":
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    default:
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  }
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

const emptyProject: Omit<Project, "id"> = {
  name: "",
  description: "",
  color: "#8b5cf6",
  status: "todo",
};

export default function Projects() {
  const {
    projects,
    loading,
    error,
    reloadProjects,
    addProject,
    updateProject,
    deleteProject,
  } = useProject();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<Omit<Project, "id">>(emptyProject);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term),
    );
  }, [projects, searchTerm]);

  const resetForm = () => setForm(emptyProject);

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      color: project.color || "#8b5cf6",
      status: project.status || "todo",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProject) {
        const updated = await updateProject(editingProject.id, form);
        if (updated) {
          toast.success("Project updated");
          setEditingProject(null);
          resetForm();
        } else {
          toast.error("Failed to update project");
        }
      } else {
        const created = await addProject(form);
        if (created) {
          toast.success("Project created");
          setIsCreateOpen(false);
          resetForm();
        } else {
          toast.error("Failed to create project");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    try {
      await deleteProject(deletingProject.id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeletingProject(null);
    }
  };

  const onCloseCreate = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const onCloseEdit = () => {
    setEditingProject(null);
    resetForm();
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
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dashboard-bg border-dashboard-border text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="bg-accent text-black hover:bg-accent/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-6 space-y-6 overflow-auto h-[calc(100%-73px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-normal text-white mb-1">Projects</h1>
            <p className="text-gray-400 text-sm">
              {projects.length} project{projects.length !== 1 ? "s" : ""} total
            </p>
          </div>
          {error && (
            <Button
              variant="outline"
              size="sm"
              onClick={reloadProjects}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Retry
            </Button>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 bg-dashboard-surface rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-2">{error}</p>
            <Button
              onClick={reloadProjects}
              className="bg-accent text-black hover:bg-accent/80"
            >
              Retry
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <Folder className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No projects found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm
                ? "Try a different search term"
                : "Create your first project to get started"}
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreate}
                className="bg-accent text-black hover:bg-accent/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="bg-dashboard-surface border-dashboard-border text-white h-full flex flex-col">
                  <div
                    className="h-1.5 w-full rounded-t-lg"
                    style={{ backgroundColor: project.color || "#8b5cf6" }}
                  />
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-medium truncate pr-2">
                        {project.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {project.description || "No description"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-white shrink-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-dashboard-surface border-dashboard-border">
                        <DropdownMenuItem
                          onClick={() => openEdit(project)}
                          className="text-white focus:bg-sidebar-hover cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingProject(project)}
                          className="text-red-400 focus:bg-sidebar-hover cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0 flex-1">
                    <div className="flex items-center gap-3 mt-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(project.status)}
                      >
                        {(project.status || "todo")
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {project.taskCount ?? 0} task
                        {(project.taskCount ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {project.createdAt && (
                      <p className="text-xs text-gray-500 mt-3">
                        Created {formatDate(project.createdAt)}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link
                      to={`/dashboard/projects/${project.id}`}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-dashboard-border text-white hover:bg-sidebar-hover"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Project
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingProject}
        onOpenChange={(open) => {
          if (!open) {
            onCloseCreate();
            onCloseEdit();
          }
        }}
      >
        <DialogContent className="bg-dashboard-surface border-dashboard-border">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProject ? "Edit Project" : "Create Project"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Project Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                  placeholder="e.g. Website Redesign"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Description
                </label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                  placeholder="Short description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Status
                  </label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dashboard-surface border-dashboard-border">
                      {statusOptions.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                          className="text-white focus:bg-sidebar-hover"
                        >
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="h-10 w-14 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-sm text-gray-400">{form.color}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onCloseCreate();
                  onCloseEdit();
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent text-black hover:bg-accent/80"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingProject
                  ? "Save Changes"
                  : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <DialogContent className="bg-dashboard-surface border-dashboard-border">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300 py-4">
            Are you sure you want to delete{" "}
            <span className="font-medium text-white">
              {deletingProject?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeletingProject(null)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
