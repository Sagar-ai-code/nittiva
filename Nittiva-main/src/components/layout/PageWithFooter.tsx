import React from "react";
import { Footer } from "./Footer";

interface PageWithFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWithFooter({
  children,
  className = "",
}: PageWithFooterProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
