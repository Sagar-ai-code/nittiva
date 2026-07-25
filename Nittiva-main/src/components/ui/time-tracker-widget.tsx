import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimeTracker } from "@/context/TimeTrackerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/context/ProjectContext";

export function TimeTrackerWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const {
    state,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    formatDuration,
    getCurrentDuration,
  } = useTimeTracker();
  const { projects } = useProject();

  const [currentDuration, setCurrentDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.isTracking && state.activeEntry) {
      interval = setInterval(() => {
        setCurrentDuration(getCurrentDuration());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isTracking, state.activeEntry, getCurrentDuration]);

  useEffect(() => {
    if (state.activeEntry) {
      setDescription(state.activeEntry.description || "");
    }
  }, [state.activeEntry]);

  const handleStartTracking = () => {
    // For demo purposes, start tracking without a specific task
    startTracking("general", description || "General work");
  };

  const handleStopTracking = () => {
    stopTracking();
    setDescription("");
    setIsEditingDescription(false);
  };

  const handleDescriptionSave = () => {
    // Update active entry description through dispatch
    if (state.activeEntry) {
      // This would need to be implemented in the context
      setIsEditingDescription(false);
    }
  };

  const getCurrentTaskName = () => {
    if (!state.activeEntry) return null;

    // Find task by ID or show description
    return state.activeEntry.description || "Untitled Task";
  };

  const getCurrentProjectName = () => {
    if (!state.activeEntry) return null;

    // For now, return a default project name
    return "Current Project";
  };

  if (!state.activeEntry && !isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-accent text-black hover:bg-accent/80 shadow-lg rounded-full w-14 h-14 p-0"
        >
          <Clock className="w-6 h-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <div className="bg-dashboard-surface border border-dashboard-border rounded-lg shadow-2xl min-w-80 max-w-96">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dashboard-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-white font-medium text-sm">Time Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-auto text-gray-400 hover:text-white"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
            {!state.activeEntry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="p-1 h-auto text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Timer Display */}
        {state.activeEntry && (
          <div className="p-4 border-b border-dashboard-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-green-400 text-sm font-medium">
                  {state.isTracking ? "Tracking" : "Paused"}
                </span>
              </div>
              <div className="text-white font-mono text-lg">
                {formatDuration(
                  state.activeEntry.duration +
                    (state.isTracking
                      ? currentDuration - state.activeEntry.duration
                      : 0),
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 min-w-fit">Task:</span>
                {isEditingDescription ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-dashboard-bg border-dashboard-border text-white text-xs h-6 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleDescriptionSave();
                        if (e.key === "Escape") setIsEditingDescription(false);
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleDescriptionSave}
                      className="h-6 px-2 bg-accent text-black hover:bg-accent/80"
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-white text-xs flex-1 truncate">
                      {getCurrentTaskName()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDescription(true)}
                      className="p-1 h-auto text-gray-400 hover:text-white"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {getCurrentProjectName() && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 min-w-fit">
                    Project:
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs border-dashboard-border text-gray-300"
                  >
                    {getCurrentProjectName()}
                  </Badge>
                </div>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2 mt-4">
              {state.isTracking ? (
                <Button
                  size="sm"
                  onClick={pauseTracking}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={resumeTracking}
                  className="bg-green-500 hover:bg-green-600 text-white flex-1"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleStopTracking}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white flex-1"
              >
                <Square className="w-4 h-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        )}

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {!state.activeEntry && (
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        What are you working on?
                      </label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your task..."
                        className="bg-dashboard-bg border-dashboard-border text-white text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleStartTracking();
                        }}
                      />
                    </div>

                    <Button
                      onClick={handleStartTracking}
                      className="w-full bg-accent text-black hover:bg-accent/80"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Tracking
                    </Button>
                  </div>
                </div>
              )}

              {/* Today's Summary */}
              <div className="p-4 border-t border-dashboard-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Today's Total</span>
                  <span className="text-white font-mono text-sm">
                    {formatDuration(state.totalTimeToday)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
