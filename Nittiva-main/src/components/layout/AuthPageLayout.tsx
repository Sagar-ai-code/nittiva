import React from "react";
import { Footer } from "./Footer";
import { AuthHeader } from "./AuthHeader";

interface AuthPageLayoutProps {
  children: React.ReactNode;
  showAuthLinks?: boolean;
}

export function AuthPageLayout({
  children,
  showAuthLinks = true,
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

      <AuthHeader showAuthLinks={showAuthLinks} />

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        {children}
      </main>

      <Footer />
    </div>
  );
}
