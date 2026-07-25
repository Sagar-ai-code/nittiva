import { motion } from "framer-motion";
import { Users, MessageCircle, Calendar, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: string;
  tasksCount: number;
  profile_image_url?: string;
}

interface Notification {
  id: string;
  type: "message" | "task" | "meeting";
  title: string;
  time: string;
  unread: boolean;
}

// Generate avatar initials from name or email
const getAvatarInitials = (name: string, email: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

// Generate color from user ID for consistent colors
const getAvatarColor = (id: number): string => {
  const colors = [
    "#befca9",
    "#8b5cf6",
    "#f59e0b",
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f97316",
    "#6366f1",
  ];
  return colors[id % colors.length];
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "New message from John Doe",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "2",
    type: "task",
    title: "Task deadline approaching",
    time: "15 min ago",
    unread: true,
  },
  {
    id: "3",
    type: "meeting",
    title: "Team standup in 30 min",
    time: "30 min ago",
    unread: false,
  },
];

interface TeamOverviewProps {
  teamMembers?: TeamMember[];
  loading?: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "message":
      return <MessageCircle className="w-4 h-4 text-blue-400" />;
    case "task":
      return <Calendar className="w-4 h-4 text-orange-400" />;
    case "meeting":
      return <Users className="w-4 h-4 text-green-400" />;
    default:
      return <Mail className="w-4 h-4 text-gray-400" />;
  }
};

export default function TeamOverview({ teamMembers = [], loading = false }: TeamOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-card border border-dashboard-border rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-normal text-white">Team Members</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <Users className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No team members available</div>
          ) : (
            teamMembers.map((member, index) => {
              const avatar = getAvatarInitials(member.name, member.email);
              const color = getAvatarColor(member.id);
              return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-dashboard-surface rounded-lg border border-dashboard-border hover:border-accent/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {member.profile_image_url ? (
                    <img
                      src={member.profile_image_url}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-black"
                      style={{ backgroundColor: color }}
                    >
                      {avatar}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {member.name || member.email.split("@")[0]}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {member.role || "Member"}
                  </div>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-gray-600 text-white text-xs"
              >
                {member.tasksCount} tasks
              </Badge>
            </motion.div>
            );
          })
          )}
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-card border border-dashboard-border rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-normal text-white">Notifications</h3>
            <Badge
              variant="secondary"
              className="bg-red-500 text-white text-xs"
            >
              {mockNotifications.filter((n) => n.unread).length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <Mail className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {mockNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                notification.unread
                  ? "bg-accent/5 border-accent/20"
                  : "bg-dashboard-surface border-dashboard-border"
              } hover:border-accent/20`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white mb-1">
                  {notification.title}
                </div>
                <div className="text-xs text-gray-400">{notification.time}</div>
              </div>
              {notification.unread && (
                <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-dashboard-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-400 hover:text-white"
          >
            Mark all as read
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
