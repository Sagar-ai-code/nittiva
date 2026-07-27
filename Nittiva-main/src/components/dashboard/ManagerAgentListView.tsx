import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, User, ChevronRight, PlayCircle, PauseCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface ActiveTimer {
  id: string;
  user: { id: number; email: string; name: string; role: string };
  task: { id: number; title: string; status: string } | null;
  started_at: string;
  duration_seconds: number;
}

export default function ManagerAgentListView() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchAll();
    // tick "now" every second so the live durations stay fresh
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [agentsRes, timersRes] = await Promise.all([
        apiService.getAgentsSummary(),
        apiService.getActiveTimers(),
      ]);
      if (agentsRes.success && agentsRes.data) {
        setAgents(agentsRes.data.agents || []);
      }
      if (timersRes.success) {
        const data = timersRes.data;
        // Handle the wrapped {success,data} or a raw array
        const rows = Array.isArray(data) ? data : (data?.data || []);
        setActiveTimers(Array.isArray(rows) ? rows : []);
      }
    } catch (error: any) {
      console.error("Error fetching manager data:", error);
      toast.error("Failed to load manager data");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  // Build a map email -> active timer for quick lookup
  const activeByEmail = new Map<string, ActiveTimer>();
  for (const t of activeTimers) {
    if (t?.user?.email) activeByEmail.set(t.user.email, t);
  }

  return (
    <div className="h-full bg-dashboard-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-normal text-white mb-2">Agent Activity</h1>
            <p className="text-gray-400 text-sm">
              Live overview of every agent's current task and total time.
            </p>
          </div>
          <Button onClick={fetchAll} variant="outline" size="sm" className="border-dashboard-border text-gray-300">
            Refresh
          </Button>
        </div>

        {/* LIVE: who's working right now */}
        <Card className="bg-dashboard-surface border-dashboard-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-green-400" />
              Currently working
              <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-300">
                {activeTimers.length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : activeTimers.length === 0 ? (
              <p className="text-gray-400 text-sm py-3">
                No agent is currently working on a task. (This is where you'll see
                activity as soon as an agent starts a timer.)
              </p>
            ) : (
              <div className="divide-y divide-dashboard-border">
                {activeTimers.map((t) => {
                  // live duration: started_at + (now - request_time_offset)
                  const startedMs = new Date(t.started_at).getTime();
                  const live = Math.max(0, Math.floor((now - startedMs) / 1000));
                  return (
                    <button
                      key={t.id}
                      onClick={() => t.task && navigate(`/dashboard/tasks/${t.task.id}`)}
                      className="w-full text-left py-3 px-1 hover:bg-dashboard-bg/40 transition-colors rounded flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-green-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {t.user.name || t.user.email}
                          </p>
                          <p className="text-gray-400 text-xs truncate">
                            {t.task ? (
                              <>
                                Working on{" "}
                                <span className="text-gray-200">{t.task.title}</span>
                                {" · "}
                                <span className="text-gray-500">{t.task.status}</span>
                              </>
                            ) : (
                              "Working (no task)"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className="border-green-500/30 text-green-300 font-mono">
                          {formatDuration(live)}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TOTAL: each agent's cumulative time */}
        <Card className="bg-dashboard-surface border-dashboard-border">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Total time per agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => {
                  const active = activeByEmail.get(agent.agent_email);
                  return (
                    <Card
                      key={agent.agent_id}
                      className="bg-dashboard-bg border-dashboard-border hover:border-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/agents/${agent.agent_id}/time-logs`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-accent" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base font-medium text-white truncate">
                                  {agent.agent_name}
                                </h3>
                                <p className="text-xs text-gray-400 truncate">{agent.agent_email}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500">Total Time</p>
                                <p className="text-xl font-semibold text-accent">
                                  {formatDuration(agent.total_seconds)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Entries</p>
                                <p className="text-base font-medium text-white">
                                  {agent.entry_count}
                                </p>
                              </div>
                            </div>
                            {active && (
                              <div className="mt-3 flex items-center gap-2 text-xs text-green-300">
                                <PauseCircle className="w-3 h-3" />
                                <span className="truncate">
                                  Working on: {active.task?.title || "—"}
                                </span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-3 text-center">No agents found</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
