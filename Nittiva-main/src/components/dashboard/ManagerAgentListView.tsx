import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, User, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AgentSummary {
  agent_id: number;
  agent_name: string;
  agent_email: string;
  total_seconds: number;
  entry_count: number;
}

export default function ManagerAgentListView() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentsSummary();
  }, []);

  const fetchAgentsSummary = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAgentsSummary();
      if (response.success && response.data) {
        setAgents(response.data.agents || []);
      } else {
        toast.error(response.message || "Failed to load agents data");
      }
    } catch (error: any) {
      console.error("Error fetching agents summary:", error);
      toast.error("Failed to load agents time logs");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="h-full bg-dashboard-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-normal text-white mb-2">Agent Time Logs</h1>
          <p className="text-gray-400 text-sm">
            Click on an agent to view their detailed time entries
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card
                key={agent.agent_id}
                className="bg-dashboard-surface border-dashboard-border hover:border-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/agents/${agent.agent_id}/time-logs`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            {agent.agent_name}
                          </h3>
                          <p className="text-sm text-gray-400">{agent.agent_email}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Total Time</p>
                          <p className="text-2xl font-semibold text-accent">
                            {formatDuration(agent.total_seconds)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Entries</p>
                          <p className="text-lg font-medium text-white">
                            {agent.entry_count}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardContent className="py-8 text-center">
              <p className="text-gray-400">No agents found</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
