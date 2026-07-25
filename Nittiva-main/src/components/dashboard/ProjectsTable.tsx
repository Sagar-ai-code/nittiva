import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import {
  MoreHorizontal,
  Eye,
  Users,
  Calendar,
  GripVertical,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

interface Project {
  id: number;
  title: string;
  users: number;
  clients: number;
  taskCount: number;
  status: "completed" | "in-progress" | "pending";
  priority: "high" | "medium" | "low";
}

const mockProjects: Project[] = [
  {
    id: 1,
    title: "barras el feroz",
    users: 4,
    clients: 2,
    taskCount: 8,
    status: "in-progress",
    priority: "high",
  },
  {
    id: 2,
    title: "Social Media Content",
    users: 3,
    clients: 1,
    taskCount: 5,
    status: "pending",
    priority: "medium",
  },
  {
    id: 3,
    title: "Website Redesign",
    users: 6,
    clients: 1,
    taskCount: 12,
    status: "completed",
    priority: "low",
  },
];

const statusColors = {
  completed: "bg-accent",
  "in-progress": "bg-gray-600",
  pending: "bg-gray-800",
};

const statusLabels = {
  completed: "Completed",
  "in-progress": "In Progress",
  pending: "Pending",
};

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-orange-500",
  low: "bg-gray-500",
};

const priorityLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function ProjectsTable() {
  const { user } = useAuth();
  const isAgent = (user as any)?.role === "agent";
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Project>>({});

  const startEditing = (project: Project) => {
    setEditingProject(project.id);
    setEditValues(project);
  };

  const saveEditing = () => {
    if (editingProject && editValues) {
      setProjects(
        projects.map((p) =>
          p.id === editingProject ? { ...p, ...editValues } : p,
        ),
      );
    }
    setEditingProject(null);
    setEditValues({});
  };

  const cancelEditing = () => {
    setEditingProject(null);
    setEditValues({});
  };

  const updateEditValue = (field: keyof Project, value: any) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-card border border-dashboard-border rounded-lg"
    >
      {/* Header with tabs */}
      <div className="border-b border-dashboard-border">
        <div className="flex items-center gap-6 px-6 py-4">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent text-black text-sm font-normal">
            <Users className="w-4 h-4" />
            Projects
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-400 hover:text-white text-sm font-medium transition-colors">
            <Calendar className="w-4 h-4" />
            Tasks
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-dashboard-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-normal text-white">
            olsocials's Projects
          </h3>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Find due between" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Find due between" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user1">John Doe</SelectItem>
              <SelectItem value="user2">Jane Smith</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client1">Client A</SelectItem>
              <SelectItem value="client2">Client B</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
            >
              Deleted selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
            >
              Save Column Visibility
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dashboard-border">
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="rounded border-dashboard-border"
                />
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                Users
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                Clients
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                Tasks Count
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <Reorder.Group
            as="tbody"
            values={projects}
            onReorder={setProjects}
            className="divide-y divide-dashboard-border"
          >
            {projects.map((project, index) => (
              <Reorder.Item
                key={project.id}
                value={project}
                as="tr"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="table-row group"
                whileDrag={{
                  scale: 1.02,
                  boxShadow: "0 10px 30px rgba(190, 252, 169, 0.2)",
                  backgroundColor: "#1a1a1a",
                }}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input
                      type="checkbox"
                      className="rounded border-dashboard-border"
                    />
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-300">
                  {project.id}
                </td>
                <td className="py-4 px-6 text-sm text-white font-medium">
                  {editingProject === project.id ? (
                    <Input
                      value={editValues.title || ""}
                      onChange={(e) => updateEditValue("title", e.target.value)}
                      className="bg-dashboard-surface border-dashboard-border text-white h-8"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{project.title}</span>
                      {/* Hide edit button for agents */}
                      {!isAgent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEditing(project)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-gray-300">
                  {editingProject === project.id ? (
                    <Input
                      type="number"
                      value={editValues.users || 0}
                      onChange={(e) =>
                        updateEditValue("users", parseInt(e.target.value))
                      }
                      className="bg-dashboard-surface border-dashboard-border text-white h-8 w-20"
                    />
                  ) : (
                    project.users
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-gray-300">
                  {editingProject === project.id ? (
                    <Input
                      type="number"
                      value={editValues.clients || 0}
                      onChange={(e) =>
                        updateEditValue("clients", parseInt(e.target.value))
                      }
                      className="bg-dashboard-surface border-dashboard-border text-white h-8 w-20"
                    />
                  ) : (
                    project.clients
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-gray-300">
                  {editingProject === project.id ? (
                    <Input
                      type="number"
                      value={editValues.taskCount || 0}
                      onChange={(e) =>
                        updateEditValue("taskCount", parseInt(e.target.value))
                      }
                      className="bg-dashboard-surface border-dashboard-border text-white h-8 w-20"
                    />
                  ) : (
                    project.taskCount
                  )}
                </td>
                <td className="py-4 px-6">
                  {editingProject === project.id ? (
                    <Select
                      value={editValues.status || project.status}
                      onValueChange={(value) =>
                        updateEditValue("status", value)
                      }
                    >
                      <SelectTrigger className="w-32 h-8 bg-dashboard-surface border-dashboard-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="secondary"
                      className={`${statusColors[project.status]} ${project.status === "completed" ? "text-black" : "text-white"} border-0 font-normal`}
                    >
                      {statusLabels[project.status]}
                    </Badge>
                  )}
                </td>
                <td className="py-4 px-6">
                  {editingProject === project.id ? (
                    <Select
                      value={editValues.priority || project.priority}
                      onValueChange={(value) =>
                        updateEditValue("priority", value)
                      }
                    >
                      <SelectTrigger className="w-24 h-8 bg-dashboard-surface border-dashboard-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="secondary"
                      className={`${priorityColors[project.priority]} text-white border-0 font-normal`}
                    >
                      {priorityLabels[project.priority]}
                    </Badge>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {editingProject === project.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-accent hover:text-accent"
                          onClick={saveEditing}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          onClick={cancelEditing}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </table>
      </div>
    </motion.div>
  );
}
