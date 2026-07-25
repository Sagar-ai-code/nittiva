import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Bell,
  Globe,
  User as UserIcon,
  Check,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  data?: any;
  created_at: string;
  updated_at: string;
}

export default function Notifications() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchNotifications();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      } else {
        toast.error(response.message || "Failed to load notifications");
      }
    } catch (error) {
      toast.error("Failed to load notifications");
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await apiService.markNotificationAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, is_read: true } : notif,
          ),
        );
        toast.success("Notification marked as read");
      } else {
        toast.error(response.message || "Failed to mark as read");
      }
    } catch (error) {
      toast.error("Failed to mark as read");
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);

    try {
      for (const notification of unreadNotifications) {
        await apiService.markNotificationAsRead(notification.id);
      }

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true })),
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const response = await apiService.deleteNotification(id);
      if (response.success) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        toast.success("Notification deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete notification");
      }
    } catch (error) {
      toast.error("Failed to delete notification");
      console.error("Error deleting notification:", error);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === "all" || notification.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "read" && notification.is_read) ||
      (statusFilter === "unread" && !notification.is_read);
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/20 text-green-400";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400";
      case "error":
        return "bg-red-500/20 text-red-400";
      case "info":
      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.is_read).length,
    today: notifications.filter((n) => {
      const today = new Date();
      const notifDate = new Date(n.created_at);
      return notifDate.toDateString() === today.toDateString();
    }).length,
    this_week: notifications.filter((n) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(n.created_at) > weekAgo;
    }).length,
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
                placeholder="Search notifications..."
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
            <h1 className="text-2xl font-normal text-white mb-1">
              Notifications
            </h1>
            <p className="text-gray-400 text-sm">
              Stay updated with your latest activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="border-dashboard-border text-gray-400 hover:text-white"
              disabled={stats.unread === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "blue", icon: Bell },
            {
              label: "Unread",
              value: stats.unread,
              color: "red",
              icon: EyeOff,
            },
            {
              label: "Today",
              value: stats.today,
              color: "green",
              icon: Calendar,
            },
            {
              label: "This Week",
              value: stats.this_week,
              color: "purple",
              icon: Clock,
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

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-3"
        >
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                ? "No notifications found matching your filters"
                : "No notifications yet"}
            </div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-card border border-dashboard-border rounded-lg p-4 hover:bg-dashboard-surface/50 transition-colors ${
                  !notification.is_read ? "border-l-4 border-l-accent" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`text-sm font-medium ${
                              !notification.is_read
                                ? "text-white"
                                : "text-gray-300"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                          )}
                        </div>

                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${getTypeColor(notification.type)} border-0 text-xs capitalize`}
                          >
                            {notification.type}
                          </Badge>

                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
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
                          {!notification.is_read && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-gray-300 hover:text-white hover:bg-dashboard-bg"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteNotification(notification.id)
                            }
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
      </div>
    </div>
  );
}
