import React, { useState, useEffect } from "react";
import { Play, Pause, Square, Clock, History, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimeTracker } from "@/context/TimeTrackerContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

interface TaskTimeTrackerProps {
  taskId: string;
  taskName: string;
  className?: string;
  variant?: "inline" | "button" | "badge";
  showHistory?: boolean;
}

export function TaskTimeTracker({
  taskId,
  taskName,
  className,
  variant = "inline",
  showHistory = true,
}: TaskTimeTrackerProps) {
  const {
    state,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    getTaskTotalTime,
    formatDuration,
  } = useTimeTracker();

  const [currentDuration, setCurrentDuration] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const isActiveTask = state.activeEntry?.taskId === taskId;
  const isTracking = isActiveTask && state.isTracking;
  const totalTime = getTaskTotalTime(taskId);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && state.activeEntry) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - state.activeEntry!.startTime.getTime();
        setCurrentDuration(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, state.activeEntry]);

  const handleStartTracking = () => {
    startTracking(taskId, taskName);
  };

  const handleStopTracking = () => {
    stopTracking();
  };

  const handleToggleTracking = () => {
    if (isActiveTask) {
      if (isTracking) {
        pauseTracking();
      } else {
        resumeTracking();
      }
    } else {
      startTracking(taskId, taskName);
    }
  };

  const getDisplayTime = () => {
    if (isActiveTask && state.activeEntry) {
      const activeTime =
        state.activeEntry.duration +
        (isTracking ? currentDuration - state.activeEntry.duration : 0);
      return totalTime + activeTime;
    }
    return totalTime;
  };

  const taskEntries = state.entries.filter((entry) => entry.taskId === taskId);

  if (variant === "badge") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-2 cursor-pointer hover:bg-gradient-to-r hover:from-dashboard-surface/50 hover:to-accent/5 rounded-lg px-3 py-2 transition-all duration-300 border border-transparent hover:border-accent/20 group",
              isActiveTask &&
                "bg-gradient-to-r from-accent/5 to-green-500/5 border-accent/30",
              className,
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative">
              <Clock
                className={cn(
                  "w-4 h-4 transition-colors duration-300",
                  isActiveTask
                    ? "text-accent"
                    : "text-gray-500 group-hover:text-accent/70",
                )}
              />
              {isActiveTask && isTracking && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <span
              className={cn(
                "text-sm font-mono tracking-wide transition-all duration-300",
                isActiveTask
                  ? "text-white font-semibold"
                  : "text-gray-400 group-hover:text-gray-300",
                "tabular-nums", // Better number alignment
              )}
            >
              {formatDuration(getDisplayTime())}
            </span>
            {isActiveTask && (
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    isTracking
                      ? "bg-green-400 animate-pulse shadow-lg shadow-green-400/50"
                      : "bg-orange-400 shadow-lg shadow-orange-400/50",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-300",
                    isTracking ? "text-green-400" : "text-orange-400",
                  )}
                >
                  {isTracking ? "Recording" : "Paused"}
                </span>
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 bg-gradient-to-br from-dashboard-surface to-dashboard-bg border-dashboard-border shadow-2xl shadow-black/50 backdrop-blur-sm"
          align="end"
        >
          <TaskTimeTrackerContent
            taskId={taskId}
            taskName={taskName}
            isActiveTask={isActiveTask}
            isTracking={isTracking}
            totalTime={getDisplayTime()}
            taskEntries={taskEntries}
            onStartTracking={handleStartTracking}
            onStopTracking={handleStopTracking}
            onToggleTracking={handleToggleTracking}
            formatDuration={formatDuration}
            showHistory={showHistory}
          />
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === "button") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-2 bg-dashboard-surface/50 rounded-lg px-3 py-2 border border-dashboard-border/50">
          <Clock
            className={cn(
              "w-4 h-4 transition-colors duration-300",
              isActiveTask ? "text-accent" : "text-gray-400",
            )}
          />
          <span
            className={cn(
              "text-sm font-mono tracking-wide tabular-nums transition-all duration-300",
              isActiveTask ? "text-white font-semibold" : "text-gray-400",
            )}
          >
            {formatDuration(getDisplayTime())}
          </span>
          {isActiveTask && (
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  isTracking
                    ? "bg-green-400 animate-pulse shadow-lg shadow-green-400/50"
                    : "bg-orange-400 shadow-lg shadow-orange-400/50",
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isTracking ? "text-green-400" : "text-orange-400",
                )}
              >
                {isTracking ? "Live" : "Paused"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleToggleTracking}
            className={cn(
              "h-8 px-3 font-semibold transition-all duration-300 shadow-lg",
              isTracking
                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/30"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/30",
            )}
          >
            {isTracking ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>

          {isActiveTask && (
            <Button
              size="sm"
              onClick={handleStopTracking}
              variant="outline"
              className="h-8 px-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 shadow-lg shadow-red-500/20"
            >
              <Square className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <Clock
        className={cn(
          "w-4 h-4 transition-colors duration-300",
          isActiveTask
            ? "text-accent"
            : "text-gray-500 group-hover:text-accent/70",
        )}
      />
      <span
        className={cn(
          "text-sm cursor-pointer transition-all duration-300 font-mono tracking-wide tabular-nums",
          isActiveTask
            ? "text-white font-semibold hover:text-accent"
            : "text-gray-400 hover:text-white",
        )}
        onClick={handleToggleTracking}
      >
        {formatDuration(getDisplayTime())}
      </span>
      {isActiveTask && (
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              isTracking
                ? "bg-green-400 animate-pulse shadow-lg shadow-green-400/50"
                : "bg-orange-400 shadow-lg shadow-orange-400/50",
            )}
          />
          <span
            className={cn(
              "text-xs font-medium transition-all duration-300",
              isTracking ? "text-green-400" : "text-orange-400",
            )}
          >
            {isTracking ? "Live" : "Paused"}
          </span>
        </div>
      )}
    </div>
  );
}

