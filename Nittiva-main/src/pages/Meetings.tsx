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
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  MoreHorizontal,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface Meeting {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  participants: string[];
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export default function Meetings() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    meeting_url: "",
    participants: [] as string[],
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchMeetings();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMeetings();
      if (response.success && response.data) {
        setMeetings(response.data);
      } else {
        toast.error(response.message || "Failed to load meetings");
      }
    } catch (error) {
      toast.error("Failed to load meetings");
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeeting = async () => {
    if (!newMeeting.title || !newMeeting.start_time || !newMeeting.end_time) {
      toast.error("Title, start time, and end time are required");
      return;
    }

    try {
      const response = await apiService.createMeeting(newMeeting);
      if (response.success) {
        toast.success("Meeting created successfully");
        fetchMeetings();
        setNewMeeting({
          title: "",
          description: "",
          start_time: "",
          end_time: "",
          location: "",
          meeting_url: "",
          participants: [],
        });
        setShowAddDialog(false);
      } else {
        toast.error(response.message || "Failed to create meeting");
      }
    } catch (error) {
      toast.error("Failed to create meeting");
      console.error("Error creating meeting:", error);
    }
  };

  const handleEditMeeting = async () => {
    if (!editingMeeting) return;

    try {
      const response = await apiService.updateMeeting(
        editingMeeting.id,
        editingMeeting,
      );
      if (response.success) {
        toast.success("Meeting updated successfully");
        fetchMeetings();
        setEditingMeeting(null);
      } else {
        toast.error(response.message || "Failed to update meeting");
      }
    } catch (error) {
      toast.error("Failed to update meeting");
      console.error("Error updating meeting:", error);
    }
  };

  const handleDeleteMeeting = async (id: number) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      const response = await apiService.deleteMeeting(id);
      if (response.success) {
        toast.success("Meeting deleted successfully");
        fetchMeetings();
      } else {
        toast.error(response.message || "Failed to delete meeting");
      }
    } catch (error) {
      toast.error("Failed to delete meeting");
      console.error("Error deleting meeting:", error);
    }
  };

  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.description &&
        meeting.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-400";
      case "ongoing":
        return "bg-green-500/20 text-green-400";
      case "completed":
        return "bg-gray-500/20 text-gray-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const stats = {
    total: meetings.length,
    upcoming: meetings.filter((m) => isUpcoming(m.start_time)).length,
    today: meetings.filter((m) => {
      const today = new Date();
      const meetingDate = new Date(m.start_time);
      return meetingDate.toDateString() === today.toDateString();
    }).length,
    completed: meetings.filter((m) => m.status === "completed").length,
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
                placeholder="Search meetings..."
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
            <h1 className="text-2xl font-normal text-white mb-1">Meetings</h1>
            <p className="text-gray-400 text-sm">
              Schedule and manage your meetings
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-black hover:bg-accent/80">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Schedule New Meeting
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Title *</Label>
                  <Input
                    value={newMeeting.title}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, title: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Meeting title"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Description</Label>
                  <Textarea
                    value={newMeeting.description}
                    onChange={(e) =>
                      setNewMeeting({
                        ...newMeeting,
                        description: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                    placeholder="Meeting description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-400">
                      Start Time *
                    </Label>
                    <Input
                      type="datetime-local"
                      value={newMeeting.start_time}
                      onChange={(e) =>
                        setNewMeeting({
                          ...newMeeting,
                          start_time: e.target.value,
                        })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">End Time *</Label>
                    <Input
                      type="datetime-local"
                      value={newMeeting.end_time}
                      onChange={(e) =>
                        setNewMeeting({
                          ...newMeeting,
                          end_time: e.target.value,
                        })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Location</Label>
                  <Input
                    value={newMeeting.location}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, location: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Meeting location or room"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Meeting URL</Label>
                  <Input
                    value={newMeeting.meeting_url}
                    onChange={(e) =>
                      setNewMeeting({
                        ...newMeeting,
                        meeting_url: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Zoom, Teams, or other meeting link"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddMeeting}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Schedule Meeting
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Meetings",
              value: stats.total,
              color: "blue",
              icon: Calendar,
            },
            {
              label: "Upcoming",
              value: stats.upcoming,
              color: "green",
              icon: Clock,
            },
            {
              label: "Today",
              value: stats.today,
              color: "yellow",
              icon: Calendar,
            },
            {
              label: "Completed",
              value: stats.completed,
              color: "gray",
              icon: Calendar,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              className="bg-card border border-dashboard-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${stat.color}-500/20 rounded-lg`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-xl font-medium text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Meetings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-card border border-dashboard-border rounded-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading meetings...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dashboard-border bg-dashboard-surface">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Meeting
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashboard-border">
                  {filteredMeetings.map((meeting, index) => {
                    const duration = Math.round(
                      (new Date(meeting.end_time).getTime() -
                        new Date(meeting.start_time).getTime()) /
                        (1000 * 60),
                    );
                    return (
                      <motion.tr
                        key={meeting.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="hover:bg-dashboard-surface/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                              {meeting.meeting_url ? (
                                <Video className="w-5 h-5 text-accent" />
                              ) : (
                                <Calendar className="w-5 h-5 text-accent" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {meeting.title}
                              </div>
                              {meeting.description && (
                                <div className="text-xs text-gray-400 max-w-xs truncate">
                                  {meeting.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-300">
                              {formatDateTime(meeting.start_time)}
                            </div>
                            {meeting.location && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" />
                                {meeting.location}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-300">
                            {duration} min
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">
                              {meeting.participants.length}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            className={`${getStatusColor(meeting.status)} border-0 capitalize`}
                          >
                            {meeting.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
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
                              {meeting.meeting_url && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(meeting.meeting_url, "_blank")
                                  }
                                  className="text-gray-300 hover:text-white hover:bg-dashboard-bg"
                                >
                                  <Video className="w-4 h-4 mr-2" />
                                  Join Meeting
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setEditingMeeting(meeting)}
                                className="text-gray-300 hover:text-white hover:bg-dashboard-bg"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteMeeting(meeting.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingMeeting}
          onOpenChange={() => setEditingMeeting(null)}
        >
          <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Meeting</DialogTitle>
            </DialogHeader>
            {editingMeeting && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Title *</Label>
                  <Input
                    value={editingMeeting.title}
                    onChange={(e) =>
                      setEditingMeeting({
                        ...editingMeeting,
                        title: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Description</Label>
                  <Textarea
                    value={editingMeeting.description || ""}
                    onChange={(e) =>
                      setEditingMeeting({
                        ...editingMeeting,
                        description: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-400">
                      Start Time *
                    </Label>
                    <Input
                      type="datetime-local"
                      value={editingMeeting.start_time}
                      onChange={(e) =>
                        setEditingMeeting({
                          ...editingMeeting,
                          start_time: e.target.value,
                        })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">End Time *</Label>
                    <Input
                      type="datetime-local"
                      value={editingMeeting.end_time}
                      onChange={(e) =>
                        setEditingMeeting({
                          ...editingMeeting,
                          end_time: e.target.value,
                        })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Location</Label>
                  <Input
                    value={editingMeeting.location || ""}
                    onChange={(e) =>
                      setEditingMeeting({
                        ...editingMeeting,
                        location: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Meeting URL</Label>
                  <Input
                    value={editingMeeting.meeting_url || ""}
                    onChange={(e) =>
                      setEditingMeeting({
                        ...editingMeeting,
                        meeting_url: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEditMeeting}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Update Meeting
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingMeeting(null)}
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
