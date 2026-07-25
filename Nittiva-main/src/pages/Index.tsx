import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "@/components/dashboard/StatsCard";
import ProjectStatistics from "@/components/dashboard/ProjectStatistics";
import TaskStatistics from "@/components/dashboard/TaskStatistics";
import TodoOverview from "@/components/dashboard/TodoOverview";
import TimeSheet from "@/components/dashboard/TimeSheet";
import RecentActivities from "@/components/dashboard/RecentActivities";
import TeamOverview from "@/components/dashboard/TeamOverview";
import { Users, FolderOpen, UserCheck, Shield, Clock } from "lucide-react";
import { useTimeTracker } from "@/context/TimeTrackerContext";
import { useAuth } from "@/context/AuthContext";
import { ProjectWelcomeSection } from "@/components/project/ProjectWelcomeSection";
import { ProjectCreationFlow } from "@/components/project/ProjectCreationFlow";
import { useProject } from "@/context/ProjectContext";
import { apiService } from "@/lib/api";
import { Loader2 } from "lucide-react";
import AgentsTimeLogView from "@/components/dashboard/AgentsTimeLogView";
import TimeTracking from "./TimeTracking";

interface DashboardStats {
  overview: {
    total_projects: number;
    active_tasks: number;
    total_tasks: number;
    team_members: number;
  };
  projects: {
    total: number;
    by_status: {
      open: number;
      in_progress: number;
      completed: number;
      archived: number;
      active: number;
    };
    progress_percentage: number;
  };
  tasks: {
    total: number;
    by_status: {
      to_do: number;
      in_progress: number;
      completed: number;
      review: number;
      open: number;
      active: number;
    };
    completion_percentage: number;
  };
  team: {
    total_members: number;
    members: Array<{
      id: number;
      email: string;
      name: string;
      role: string;
      tasksCount: number;
      profile_image_url?: string;
    }>;
  };
  is_admin: boolean;
}

export default function Index() {
  const { state, formatDuration } = useTimeTracker();
  const { addProject } = useProject();
  const { user } = useAuth();
  const isManager = (user as any)?.role === "manager";
  const isAgent = (user as any)?.role === "agent";
  const [isProjectCreationOpen, setIsProjectCreationOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCreateProject = (projectData: any) => {
    // Create the project using the project context
    addProject(projectData.name);
    console.log("Creating project:", projectData);
  };

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const response = await apiService.getDashboardStats();
        if (response.success && response.data) {
          setDashboardStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

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
                placeholder="Search [CTRL + K]"
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
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >
              <span className="text-sm">English</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >
              <span className="text-sm">0 locals</span>
            </Button>
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-6 space-y-8 overflow-y-auto">
        {/* Project Welcome Section */}
        <ProjectWelcomeSection
          onStartProject={() => setIsProjectCreationOpen(true)}
        />

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-normal text-white mb-1">
              Your Current Projects
            </h1>
            <p className="text-gray-400 text-sm">
              {currentDate} • Overview of your ongoing work
            </p>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
        </motion.div>

        {/* Quick Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="stats-card flex items-center justify-center h-24"
              >
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Projects"
              value={dashboardStats?.overview.total_projects ?? 0}
              icon={FolderOpen}
              color="green"
              delay={0.2}
            />
            <StatsCard
              title="Active Tasks"
              value={dashboardStats?.overview.active_tasks ?? 0}
              icon={UserCheck}
              color="green"
              delay={0.3}
            />
            <StatsCard
              title="Team Members"
              value={dashboardStats?.overview.team_members ?? 0}
              icon={Users}
              color="green"
              delay={0.4}
            />
            <StatsCard
              title="Today's Time"
              value={formatDuration(state.totalTimeToday)}
              icon={Clock}
              color="green"
              delay={0.5}
              isTime={true}
            />
          </div>
        )}

        {/* Main Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="h-80">
              <ProjectStatistics stats={dashboardStats?.projects} loading={loading} />
            </div>
            <div className="h-96">
              <TimeSheet />
            </div>
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            <div className="h-80">
              <TaskStatistics stats={dashboardStats?.tasks} loading={loading} />
            </div>
            <div className="h-96">
              <RecentActivities />
            </div>
          </div>

          {/* Right Column */}
          <div className="h-96">
            <TodoOverview />
          </div>
        </div>

        {/* Team & Notifications Row */}
        <div className="h-80">
          <TeamOverview teamMembers={dashboardStats?.team.members} loading={loading} />
        </div>

        {/* Manager View: Agents Time Logs */}
        {isManager && (
          <div className="mt-8">
            <AgentsTimeLogView />
          </div>
        )}
      </div>

      {/* Project Creation Flow */}
      <ProjectCreationFlow
        isOpen={isProjectCreationOpen}
        onClose={() => setIsProjectCreationOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
