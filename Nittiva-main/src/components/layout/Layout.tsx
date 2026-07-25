import React, { ReactNode } from "react";
import EnhancedSidebar from "./EnhancedSidebar";
import { motion } from "framer-motion";
import { ProjectProvider } from "@/context/ProjectContext";
import { UserProvider } from "@/context/UserContext";
import { TimeTrackerProvider } from "@/context/TimeTrackerContext";
import { TimeTrackerWidget } from "@/components/ui/time-tracker-widget";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  return (
    <UserProvider>
      <ProjectProvider>
        <TimeTrackerProvider>
          <div className="flex h-screen bg-dashboard-bg">
            <EnhancedSidebar />
            <main className="flex-1 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full overflow-y-auto"
              >
                {children}
              </motion.div>
            </main>
            <TimeTrackerWidget />
          </div>
        </TimeTrackerProvider>
      </ProjectProvider>
    </UserProvider>
  );
}
