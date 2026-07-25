import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

export default function AgentTimeLogDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TimeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentInfo, setAgentInfo] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchAgentTimeLogs = async () => {
      if (!agentId) {
        console.error("No agentId provided");
        toast.error("Agent ID is missing");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log("🔄 Fetching time logs for agent:", agentId);
        const response = await apiService.getTimeLogs({ user: parseInt(agentId) });
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
          
          // Get agent info from first entry if available
          if (dataArray.length > 0 && (dataArray[0] as any).user) {
            const user = (dataArray[0] as any).user;
            console.log("👤 Agent info:", user);
            setAgentInfo({
              name: user.name || user.email,
              email: user.email,
            });
          } else if (dataArray.length === 0) {
            console.warn("⚠️ No time logs found for agent");
            // Try to fetch agent info separately if no entries
            try {
              const userResponse = await apiService.getUser(parseInt(agentId));
              if (userResponse.success && userResponse.data) {
                const user = userResponse.data;
                setAgentInfo({
                  name: user.name || user.email || `Agent ${agentId}`,
                  email: user.email || "",
                });
              } else {
                // Fallback placeholder
                setAgentInfo({
                  name: `Agent ${agentId}`,
                  email: "",
                });
              }
            } catch (err) {
              console.error("Failed to fetch agent info:", err);
              // Fallback placeholder
              setAgentInfo({
                name: `Agent ${agentId}`,
                email: "",
              });
            }
          }
        } else {
          console.error("❌ API Error:", response.message);
          toast.error(response.message || "Failed to load agent time logs");
        }
      } catch (error: any) {
        console.error("❌ Error fetching agent time logs:", error);
        toast.error(`Failed to load agent time logs: ${error.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentTimeLogs();
  }, [agentId]);

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

  // Ensure entries is always an array
  const entriesArray = Array.isArray(entries) ? entries : [];
  
  const totalTime = entriesArray.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
  
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/progress")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-normal text-white">
              {agentInfo ? `${agentInfo.name}'s Time Logs` : "Agent Time Logs"}
            </h1>
            {agentInfo && (
              <p className="text-gray-400 text-sm mt-1">{agentInfo.email}</p>
            )}
          </div>
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
                  {new Set(entriesArray.map(e => e.description || "General Work")).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                No time entries found for this agent.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
