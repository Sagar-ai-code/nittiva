import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Plus, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProjectWelcomeSectionProps {
  onStartProject: () => void;
  className?: string;
}

export function ProjectWelcomeSection({
  onStartProject,
  className,
}: ProjectWelcomeSectionProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleInputClick = () => {
    onStartProject();
  };

  const currentTime = new Date().getHours();
  const greeting =
    currentTime < 12
      ? "Good morning"
      : currentTime < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "relative bg-gradient-to-br from-dashboard-surface to-dashboard-bg border border-dashboard-border rounded-2xl p-8 mb-8 overflow-hidden",
        className,
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-purple-500/5" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />

      <div className="relative z-10">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {greeting}, let's get productive!
            </h2>
            <p className="text-gray-400 text-lg">
              Ready to start something amazing?
            </p>
          </div>
        </motion.div>

        {/* Main Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Start Fresh
            </div>
            <h3 className="text-3xl font-bold text-white">
              Do you want to start a new Project?
            </h3>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Create organized workspaces, collaborate with your team, and bring
              your ideas to life with our powerful project management tools.
            </p>
          </div>

          {/* Interactive Search/Input */}
          <div className="max-w-2xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative group cursor-pointer transition-all duration-300",
                isFocused && "scale-105",
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div
                className="relative bg-dashboard-bg border-2 border-dashboard-border hover:border-accent/50 rounded-2xl p-6 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-accent/10"
                onClick={handleInputClick}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Search className="w-6 h-6 text-accent" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <Input
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Type your project name or idea here..."
                      className="bg-transparent border-none text-xl text-white placeholder:text-gray-400 h-auto p-0 focus-visible:ring-0 font-medium"
                      onClick={handleInputClick}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Click to start creating your project with templates and
                      customization
                    </p>
                  </div>

                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="lg"
                      className="bg-accent text-black hover:bg-accent/80 rounded-xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center justify-center gap-4 text-sm text-gray-400"
          >
            <span>Quick start:</span>
            <button
              onClick={onStartProject}
              className="text-accent hover:text-accent/80 transition-colors font-medium"
            >
              Marketing Campaign
            </button>
            <span>•</span>
            <button
              onClick={onStartProject}
              className="text-accent hover:text-accent/80 transition-colors font-medium"
            >
              Product Launch
            </button>
            <span>•</span>
            <button
              onClick={onStartProject}
              className="text-accent hover:text-accent/80 transition-colors font-medium"
            >
              Team Project
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
