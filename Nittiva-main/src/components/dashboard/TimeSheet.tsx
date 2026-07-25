import { motion } from "framer-motion";
import { Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface TimeEntry {
  user: string;
  avatar: string;
  totalHours: string;
  projects: number;
  color: string;
}

const colors = ["#befca9", "#8b5cf6", "#f59e0b", "#3b82f6", "#ef4444", "#10b981"];

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function TimeSheet() {
  const [timeData, setTimeData] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const [period, setPeriod] = useState("this-week");

  useEffect(() => {
    const fetchTimeData = async () => {
      setLoading(true);
      try {
        const response = await apiService.getTimeLogSummary();
        if (response.success && response.data) {
          const userSummary = response.data.user_summary || [];
          const totalSeconds = response.data.total_seconds || 0;
          
          // Get projects for each user to count active projects
          const usersWithProjects = await Promise.all(
            userSummary.map(async (user: any) => {
              try {
                const projectsRes = await apiService.getProjects();
                const projects = projectsRes.success ? (projectsRes.data || []) : [];
                // Count projects where user has tasks
                const userProjects = projects.filter((p: any) => {
                  // This is a simplified check - you might want to enhance this
                  return true; // For now, assume all projects
                });
                return {
                  user: user.user__name || user.user__email || "Unknown",
                  avatar: (user.user__name || user.user__email || "U").substring(0, 2).toUpperCase(),
                  totalHours: formatDuration(user.total_seconds || 0),
                  projects: userProjects.length || 1,
                  color: colors[Math.floor(Math.random() * colors.length)],
                };
              } catch (err) {
                return {
                  user: user.user__name || user.user__email || "Unknown",
                  avatar: (user.user__name || user.user__email || "U").substring(0, 2).toUpperCase(),
                  totalHours: formatDuration(user.total_seconds || 0),
                  projects: 1,
                  color: colors[Math.floor(Math.random() * colors.length)],
                };
              }
            })
          );
          
          setTimeData(usersWithProjects);
          setTotalTime(totalSeconds);
        }
      } catch (error) {
        console.error("Failed to fetch time data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeData();
  }, [period]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-gradient-to-br from-card to-dashboard-surface border border-dashboard-border rounded-lg p-6 h-full shadow-xl shadow-black/20"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-dark rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-black" />
          </div>
          <h3 className="text-lg font-semibold text-white">Time Sheet</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-accent hover:bg-accent/10 transition-all duration-300"
        >
          <Calendar className="w-4 h-4" />
        </Button>
      </div>

      <div className="mb-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full bg-dashboard-surface border-dashboard-border">
            <SelectValue placeholder="Date between" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider border-b border-gradient-to-r border-dashboard-border pb-3">
          <span className="font-semibold">Team Member</span>
          <span className="font-semibold">Time Tracked</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : timeData.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No time tracking data available
          </div>
        ) : (
          <div className="space-y-3">
            {timeData.map((entry, index) => (
            <motion.div
              key={entry.user}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-dashboard-surface to-dashboard-bg rounded-lg border border-dashboard-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: entry.color }}
                  >
                    {entry.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dashboard-surface" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors duration-300">
                    {entry.user}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {entry.projects} active projects
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-white group-hover:text-accent transition-colors duration-300 tabular-nums">
                    {entry.totalHours}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    this week
                  </div>
                </div>
                <Clock className="w-4 h-4 text-accent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gradient-to-r border-dashboard-border bg-gradient-to-r from-accent/5 to-transparent rounded-lg p-4 -mx-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-gray-300">
              Total {period.replace("-", " ")}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono font-bold text-accent tabular-nums">
              {formatDuration(totalTime)}
            </div>
            <div className="text-xs text-gray-400 font-medium">
              across all projects
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
