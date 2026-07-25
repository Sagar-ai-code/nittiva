import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  Check,
  ChevronRight,
  Layers,
  Target,
  BarChart3,
  Code,
  Mail,
  Users,
  Clock,
  Tag,
  Calendar,
  FileText,
  Settings,
  Zap,
  Star,
  Building,
  Briefcase,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  isRecommended?: boolean;
}

interface ClickApp {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  enabled: boolean;
  isPremium?: boolean;
}

interface ProjectCreationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: any) => void;
}

const templates: ProjectTemplate[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For everyday tasks",
    icon: Star,
    color: "#64748b",
  },
  {
    id: "marketing",
    name: "Marketing Teams",
    description: "Run effective campaigns",
    icon: Target,
    color: "#8b5cf6",
    isRecommended: true,
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Plan, manage, and execute projects",
    icon: Briefcase,
    color: "#64748b",
  },
  {
    id: "product-engineering",
    name: "Product + Engineering",
    description: "Streamline your product lifecycle",
    icon: Code,
    color: "#64748b",
  },
];

// Dummy Flag component since it's not in lucide-react
const Flag = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="2" />
  </svg>
);

const clickApps: ClickApp[] = [
  {
    id: "priority",
    name: "Priority",
    description: "Set task priorities",
    icon: Flag,
    color: "#3b82f6",
    enabled: true,
  },
  {
    id: "sprints",
    name: "Sprints",
    description: "Agile development cycles",
    icon: Zap,
    color: "#8b5cf6",
    enabled: true,
  },
  {
    id: "email",
    name: "Email",
    description: "Email notifications",
    icon: Mail,
    color: "#64748b",
    enabled: false,
  },
  {
    id: "tags",
    name: "Tags",
    description: "Organize with tags",
    icon: Tag,
    color: "#8b5cf6",
    enabled: true,
  },
  {
    id: "custom-fields",
    name: "Custom Fields",
    description: "Add custom data fields",
    icon: Settings,
    color: "#3b82f6",
    enabled: true,
  },
  {
    id: "multiple-assignees",
    name: "Multiple Assignees",
    description: "Assign to multiple people",
    icon: Users,
    color: "#8b5cf6",
    enabled: true,
  },
  {
    id: "time-tracking",
    name: "Time Tracking",
    description: "Track time spent",
    icon: Clock,
    color: "#10b981",
    enabled: true,
  },
  {
    id: "time-estimates",
    name: "Time Estimates",
    description: "Estimate task duration",
    icon: Target,
    color: "#8b5cf6",
    enabled: true,
  },
  {
    id: "remap-subtask-dates",
    name: "Remap Subtask Due Dates",
    description: "Auto-adjust subtask dates",
    icon: Calendar,
    color: "#64748b",
    enabled: false,
  },
  {
    id: "work-in-progress",
    name: "Work in Progress Limits",
    description: "Set WIP limits",
    icon: BarChart3,
    color: "#64748b",
    enabled: false,
  },
];