interface TaskTimeTrackerContentProps {
  taskId: string;
  taskName: string;
  isActiveTask: boolean;
  isTracking: boolean;
  totalTime: number;
  taskEntries: any[];
  onStartTracking: () => void;
  onStopTracking: () => void;
  onToggleTracking: () => void;
  formatDuration: (ms: number) => string;
  showHistory: boolean;
}

function TaskTimeTrackerContent({
  taskId,
  taskName,
  isActiveTask,
  isTracking,
  totalTime,
  taskEntries,
  onStartTracking,
  onStopTracking,
  onToggleTracking,
  formatDuration,
  showHistory,
}: TaskTimeTrackerContentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h4
          className="text-white font-semibold text-base mb-3 truncate"
          title={taskName}
        >
          {taskName}
        </h4>
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <span
              className={cn(
                "text-3xl font-mono text-white tracking-wider tabular-nums transition-all duration-300",
                isActiveTask && "text-accent font-bold",
              )}
            >
              {formatDuration(totalTime)}
            </span>
            {isActiveTask && isTracking && (
              <div className="absolute -top-1 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
            )}
          </div>
          {isActiveTask && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium px-3 py-1 transition-all duration-300",
                isTracking
                  ? "border-green-500 text-green-400 bg-green-500/10 shadow-lg shadow-green-500/20"
                  : "border-orange-500 text-orange-400 bg-orange-500/10 shadow-lg shadow-orange-500/20",
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full mr-1.5",
                  isTracking ? "bg-green-400 animate-pulse" : "bg-orange-400",
                )}
              />
              {isTracking ? "Recording" : "Paused"}
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onToggleTracking}
          size="default"
          className={cn(
            "flex-1 font-semibold transition-all duration-300 shadow-lg",
            isTracking
              ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/30"
              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/30",
          )}
        >
          {isTracking ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pause Timer
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {isActiveTask ? "Resume Timer" : "Start Timer"}
            </>
          )}
        </Button>

        {isActiveTask && (
          <Button
            onClick={onStopTracking}
            size="default"
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 shadow-lg shadow-red-500/20 px-3"
          >
            <Square className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Time Entries History */}
      {showHistory && taskEntries.length > 0 && (
        <div className="border-t border-dashboard-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-white">
              Recent Sessions
            </span>
            <div className="h-px bg-gradient-to-r from-accent/50 to-transparent flex-1 ml-2" />
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {taskEntries
              .slice(-5) // Show last 5 entries
              .reverse()
              .map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center justify-between text-xs p-3 bg-gradient-to-r from-dashboard-bg to-dashboard-surface/50 rounded-lg border border-dashboard-border/50 hover:border-accent/30 transition-all duration-300 group"
                >
                  <div className="flex-1">
                    <div className="text-gray-200 font-medium mb-1">
                      {new Date(entry.startTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-gray-400 text-xs font-mono">
                      {new Date(entry.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {entry.endTime && (
                        <>
                          <span className="mx-1 text-accent">→</span>
                          {new Date(entry.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-white font-mono font-semibold bg-accent/10 px-2 py-1 rounded group-hover:bg-accent/20 transition-colors duration-300">
                    {formatDuration(entry.duration)}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
