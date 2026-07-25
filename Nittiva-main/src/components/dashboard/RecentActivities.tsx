import { motion } from "framer-motion";
import { Activity, Clock, User, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  timeAgo: string;
  type: "start" | "stop" | "create" | "update";
  avatar: string;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

const getActionIcon = (type: string) => {
  switch (type) {
    case "start":
      return <Play className="w-3 h-3 text-accent" />;
    case "stop":
      return <Square className="w-3 h-3 text-red-400" />;
    case "create":
      return <User className="w-3 h-3 text-blue-400" />;
    default:
      return <Clock className="w-3 h-3 text-gray-400" />;
  }
};

export default function RecentActivities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // Fetch recent time logs as activities
        const response = await apiService.getTimeLogs({});
        if (response.success && response.data) {
          const timeLogs = Array.isArray(response.data) ? response.data : (response.data as any)?.results || [];
          const recentLogs = timeLogs.slice(0, 10).map((log: any, index: number) => {
            const userName = log.user?.name || log.user?.email || "Unknown";
            const initials = userName.substring(0, 2).toUpperCase();
            const action = log.ended_at ? "stopped time tracker" : "started time tracker";
            const time = log.started_at || log.created_at;
            
            return {
              id: String(log.id || index),
              user: userName,
              action,
              target: log.task?.title || "",
              time: new Date(time).toLocaleString(),
              timeAgo: formatTimeAgo(time),
              type: log.ended_at ? "stop" : "start" as const,
              avatar: initials,
            };
          });
          setActivities(recentLogs);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-card border border-dashboard-border rounded-lg h-full flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
        <h3 className="text-lg font-normal text-white">Recent Activities</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <Activity className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No recent activities
          </div>
        ) : (
          activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 bg-dashboard-surface rounded-lg border border-dashboard-border hover:border-accent/20 transition-colors"
          >
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-xs font-medium text-black flex-shrink-0">
              {activity.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getActionIcon(activity.type)}
                <span className="text-sm text-white">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-gray-300">{activity.action}</span>
                  {activity.target && (
                    <span className="text-accent ml-1">{activity.target}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{activity.time}</span>
                <span className="text-xs text-gray-500">
                  {activity.timeAgo}
                </span>
              </div>
            </div>
          </motion.div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-dashboard-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-white"
        >
          View all activities
        </Button>
      </div>
    </motion.div>
  );
}
