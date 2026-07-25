import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function SocialLoginDemo() {
  return (
    <Alert className="mb-4 bg-blue-50/10 border-blue-200/20 text-blue-100">
      <Info className="h-4 w-4" />
      <AlertDescription className="text-sm">
        <strong>Demo Mode:</strong> Social login buttons are fully functional in
        demo mode. Click any provider to see the authentication flow. In
        production, these would integrate with real OAuth providers (Google,
        LinkedIn, Apple).
      </AlertDescription>
    </Alert>
  );
}
