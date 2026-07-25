import { motion } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatItem {
  label: string;
  count: number;
  color: string;
}

interface ProjectStats {
  total: number;
  by_status: {
    open: number;
    in_progress: number;
    completed: number;
    archived: number;
    active: number;
  };
  progress_percentage: number;
}

interface ProjectStatisticsProps {
  stats?: ProjectStats;
  loading?: boolean;
}

export default function ProjectStatistics({ stats, loading }: ProjectStatisticsProps) {
  const statsList: StatItem[] = stats ? [
    {
      label: "Open",
      count: stats.by_status.open,
      color: "#befca9",
    },
    {
      label: "Closed",
      count: stats.by_status.completed,
      color: "#ef4444",
    },
    {
      label: "Active",
      count: stats.by_status.active,
      color: "#3b82f6",
    },
    {
      label: "Total",
      count: stats.total,
      color: "#6b7280",
    },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-dashboard-border rounded-lg p-6 h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-normal text-white">Project statistics</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : statsList.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No project data available</div>
        ) : (
          statsList.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stat.color }}
              />
              <span className="text-sm text-gray-300">{stat.label}</span>
            </div>
            <span className="text-sm font-medium text-white">{stat.count}</span>
          </motion.div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-dashboard-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-xs text-gray-400">Progress</span>
          </div>
          <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{
                width: `${stats?.progress_percentage ?? 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
