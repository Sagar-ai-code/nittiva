import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Server } from "lucide-react";

export function DevelopmentNotice() {
  if (!import.meta.env.DEV) return null;

  return (
    <Alert className="mb-4 border-blue-500/20 bg-blue-500/10">
      <Info className="h-4 w-4 text-blue-400" />
      <AlertDescription className="text-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="border-blue-400 text-blue-400">
            Development Mode
          </Badge>
          <Server className="w-3 h-3" />
          <span className="text-xs">Mock API Active</span>
        </div>
        <div className="text-sm">
          <strong>Demo Credentials:</strong> demo@example.com / password
          <br />
          <span className="text-xs text-blue-300">
            Trying live API first, falling back to mock data if endpoints are
            not available. Check console for endpoint testing details.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
