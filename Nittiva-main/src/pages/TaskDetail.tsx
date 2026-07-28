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
  UserPlus,
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
  Eye,
  Activity,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
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
import { MentionInput, MentionText } from "@/components/mention";
import { TaskSubscriber } from "@/lib/api";
import { toast } from "sonner";

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

/**
 * P-4 (Priya): render a one-line summary for each TaskHistory row.
 * The `verb` tells us what kind of event; the `diff` is a free-form
 * JSONField with the structured details. Keep the strings tight and
 * human-friendly.
 */
function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function renderHistorySummary(h: TaskHistoryEntry): React.ReactNode {
  const d = h.diff || {};
  const name = h.actor?.name || h.actor?.email?.split("@")[0] || "Someone";
  switch (h.verb) {
    case "created":
      return <>created this task</>;
    case "assigned":
      return (
        <>
          assigned <span className="text-white">{d.user_name || d.user_email || "someone"}</span>
        </>
      );
    case "unassigned":
      return (
        <>
          unassigned <span className="text-white">{d.user_name || d.user_email || "someone"}</span>
        </>
      );
    case "commented":
      return (
        <>
          commented: <span className="text-gray-400">"{d.preview || "…"}"</span>
        </>
      );
    case "noted":
      return <>added a note</>;
    case "updated":
    default: {
      // Render up to 2 field changes per row, in a tight format
      const entries = Object.entries(d).slice(0, 2);
      if (entries.length === 0) return <>updated this task</>;
      return (
        <>
          {entries.map(([field, vals], i) => {
            const [from, to] = vals as [any, any];
            return (
              <span key={field}>
                {i > 0 && ", "}
                changed <span className="text-white">{field}</span>{" "}
                from <span className="text-gray-400">{String(from ?? "—")}</span> to{" "}
                <span className="text-white">{String(to ?? "—")}</span>
              </span>
            );
          })}
          {Object.keys(d).length > 2 && ` (+${Object.keys(d).length - 2} more)`}
        </>
      );
    }
  }
}

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
  // A-1: assignee picker now has an email search box + "Invite <email>" row
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [inviting, setInviting] = useState(false);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");
  const [sprints, setSprints] = useState<any[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);

  // Comments + subscribers state
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [subscribers, setSubscribers] = useState<TaskSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // P-4 (Priya): real activity feed from the TaskHistory endpoint
  // (V-1, Vikram). Replaces the hardcoded mock activity that used to
  // live in this sidebar.
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // A-1 follow-up: time spent on this task, broken down by user.
  // Admin uses this to see who worked how long on a task and how
  // long it took to close.
  const [timePerUser, setTimePerUser] = useState<{
    total_seconds: number;
    completed_in_seconds: number | null;
    by_user: Array<{
      user: { id: number; email: string; name: string; role: string };
      total_seconds: number;
      session_count: number;
      first_started_at: string;
      last_ended_at: string | null;
    }>;
  } | null>(null);
  const [loadingTimePerUser, setLoadingTimePerUser] = useState(false);

  const currentUserId = (user as any)?.id != null ? String((user as any).id) : null;
  const isCurrentUserSubscribed =
    !!currentUserId &&
    subscribers.some((s) => String(s.user?.id) === currentUserId);

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

  const loadComments = async () => {
    if (!task?.id) return;
    setLoadingComments(true);
    try {
      const response = await apiService.getComments("task", String(task.id));
      if (response.success && response.data) {
        const arr = Array.isArray(response.data)
          ? response.data
          : (response.data.results || []);
        setComments(arr);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadSubscribers = async () => {
    if (!task?.id) return;
    setLoadingSubscribers(true);
    try {
      const response = await apiService.getTaskSubscribers(String(task.id));
      if (response.success && response.data) {
        const arr = Array.isArray(response.data)
          ? response.data
          : (response.data.results || []);
        setSubscribers(arr);
      } else {
        setSubscribers([]);
      }
    } catch (error) {
      console.error("Failed to load subscribers:", error);
      setSubscribers([]);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // P-4: load the real activity feed (TaskHistory rows from V-1)
  const loadHistory = async () => {
    if (!task?.id) return;
    setLoadingHistory(true);
    try {
      const response = await apiService.getTaskHistory(task.id);
      if (response.success && response.data) {
        const arr = Array.isArray(response.data)
          ? response.data
          : (response.data.results || []);
        setHistory(arr);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Failed to load task history:", error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // A-1 follow-up: load time-per-user breakdown
  const loadTimePerUser = async () => {
    if (!task?.id) return;
    setLoadingTimePerUser(true);
    try {
      const response = await apiService.getTaskTimePerUser(task.id);
      if (response.success && response.data) {
        setTimePerUser(response.data);
      } else {
        setTimePerUser(null);
      }
    } catch (error) {
      console.error("Failed to load time-per-user:", error);
      setTimePerUser(null);
    } finally {
      setLoadingTimePerUser(false);
    }
  };

  // Reload comments + subscribers + history when task changes
  useEffect(() => {
    if (task?.id) {
      loadComments();
      loadSubscribers();
      loadHistory();
      loadTimePerUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  // P-4: refresh history every 30s so status changes by other agents
  // show up without a page reload. v2 would be websockets.
  useEffect(() => {
    if (!task?.id) return;
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  // Reload history after posting a comment or saving an edit, so the
  // sidebar reflects the new row immediately.
  useEffect(() => {
    if (task?.id) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length, subscribers.length]);

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

  const addComment = async () => {
    if (!newComment.trim() || !task?.id) return;
    setPostingComment(true);
    try {
      const response = await apiService.createComment({
        content_type: "task",
        object_id: String(task.id),
        content: newComment.trim(),
      });
      if (response.success) {
        setNewComment("");
        // Backend will auto-subscribe the author and any mentioned users.
        // Reload the comments list, subscribers list, and history.
        await loadComments();
        await loadSubscribers();
        await loadHistory();
        toast.success("Comment posted");
      } else {
        toast.error(response.message || "Failed to post comment");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const toggleSubscribe = async () => {
    if (!task?.id) return;
    if (isCurrentUserSubscribed) {
      const sub = subscribers.find(
        (s) => String(s.user?.id) === currentUserId,
      );
      if (sub) {
        const response = await apiService.unsubscribeFromTask(sub.id);
        if (response.success) {
          setSubscribers(subscribers.filter((s) => s.id !== sub.id));
        } else {
          toast.error(response.message || "Failed to unsubscribe");
        }
      }
    } else {
      const response = await apiService.subscribeToTask(String(task.id));
      if (response.success && response.data) {
        setSubscribers([...subscribers, response.data]);
      } else {
        toast.error(response.message || "Failed to subscribe");
      }
    }
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
                  <PopoverContent className="w-72 p-3 bg-dashboard-surface border-dashboard-border">
                    <div className="space-y-2">
                      <h4 className="font-medium text-white mb-2">
                        Assign to:
                      </h4>
                      <Input
                        type="email"
                        placeholder="Search by name or email…"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="h-8 text-sm bg-dashboard-bg border-dashboard-border text-white"
                      />
                      <div className="space-y-1 max-h-48 overflow-y-auto mt-1">
                        {(() => {
                          const q = assigneeSearch.trim().toLowerCase();
                          const filteredUsers = q
                            ? users.filter(
                                (u) =>
                                  (u.name || "").toLowerCase().includes(q) ||
                                  (u.email || "").toLowerCase().includes(q),
                              )
                            : users;
                          if (filteredUsers.length === 0 && !q) {
                            return (
                              <div className="text-xs text-gray-500 px-2 py-3 text-center">
                                No users in this workspace yet.
                              </div>
                            );
                          }
                          return (
                            <>
                              {filteredUsers.map((user) => {
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
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm text-gray-300 truncate">
                                        {user.name}
                                      </span>
                                      <span className="text-[10px] text-gray-500 truncate">
                                        {user.email}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {/* A-1: "Invite <email>" row when the search doesn't
                                  match any existing user. */}
                              {q && q.includes("@") && !users.some(
                                (u) => (u.email || "").toLowerCase() === q,
                              ) && (
                                <div
                                  className="flex items-center gap-2 p-2 rounded hover:bg-dashboard-bg transition-colors cursor-pointer border-t border-dashboard-border mt-1 pt-2"
                                  onClick={async () => {
                                    if (!task?.projectId && !task?.project) {
                                      toast.error("Task has no project — can't invite.");
                                      return;
                                    }
                                    const projectId = task.projectId ?? task.project;
                                    setInviting(true);
                                    try {
                                      const res = await apiService.inviteUserToProject(
                                        projectId,
                                        assigneeSearch.trim(),
                                        "member",
                                      );
                                      if (res.success) {
                                        const inv = res.data?.invitation || res.data;
                                        const token = inv?.token;
                                        const inviteUrl = token
                                          ? `${window.location.origin}/invite/${token}`
                                          : null;
                                        if (inviteUrl) {
                                          try {
                                            await navigator.clipboard.writeText(inviteUrl);
                                            toast.success(
                                              `Invitation created. Link copied to clipboard — share it with ${assigneeSearch.trim()}.`,
                                              { duration: 8000 },
                                            );
                                          } catch {
                                            toast.success(
                                              `Invitation created. Share this link: ${inviteUrl}`,
                                              { duration: 12000 },
                                            );
                                          }
                                        } else {
                                          toast.success(`Invitation created for ${assigneeSearch.trim()}.`);
                                        }
                                        setAssigneeSearch("");
                                        setShowAssigneePopover(false);
                                      } else {
                                        toast.error(res.message || "Failed to create invitation");
                                      }
                                    } catch (err: any) {
                                      toast.error(err?.message || "Failed to create invitation");
                                    } finally {
                                      setInviting(false);
                                    }
                                  }}
                                >
                                  <UserPlus className="w-4 h-4 text-accent shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm text-accent truncate">
                                      Invite "{assigneeSearch.trim()}"
                                    </span>
                                    <span className="text-[10px] text-gray-500 truncate">
                                      Sends a signup link (OpenProject pattern)
                                    </span>
                                  </div>
                                  {inviting && (
                                    <Loader2 className="w-3 h-3 animate-spin text-gray-400 ml-auto" />
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
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

        {/* Activity Sidebar — P-4: real feed from TaskHistory (V-1) */}
        <div className="w-80 border-l border-dashboard-border bg-dashboard-surface/30 flex flex-col">
          <div className="p-4 border-b border-dashboard-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white flex items-center gap-2">
                Activity
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                  {history.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadHistory}
                  className="w-6 h-6 p-0 text-gray-400"
                  title="Refresh"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Watchers / Subscribers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Eye className="w-3 h-3" />
                  Watchers ({subscribers.length})
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleSubscribe}
                  className={
                    "h-6 px-2 text-xs " +
                    (isCurrentUserSubscribed
                      ? "text-accent hover:text-accent/80"
                      : "text-gray-400 hover:text-white")
                  }
                >
                  {isCurrentUserSubscribed ? "Unwatch" : "Watch"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {loadingSubscribers ? (
                  <span className="text-xs text-gray-500">Loading…</span>
                ) : subscribers.length === 0 ? (
                  <span className="text-xs text-gray-500">No watchers yet</span>
                ) : (
                  subscribers.map((s) => {
                    const u = s.user;
                    const initials = (u?.name || u?.email || "?")
                      .split(/\s+/)
                      .map((p: string) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "?";
                    return (
                      <div
                        key={s.id}
                        title={`${u?.name || u?.email}${u?.email ? ` <${u.email}>` : ""}`}
                        className="flex items-center gap-1.5 bg-dashboard-bg rounded-full pl-1 pr-2 py-0.5"
                      >
                        <Avatar className="w-5 h-5">
                          {u?.photo_url ? (
                            <img
                              src={u.photo_url}
                              alt={u?.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <AvatarFallback className="text-[10px] bg-accent/30 text-white">
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-xs text-gray-300 truncate max-w-[120px]">
                          {u?.name || u?.email}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Separator className="bg-dashboard-border" />

            {/* P-4: Real activity feed from TaskHistory (V-1 endpoint).
                Replaces the hardcoded "Sagar Mantry created this task" mock. */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Activity className="w-3 h-3" />
                Activity ({history.length})
              </h4>
              {loadingHistory ? (
                <div className="text-xs text-gray-500">Loading activity…</div>
              ) : history.length === 0 ? (
                <div className="text-xs text-gray-500">
                  No activity yet. Changes you make (status, priority, assignees)
                  will appear here.
                </div>
              ) : (
                history.map((h) => {
                  const actor = h.actor;
                  const initials = (actor?.name || actor?.email || "?")
                    .split(/\s+/)
                    .map((p: string) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "?";
                  const summary = renderHistorySummary(h);
                  return (
                    <div key={h.id} className="flex items-start gap-2">
                      <Avatar className="w-6 h-6 shrink-0">
                        {actor?.photo_url ? (
                          <img
                            src={actor.photo_url}
                            alt={actor?.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <AvatarFallback className="text-[10px] bg-accent/30 text-white">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400">
                          <span className="text-white font-medium">
                            {actor?.name || actor?.email || "Someone"}
                          </span>{" "}
                          <span className="text-gray-500">·</span>{" "}
                          {new Date(h.created_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-300 mt-0.5 break-words">
                          {summary}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Separator className="bg-dashboard-border" />

            {/* A-1 follow-up: time spent, broken down by user.
                Admin can see who worked how long on this task and how
                long it took from open to close (if completed). */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Timer className="w-3 h-3" />
                Time spent
                {timePerUser && timePerUser.total_seconds > 0 && (
                  <span className="text-gray-400 normal-case font-normal">
                    ({formatDuration(timePerUser.total_seconds)})
                  </span>
                )}
              </h4>
              {loadingTimePerUser ? (
                <div className="text-xs text-gray-500">Loading time…</div>
              ) : !timePerUser || timePerUser.by_user.length === 0 ? (
                <div className="text-xs text-gray-500">
                  No time logged yet. Start a timer to track time on this task.
                </div>
              ) : (
                <>
                  {/* Per-user breakdown */}
                  <div className="space-y-1.5">
                    {timePerUser.by_user.map((row) => {
                      const initials = (row.user.name || row.user.email || "?")
                        .split(/\s+/)
                        .map((p: string) => p[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "?";
                      const pct = timePerUser.total_seconds > 0
                        ? Math.round((row.total_seconds / timePerUser.total_seconds) * 100)
                        : 0;
                      return (
                        <div key={row.user.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="w-5 h-5 shrink-0">
                                <AvatarFallback className="text-[10px] bg-accent/30 text-white">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white truncate">
                                {row.user.name || row.user.email}
                              </span>
                              <span className="text-gray-500">
                                · {row.session_count}× session{row.session_count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <span className="text-gray-300 font-mono shrink-0">
                              {formatDuration(row.total_seconds)}
                            </span>
                          </div>
                          {/* Bar showing share of total time */}
                          <div className="h-1 bg-dashboard-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* If task is completed, show how long it took to close */}
                  {timePerUser.completed_in_seconds !== null && (
                    <div className="mt-3 pt-3 border-t border-dashboard-border text-xs text-gray-400">
                      <span className="text-gray-500">Time to close:</span>{" "}
                      <span className="text-white font-mono">
                        {formatDuration(timePerUser.completed_in_seconds)}
                      </span>
                      <span className="text-gray-500"> (created → completed)</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator className="bg-dashboard-border" />

            {/* Comments / Activity */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-gray-500">
                Comments ({comments.length})
              </h4>
              {loadingComments ? (
                <div className="text-xs text-gray-500">Loading comments…</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-gray-500">
                  No comments yet. Be the first to add one below.
                </div>
              ) : (
                comments.map((c) => {
                  const author = c.author;
                  const initials = (author?.name || author?.email || "?")
                    .split(/\s+/)
                    .map((p: string) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "?";
                  return (
                    <div key={c.id} className="flex items-start gap-3">
                      <Avatar className="w-6 h-6 shrink-0">
                        {author?.photo_url ? (
                          <img
                            src={author.photo_url}
                            alt={author?.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <AvatarFallback className="text-xs bg-accent/30 text-white">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">
                          <span className="text-white font-medium">
                            {author?.name || author?.email || "Unknown"}
                          </span>{" "}
                          · {new Date(c.created_at).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-300 break-words">
                          <MentionText text={c.content || ""} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4 border-t border-dashboard-border space-y-2">
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              placeholder="Write a comment... use @ to mention a teammate"
              rows={3}
              className="text-sm"
              disabled={postingComment}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addComment();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500">
                <kbd className="px-1 bg-dashboard-bg border border-dashboard-border rounded">Enter</kbd>{" "}
                to post · <kbd className="px-1 bg-dashboard-bg border border-dashboard-border rounded">Shift+Enter</kbd>{" "}
                for new line
              </p>
              <Button
                onClick={addComment}
                disabled={!newComment.trim() || postingComment}
                size="sm"
                className="bg-accent text-black hover:bg-accent/90 disabled:opacity-50 h-7 px-3"
              >
                {postingComment ? "Posting…" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
