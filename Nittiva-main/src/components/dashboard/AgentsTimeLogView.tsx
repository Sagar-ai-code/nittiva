import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, User, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AgentTimeData {
  agent_id: number;
  agent_name: string;
  agent_email: string;
  total_seconds: number;
  total_hours: number;
  entry_count: number;
  recent_entries: Array<{
    id: string;
    description: string;
    duration_seconds: number;
    duration_formatted: string;
    started_at: string;
    task?: { id: number; title: string } | null;
  }>;
}

interface AgentsSummaryData {
  total_seconds: number;
  total_hours: number;
  total_entries: number;
  agents: AgentTimeData[];
}

export default function AgentsTimeLogView() {
  const [data, setData] = useState<AgentsSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAgentsSummary = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      console.log("🔄 Fetching agents summary with params:", params);
      const response = await apiService.getAgentsSummary(params);
      console.log("📦 Agents summary response:", response);
      if (response.success && response.data) {
        console.log("✅ Agents summary data:", response.data);
        setData(response.data);
      } else {
        console.warn("⚠️ Failed to load agents data:", response.message);
        toast.error(response.message || "Failed to load agents data");
      }
    } catch (error: any) {
      console.error("❌ Error fetching agents summary:", error);
      toast.error("Failed to load agents time logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsSummary();
  }, [startDate, endDate]);

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

  return (
    <div className="space-y-6">
      <Card className="bg-dashboard-surface border-dashboard-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Agents Time Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-dashboard-bg border-dashboard-border text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-dashboard-bg border-dashboard-border text-white"
              />
            </div>
          </div>
          <Button
            onClick={fetchAgentsSummary}
            className="bg-accent text-black hover:bg-accent/80"
          >
            Apply Filters
          </Button>

          {/* Summary Stats */}
          {data && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dashboard-border">
              <div>
                <p className="text-sm text-gray-400">Total Time</p>
                <p className="text-2xl font-semibold text-white">
                  {formatDuration(data.total_seconds)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Entries</p>
                <p className="text-2xl font-semibold text-white">
                  {data.total_entries}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Agents</p>
                <p className="text-2xl font-semibold text-white">
                  {data.agents.length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agents List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : data && data.agents.length > 0 ? (
        <div className="space-y-4">
          {data.agents.map((agent) => (
            <Card
              key={agent.agent_id}
              className="bg-dashboard-surface border-dashboard-border"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg">
                      {agent.agent_name}
                    </CardTitle>
                    <p className="text-sm text-gray-400">{agent.agent_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-accent">
                      {formatDuration(agent.total_seconds)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {agent.entry_count} entries
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agent.recent_entries.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 mb-2">Recent Entries:</p>
                    {agent.recent_entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2 bg-dashboard-bg rounded border border-dashboard-border"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-white">{entry.description}</p>
                          {entry.task && (
                            <p className="text-xs text-gray-400">
                              Task: {entry.task.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {new Date(entry.started_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-accent text-accent">
                          {entry.duration_formatted}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No time entries yet
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-dashboard-surface border-dashboard-border">
          <CardContent className="py-8 text-center">
            <p className="text-gray-400">No agents time logs found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
