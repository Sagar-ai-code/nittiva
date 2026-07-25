import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ManagerAgentListView from "@/components/dashboard/ManagerAgentListView";

interface TimeLogEntry {
  id: string;
  task?: { id: number; title: string } | null;
  description?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  duration_formatted: string;
  is_manual: boolean;
}

export default function Progress() {
  const { user } = useAuth();
  const isManager = (user as any)?.role === "manager";
  const isAgent = (user as any)?.role === "agent";
  
  // Agent-specific state
  const [entries, setEntries] = useState<TimeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch data if user is an agent
    if (isAgent && user?.id) {
      const fetchMyTimeLogs = async () => {
        setLoading(true);
        try {
          console.log("🔄 Fetching my time logs for agent:", user.id);
          const response = await apiService.getTimeLogs({ user: parseInt(user.id.toString()) });
          console.log("📦 API Response:", response);
          
          if (response.success && response.data) {
            console.log("✅ Time logs data:", response.data);
            // Handle paginated response (has 'results' property) or direct array
            let dataArray: any[] = [];
            if (Array.isArray(response.data)) {
              dataArray = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              // Paginated response format: {count, next, previous, results: [...]}
              dataArray = response.data.results;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              // Nested data format
              dataArray = response.data.data;
            }
            console.log("📝 Processed data array:", dataArray);
            setEntries(dataArray as TimeLogEntry[]);
          } else {
            console.error("❌ API Error:", response.message);
            toast.error(response.message || "Failed to load time logs");
          }
        } catch (error: any) {
          console.error("❌ Error fetching time logs:", error);
          toast.error(`Failed to load time logs: ${error.message || "Unknown error"}`);
        } finally {
          setLoading(false);
        }
      };

      fetchMyTimeLogs();
    } else if (!isManager && !isAgent) {
      setLoading(false);
    }
  }, [isAgent, isManager, user?.id]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // If manager, show manager view
  if (isManager) {
    return <ManagerAgentListView />;
  }

  // If agent, show their own progress
  if (isAgent) {
    // Ensure entries is always an array
    const entriesArray = Array.isArray(entries) ? entries : [];
    
    const totalTime = entriesArray.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
    
    // Group entries by activity type (description)
    const activityGroups = entriesArray.reduce((acc, entry) => {
      const activity = entry.description || "General Work";
      if (!acc[activity]) {
        acc[activity] = { totalSeconds: 0, count: 0 };
      }
      acc[activity].totalSeconds += entry.duration_seconds || 0;
      acc[activity].count += 1;
      return acc;
    }, {} as Record<string, { totalSeconds: number; count: number }>);

    // Sort entries by most recent first
    const sortedEntries = [...entriesArray].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    return (
      <div className="min-h-screen bg-dashboard-bg p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-normal text-white">My Progress</h1>
            <p className="text-gray-400 text-sm mt-1">Track your time and activities</p>
          </div>

          {/* Summary Card */}
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Time</p>
                  <p className="text-2xl font-semibold text-white">
                    {formatDuration(totalTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Entries</p>
                  <p className="text-2xl font-semibold text-white">
                    {entriesArray.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Activities</p>
                  <p className="text-2xl font-semibold text-white">
                    {Object.keys(activityGroups).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Breakdown */}
          {Object.keys(activityGroups).length > 0 && (
            <Card className="bg-dashboard-surface border-dashboard-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Activity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(activityGroups)
                    .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
                    .map(([activity, data]) => (
                      <div
                        key={activity}
                        className="flex items-center justify-between p-3 bg-dashboard-bg rounded-lg border border-dashboard-border"
                      >
                        <div>
                          <p className="text-sm text-white font-medium">{activity}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {data.count} {data.count === 1 ? "entry" : "entries"}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-accent text-accent">
                          {formatDuration(data.totalSeconds)}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Entries */}
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Recent Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : sortedEntries.length > 0 ? (
                <div className="space-y-2">
                  {sortedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-dashboard-bg rounded-lg border border-dashboard-border"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                          {entry.description || "General Work"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(entry.started_at).toLocaleString()}
                          {entry.ended_at && (
                            <> - {new Date(entry.ended_at).toLocaleString()}</>
                          )}
                        </p>
                        {entry.task && (
                          <p className="text-xs text-gray-500 mt-1">
                            Task: {entry.task.title}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-accent text-accent">
                        {entry.duration_formatted || formatDuration(entry.duration_seconds)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No time entries yet. Start tracking your time to see your progress here.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // For other roles, show access denied
  return (
    <div className="h-full bg-dashboard-bg flex items-center justify-center">
      <p className="text-white text-lg">This page is only available for agents and managers.</p>
    </div>
  );
}