export function ProjectCreationFlow({
  isOpen,
  onClose,
  onCreateProject,
}: ProjectCreationFlowProps) {
  const [step, setStep] = useState<"welcome" | "templates" | "customize">(
    "welcome",
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState("");
  const [enabledApps, setEnabledApps] = useState<{ [key: string]: boolean }>(
    () => {
      const initial: { [key: string]: boolean } = {};
      clickApps.forEach((app) => {
        initial[app.id] = app.enabled;
      });
      return initial;
    },
  );

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setStep("customize");
  };

  const handleCreateProject = () => {
    const projectData = {
      name: projectName,
      template: selectedTemplate,
      clickApps: enabledApps,
    };
    onCreateProject(projectData);
    onClose();
  };

  const handleClose = () => {
    setStep("welcome");
    setSelectedTemplate(null);
    setProjectName("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] mx-4 bg-dashboard-surface border border-dashboard-border rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dashboard-border">
          <div className="flex items-center gap-3">
            {step !== "welcome" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "customize") setStep("templates");
                  else if (step === "templates") setStep("welcome");
                }}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">
                {step === "welcome" && "Create New Project"}
                {step === "templates" && "Define your workflow"}
                {step === "customize" && `Customize ${selectedTemplate?.name}`}
              </h2>
              {step === "templates" && (
                <p className="text-sm text-gray-400 mt-1">
                  Choose a pre-configured solution or customize to your liking
                  with advanced ClickApps, required views, and task statuses.
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <AnimatePresence mode="wait">
            {step === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 space-y-6"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <Building className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">
                    Let's create your new project
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Give your project a name and choose from our templates to
                    get started quickly.
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Project Name
                    </label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      className="bg-dashboard-bg border-dashboard-border text-white text-center text-lg h-12"
                      autoFocus
                    />
                  </div>

                  <Button
                    onClick={() => setStep("templates")}
                    disabled={!projectName.trim()}
                    className="w-full bg-accent text-black hover:bg-accent/80 h-12 text-lg"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "templates" && (
              <motion.div
                key="templates"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "relative bg-dashboard-bg border-dashboard-border hover:border-accent/50 transition-all cursor-pointer group",
                        template.isRecommended && "border-accent",
                      )}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-6">
                        {template.isRecommended && (
                          <Badge className="absolute -top-2 left-4 bg-accent text-black text-xs">
                            Recommended
                          </Badge>
                        )}
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: template.color + "20" }}
                          >
                            <template.icon
                              className="w-6 h-6"
                              style={{ color: template.color }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {template.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {template.description}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-accent transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "customize" && selectedTemplate && (
              <motion.div
                key="customize"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 space-y-6"
              >
                <div className="bg-dashboard-bg border border-dashboard-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ backgroundColor: selectedTemplate.color + "20" }}
                    >
                      <selectedTemplate.icon
                        className="w-5 h-5"
                        style={{ color: selectedTemplate.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        Customize defaults for {selectedTemplate.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Default Views */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-dashboard-bg border border-dashboard-border rounded-lg">
                    <Layers className="w-5 h-5 text-accent" />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Default views</h4>
                      <p className="text-gray-400 text-sm">
                        List, Board, Calendar, Team
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-dashboard-bg border border-dashboard-border rounded-lg">
                    <Target className="w-5 h-5 text-accent" />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Task statuses</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span className="text-xs text-gray-400">Backlog</span>
                        </div>
                        <span className="text-gray-500">→</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-purple-400" />
                          <span className="text-xs text-gray-400">
                            Planning
                          </span>
                        </div>
                        <span className="text-gray-500">→</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-orange-400" />
                          <span className="text-xs text-gray-400">
                            In Progress
                          </span>
                        </div>
                        <span className="text-gray-500">→</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-pink-400" />
                          <span className="text-xs text-gray-400">
                            Ready For Review
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* ClickApps */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">ClickApps</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        Turn off all ClickApps
                      </span>
                      <Switch />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clickApps.map((app) => (
                      <div
                        key={app.id}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-lg transition-colors",
                          enabledApps[app.id]
                            ? "border-accent bg-accent/5"
                            : "border-dashboard-border bg-dashboard-bg",
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center"
                          style={{ backgroundColor: app.color + "20" }}
                        >
                          <app.icon
                            className="w-4 h-4"
                            style={{ color: app.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-white text-sm font-medium truncate">
                            {app.name}
                          </h5>
                          <p className="text-gray-400 text-xs truncate">
                            {app.description}
                          </p>
                        </div>
                        <Switch
                          checked={enabledApps[app.id]}
                          onCheckedChange={(checked) =>
                            setEnabledApps((prev) => ({
                              ...prev,
                              [app.id]: checked,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dashboard-border">
          <div className="flex items-center gap-2">
            {step === "customize" && (
              <Button
                variant="outline"
                onClick={() => setStep("templates")}
                className="border-dashboard-border text-gray-400 hover:text-white"
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === "customize" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-dashboard-border text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  className="bg-accent text-black hover:bg-accent/80"
                >
                  Create Project
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
