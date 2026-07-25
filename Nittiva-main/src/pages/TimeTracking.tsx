import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Play,
  Pause,
  Square,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  Timer,
  BarChart3,
  PieChart,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimeTracker } from "@/context/TimeTrackerContext";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { TaskTimeTracker } from "@/components/ui/task-time-tracker";
import StatsCard from "@/components/dashboard/StatsCard";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import ManagerAgentListView from "@/components/dashboard/ManagerAgentListView";

export default function TimeTracking() {
  const { state, formatDuration, startTracking, stopTracking, reloadEntries } =
    useTimeTracker();
  const { projects } = useProject();
  const { user } = useAuth();
  const isAgent = (user as any)?.role === "agent";
  const isManager = (user as any)?.role === "manager";
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [selectedProject, setSelectedProject] = useState("all");

  // Calculate time statistics
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(
      today.getTime() - today.getDay() * 24 * 60 * 60 * 1000,
    );
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayEntries = state.entries.filter(
      (entry) => new Date(entry.startTime) >= today,
    );
    const weekEntries = state.entries.filter(
      (entry) => new Date(entry.startTime) >= thisWeek,
    );
    const monthEntries = state.entries.filter(
      (entry) => new Date(entry.startTime) >= thisMonth,
    );

    const todayTime = todayEntries.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );
    const weekTime = weekEntries.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );
    const monthTime = monthEntries.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );

    const avgDailyTime = weekTime / 7;

    return {
      today: todayTime,
      week: weekTime,
      month: monthTime,
      avgDaily: avgDailyTime,
      totalSessions: state.entries.length,
      activeSession: state.activeEntry ? state.activeEntry.duration : 0,
    };
  }, [state.entries, state.activeEntry]);

  // Get recent time entries
  const recentEntries = useMemo(() => {
    return state.entries
      .slice(-10)
      .reverse()
      .map((entry) => ({
        ...entry,
        date: new Date(entry.startTime).toLocaleDateString(),
        time: new Date(entry.startTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
  }, [state.entries]);

  // Group entries by task
  const taskTimeBreakdown = useMemo(() => {
    const taskTimes = new Map();

    state.entries.forEach((entry) => {
      const existing = taskTimes.get(entry.taskId) || 0;
      taskTimes.set(entry.taskId, existing + entry.duration);
    });

    return Array.from(taskTimes.entries())
      .map(([taskId, duration]) => ({
        taskId,
        duration,
        description:
          state.entries.find((e) => e.taskId === taskId)?.description ||
          `Task ${taskId}`,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  }, [state.entries]);

  const handleQuickStart = async (taskName: string) => {
    if (!isAgent) {
      toast.error("Only agents can log work");
      return;
    }
    
    // Just start the timer - work will be logged when timer stops
    startTracking(`quick-${Date.now()}`, taskName);
    toast.success("Timer started!");
  };

  // Reload time logs when component mounts
  useEffect(() => {
    if (isAgent && user) {
      // Data is already loaded by TimeTrackerContext on mount
      // This effect ensures data is refreshed when navigating to this page
      reloadEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgent, user]); // Only reload when agent/user changes, not on every reloadEntries change

  // If manager, redirect to progress or show message
  if (isManager) {
    return (
      <div className="h-full bg-dashboard-bg flex items-center justify-center">
        <p className="text-white text-lg">Managers should use the Progress tab to view agent time logs.</p>
      </div>
    );
  }

  // If not agent, show message
  if (!isAgent) {
    return (
      <div className="h-full bg-dashboard-bg flex items-center justify-center">
        <p className="text-white text-lg">This page is only available for agents.</p>
      </div>
    );
  }

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
          <div>
            <h1 className="text-2xl font-normal text-white mb-1">Task List</h1>
            <p className="text-gray-400 text-sm">
              Manage and track your tasks with customizable fields
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32 bg-dashboard-bg border-dashboard-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="border-dashboard-border text-gray-400"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Active Timer Section */}
        {state.activeEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <Timer className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {state.activeEntry.description || "Current Task"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm text-gray-300">
                      {state.isTracking ? "Tracking" : "Paused"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-mono text-white mb-2">
                  {formatDuration(state.activeEntry.duration)}
                </div>
                <div className="flex items-center gap-2">
                  {state.isTracking ? (
                    <Button
                      size="sm"
                      onClick={stopTracking}
                      variant="outline"
                      className="border-red-500 text-red-400"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {}}
                      className="bg-accent text-black"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Time"
            value={formatDuration(stats.today)}
            icon={Clock}
            color="green"
            delay={0.1}
            isTime={true}
          />
          <StatsCard
            title="This Week"
            value={formatDuration(stats.week)}
            icon={Calendar}
            color="purple"
            delay={0.2}
            isTime={true}
          />
          <StatsCard
            title="Avg Daily"
            value={formatDuration(stats.avgDaily)}
            icon={TrendingUp}
            color="orange"
            delay={0.3}
            isTime={true}
          />
          <StatsCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={Target}
            color="blue"
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Start - Only shown to agents */}
          {isAgent && (
            <div className="space-y-6">
              {/* Quick Start Timer */}
              <Card className="bg-dashboard-surface border-dashboard-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Play className="w-5 h-5 text-accent" />
                    Quick Start
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="What are you working on?"
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        handleQuickStart(e.currentTarget.value.trim());
                        e.currentTarget.value = "";
                      }
                    }}
                  />

                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Quick Actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Meeting",
                        "Development",
                        "Research",
                        "Documentation",
                      ].map((task) => (
                        <Button
                          key={task}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickStart(task)}
                          className="border-dashboard-border text-gray-300 hover:text-white hover:border-accent"
                        >
                          {task}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Tasks */}
              <Card className="bg-dashboard-surface border-dashboard-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    Top Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {taskTimeBreakdown.length > 0 ? (
                    taskTimeBreakdown.map((task, index) => (
                      <div key={task.taskId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300 truncate">
                            {task.description}
                          </span>
                          <span className="text-sm font-mono text-white">
                            {formatDuration(task.duration)}
                          </span>
                        </div>
                        <Progress
                          value={
                            (task.duration / taskTimeBreakdown[0].duration) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No time tracked yet. Start a timer to see statistics.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Time Entries */}
          <div className={isAgent ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card className="bg-dashboard-surface border-dashboard-border h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-accent" />
                  Recent Time Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentEntries.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-dashboard-bg rounded-lg border border-dashboard-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {entry.description || `Task ${entry.taskId}`}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {entry.date} at {entry.time}
                              {entry.endTime && (
                                <>
                                  {" - "}
                                  {new Date(entry.endTime).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-white font-mono text-sm">
                            {formatDuration(entry.duration)}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs border-accent/50 text-accent"
                          >
                            Completed
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">
                      No time entries yet
                    </p>
                    <p className="text-gray-500 text-sm">
                      Start tracking time to see your activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Daily Progress */}
        {stats.today > 0 && (
          <Card className="bg-dashboard-surface border-dashboard-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Today's Goal: 8 hours</span>
                  <span className="text-white font-mono">
                    {formatDuration(stats.today)} / 8h 0m
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (stats.today / (8 * 60 * 60 * 1000)) * 100,
                    100,
                  )}
                  className="h-4"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>
                    {Math.round((stats.today / (8 * 60 * 60 * 1000)) * 100)}%
                    complete
                  </span>
                  <span>
                    {stats.today >= 8 * 60 * 60 * 1000
                      ? "Goal achieved! 🎉"
                      : `${formatDuration(8 * 60 * 60 * 1000 - stats.today)} remaining`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
