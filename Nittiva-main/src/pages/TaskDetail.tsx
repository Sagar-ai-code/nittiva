import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTask } from "@/context/TaskContext";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Share,
  MoreVertical,
  ChevronDown,
  Bot,
  Circle,
  Users,
  CalendarDays,
  Flag,
  Timer,
  Target,
  Tag,
  Link,
  FileText,
  Search,
  Filter,
  Calendar,
  Plus,
  Send,
  Edit2,
  Save,
  X,
  Check,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TaskTag {
  id: string;
  name: string;
  color: string;
}

const mockTags: TaskTag[] = [
  { id: "1", name: "Frontend", color: "#3b82f6" },
  { id: "2", name: "Backend", color: "#10b981" },
  { id: "3", name: "Design", color: "#f59e0b" },
  { id: "4", name: "Research", color: "#8b5cf6" },
  { id: "5", name: "Bug", color: "#ef4444" },
  { id: "6", name: "Feature", color: "#06b6d4" },
];

const priorityIcons = {
  high: { icon: Flag, color: "text-red-500" },
  medium: { icon: Flag, color: "text-orange-500" },
  low: { icon: Flag, color: "text-gray-500" },
};

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, updateTask } = useTask();
  const { users, getUserById } = useUser();
  const { user } = useAuth();
  const isAgent = (user as any)?.role === "agent";

  const task = tasks.find((t) => t.id === parseInt(taskId || "0"));
  const [newComment, setNewComment] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [selectedTags, setSelectedTags] = useState<TaskTag[]>([]);
  const [showAssigneePopover, setShowAssigneePopover] = useState(false);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");
  const [sprints, setSprints] = useState<any[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);

  useEffect(() => {
    if (task) {
      setEditValues(task);
      setStartDate(task.startDate || "");
      setTimeEstimate(task.timeEstimate || "");
      setDescription(task.description || "");
    }
  }, [task]);

  const loadSprints = async () => {
    if (!task?.projectId) return;
    
    setLoadingSprints(true);
    try {
      const response = await apiService.getSprints({ project: Number(task.projectId) });
      if (response.success && response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : (response.data.results || []);
        setSprints(dataArray);
      }
    } catch (error) {
      console.error("Failed to load sprints:", error);
    } finally {
      setLoadingSprints(false);
    }
  };

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Task not found
          </h2>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleFieldEdit = (field: string, value: any) => {
    updateTask(task.id, { [field]: value });
    setEditingField(null);
  };

  const handleTitleEdit = (newTitle: string) => {
    updateTask(task.id, { name: newTitle });
  };

  const handleDescriptionSave = () => {
    updateTask(task.id, { description });
    setEditingField(null);
  };

  const handleAssigneeToggle = (userId: string) => {
    const currentAssignees = task.assigneeIds || [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter((id) => id !== userId)
      : [...currentAssignees, userId];

    updateTask(task.id, {
      assigneeIds: newAssignees,
      assigneeId: newAssignees[0] || "", // Keep backward compatibility
    });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    setNewComment("");
  };

  const addTag = (tag: TaskTag) => {
    if (!selectedTags.find((t) => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
      // Update task with new tags
      updateTask(task.id, { tags: [...selectedTags, tag].map((t) => t.id) });
    }
  };

  const removeTag = (tagId: string) => {
    const newTags = selectedTags.filter((t) => t.id !== tagId);
    setSelectedTags(newTags);
    updateTask(task.id, { tags: newTags.map((t) => t.id) });
  };

  const EditableField = ({
    field,
    value,
    type = "text",
    placeholder = "",
    className = "",
    selectOptions = null,
    disabled = false,
  }: {
    field: string;
    value: any;
    type?: string;
    placeholder?: string;
    className?: string;
    selectOptions?: { value: string; label: string }[] | null;
    disabled?: boolean;
  }) => {
    const isEditing = editingField === field;

    if (selectOptions) {
      return isEditing ? (
        <div className="flex items-center gap-2">
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldEdit(field, newValue)}
          >
            <SelectTrigger className="bg-dashboard-surface border-dashboard-border text-white text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingField(null)}
            className="w-6 h-6 p-0 text-gray-400"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className={cn("text-sm", value ? "text-white" : "text-gray-500")}
          >
            {value
              ? selectOptions.find((opt) => opt.value === value)?.label
              : "Not set"}
          </span>
          {!disabled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingField(field)}
              className="w-6 h-6 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      );
    }

    return isEditing ? (
      <div className="flex items-center gap-2">
        <Input
          type={type}
          value={editValues[field] || ""}
          onChange={(e) =>
            setEditValues((prev) => ({ ...prev, [field]: e.target.value }))
          }
          placeholder={placeholder}
          className={cn(
            "bg-dashboard-surface border-dashboard-border text-white text-sm h-8",
            className,
          )}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFieldEdit(field, editValues[field]);
            } else if (e.key === "Escape") {
              setEditingField(null);
              setEditValues((prev) => ({ ...prev, [field]: value }));
            }
          }}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleFieldEdit(field, editValues[field])}
          className="w-6 h-6 p-0 text-accent hover:text-accent/80"
        >
          <Save className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditingField(null);
            setEditValues((prev) => ({ ...prev, [field]: value }));
          }}
          className="w-6 h-6 p-0 text-gray-400"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    ) : (
      <div className="flex items-center gap-2 group">
        <span className={cn("text-sm", value ? "text-white" : "text-gray-500")}>
          {value || placeholder || "Not set"}
        </span>
        {!disabled && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingField(field);
              setEditValues((prev) => ({ ...prev, [field]: value }));
            }}
            className="w-6 h-6 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full flex flex-col bg-dashboard-bg"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white p-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Team Space</span>
            <span>/</span>
            <span>Verdgreen Hotels</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Created on Jul 11</span>
          <Button size="sm" className="bg-accent text-black hover:bg-accent/90">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Task Header */}
          <div className="p-6 border-b border-dashboard-border">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-xs text-white font-medium">T</span>
                </div>
                <span className="text-sm text-gray-400">Task</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm text-gray-400">#{task.id}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto bg-purple-600 text-white hover:bg-purple-700 text-xs"
              >
                <Bot className="w-3 h-3 mr-1" />
                Ask AI
              </Button>
            </div>

            {/* Editable Task Title */}
            <div className="group">
              {editingField === "title" ? (
                <div className="flex items-center gap-2 mb-4">
                  <Input
                    value={editValues.name || ""}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="text-xl font-medium bg-transparent border-dashboard-border text-white h-auto py-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTitleEdit(editValues.name);
                        setEditingField(null);
                      } else if (e.key === "Escape") {
                        setEditingField(null);
                        setEditValues((prev) => ({ ...prev, name: task.name }));
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      handleTitleEdit(editValues.name);
                      setEditingField(null);
                    }}
                    className="text-accent hover:text-accent/80"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingField(null);
                      setEditValues((prev) => ({ ...prev, name: task.name }));
                    }}
                    className="text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <h1 className="text-xl font-medium text-white">
                    {task.name}
                  </h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingField("title");
                      setEditValues((prev) => ({ ...prev, name: task.name }));
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Properties Section */}
          <div className="p-6 space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3 group">
              <Circle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 w-20">Status</span>
              <Select
                value={task.status}
                onValueChange={(value) =>
                  updateTask(task.id, { status: value as any })
                }
              >
                <SelectTrigger className="w-40 h-8 bg-dashboard-surface border-dashboard-border text-sm">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {task.status === "to-do" && (
                        <Circle className="w-3 h-3" />
                      )}
                      {task.status === "in-progress" && (
                        <Clock className="w-3 h-3" />
                      )}
                      {task.status === "completed" && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span className="uppercase text-xs font-medium">
                        {task.status.replace("-", " ")}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to-do">
                    <div className="flex items-center gap-2">
                      <Circle className="w-3 h-3" />
                      TO DO
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      IN PROGRESS
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" />
                      COMPLETED
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignees */}
            <div className="flex items-center gap-3 group">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 w-20">Assignees</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {task.assigneeIds && task.assigneeIds.length > 0 ? (
                    task.assigneeIds.map((assigneeId) => {
                      const user = getUserById(assigneeId);
                      return user ? (
                        <div
                          key={assigneeId}
                          className="flex items-center gap-2 bg-dashboard-surface/50 rounded-md px-2 py-1"
                        >
                          <Avatar className="w-5 h-5">
                            <AvatarFallback
                              className="text-xs text-white"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-300">
                            {user.name}
                          </span>
                        </div>
                      ) : null;
                    })
                  ) : (
                    <span className="text-sm text-gray-500">Unassigned</span>
                  )}
                </div>
                <Popover
                  open={showAssigneePopover}
                  onOpenChange={setShowAssigneePopover}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-dashboard-surface border-dashboard-border">
                    <div className="space-y-2">
                      <h4 className="font-medium text-white mb-3">
                        Assign to:
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {users.map((user) => {
                          const isSelected = (task.assigneeIds || []).includes(
                            user.id,
                          );
                          return (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 p-2 rounded hover:bg-dashboard-bg transition-colors cursor-pointer"
                              onClick={() => handleAssigneeToggle(user.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleAssigneeToggle(user.id)}
                                className="rounded border-dashboard-border bg-transparent"
                              />
                              <Avatar className="w-6 h-6">
                                <AvatarFallback
                                  className="text-xs"
                                  style={{ backgroundColor: user.color }}
                                >
                                  {user.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-300">
                                {user.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sprint */}
            <div className="flex items-center gap-3 group">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 w-20">Sprint</span>
              <Select
                value={task.sprint ? String(task.sprint) : "none"}
                onValueChange={async (value) => {
                  const sprintId = value === "none" ? null : Number(value);
                  try {
                    await updateTask(task.id, { sprint: sprintId } as any);
                  } catch (error) {
                    console.error("Failed to update sprint:", error);
                  }
                }}
              >
                <SelectTrigger className="w-64 h-8 bg-dashboard-surface border-dashboard-border text-sm">
                  <SelectValue placeholder="No Sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-400">No Sprint</span>
                  </SelectItem>
                  {loadingSprints ? (
                    <SelectItem value="loading" disabled>
                      Loading sprints...
                    </SelectItem>
                  ) : (
                    sprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={String(sprint.id)}>
                        <div className="flex items-center gap-2">
                          <Target className="w-3 h-3 text-accent" />
                          <span>{sprint.name}</span>
                          {sprint.status && (
                            <Badge variant="outline" className="text-xs ml-1">
                              {sprint.status}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-3 group">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 w-20">Dates</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <EditableField
                    field="startDate"
                    value={task.startDate}
                    type="date"
                    placeholder="Start date"
                    className="w-32"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <EditableField
                    field="dueDate"
                    value={task.dueDate}
                    type="date"
                    placeholder="Due date"
                    className="w-32"
                    disabled={isAgent}
                  />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3 group">
              <Flag className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 w-20">Priority</span>
              <EditableField
                field="priority"
                value={task.priority}
                selectOptions={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </div>

            {/* Time Estimate */}
            <div className="flex items-center gap-3 group">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 w-20">Time Estimate</span>
              <EditableField
                field="timeEstimate"
                value={task.timeEstimate}
                placeholder="e.g., 2h 30m"
                className="w-32"
              />
            </div>

            {/* Track Time */}
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 w-20">Track Time</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={task.trackTime || false}
                  onCheckedChange={(checked) =>
                    updateTask(task.id, { trackTime: checked })
                  }
                  className="scale-75"
                />
                <span className="text-xs text-gray-400">
                  {task.trackTime ? "On" : "Off"}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-3 group">
              <Tag className="w-4 h-4 text-gray-400 mt-1" />
              <span className="text-sm text-gray-400 w-20">Tags</span>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                      <button
                        onClick={() => removeTag(tag.id)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-400 hover:text-white h-6"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-dashboard-surface border-dashboard-border">
                    <div className="space-y-2">
                      <h4 className="font-medium text-white">Add Tags</h4>
                      <div className="grid gap-2">
                        {mockTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => addTag(tag)}
                            className="flex items-center gap-2 p-2 rounded hover:bg-dashboard-bg transition-colors text-left"
                          >
                            <Tag
                              className="w-4 h-4"
                              style={{ color: tag.color }}
                            />
                            <span className="text-sm text-white">
                              {tag.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Relationships */}
            <div className="flex items-center gap-3 group">
              <Link className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 w-20">Relationships</span>
              <EditableField
                field="relationships"
                value={task.relationships}
                placeholder="Related tasks..."
                className="flex-1"
              />
            </div>
          </div>

          <Separator className="bg-dashboard-border" />

          {/* Description Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Description</span>
            </div>

            {editingField === "description" ? (
              <div className="space-y-3">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="bg-dashboard-surface border-dashboard-border text-white min-h-[120px] resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleDescriptionSave}
                    className="bg-accent text-black hover:bg-accent/90"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingField(null);
                      setDescription(task.description || "");
                    }}
                    className="text-gray-400"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="group cursor-pointer"
                onClick={() => setEditingField("description")}
              >
                {description ? (
                  <div className="bg-dashboard-surface border border-dashboard-border rounded-md p-3 text-sm text-gray-300 hover:border-gray-500 transition-colors">
                    {description}
                  </div>
                ) : (
                  <div className="bg-dashboard-surface border border-dashed border-dashboard-border rounded-md p-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-400 transition-colors">
                    Click to add a description...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activity Sidebar */}
        <div className="w-80 border-l border-dashboard-border bg-dashboard-surface/30 flex flex-col">
          <div className="p-4 border-b border-dashboard-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white flex items-center gap-2">
                Activity
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-gray-400"
                >
                  <Search className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-gray-400"
                >
                  <Filter className="w-3 h-3" />
                </Button>
                <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                  2
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-gray-400"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-xs text-gray-400 hover:text-white p-0 h-auto"
            >
              Show more
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-blue-600 text-white">
                    You
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">
                    Yesterday at 4:35 pm
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="text-white">You</span> updated the task
                    description
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-green-600 text-white">
                    SM
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">
                    Yesterday at 4:35 pm
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="text-white">Sagar Mantry</span> created
                    this task
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-dashboard-border">
            <div className="flex items-center gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
              <Button
                onClick={addComment}
                disabled={!newComment.trim()}
                size="sm"
                className="bg-accent text-black hover:bg-accent/90 disabled:opacity-50 h-8 px-3"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
