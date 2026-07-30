import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function EmailSettings() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testTo, setTestTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiService.getEmailStatus();
      if (r.success && r.data) {
        setStatus(r.data);
        if (!testTo) setTestTo(user?.email || "");
      } else {
        toast.error(r.message || "Failed to load email status");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load email status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendTest = async () => {
    setSending(true);
    try {
      const r = await apiService.sendTestEmail(testTo || undefined);
      if (r.success) {
        toast.success(r.message || `Test email sent to ${r.data?.to}`);
        await load();
      } else {
        toast.error(r.message || "Failed to send test email");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  const configured = status?.configured;

  return (
    <div className="h-full bg-dashboard-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-6 max-w-3xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-normal text-white mb-2 flex items-center gap-3">
              <Mail className="w-7 h-7 text-accent" />
              Email settings
            </h1>
            <p className="text-gray-400 text-sm">
              A-2 (Arjun) — SMTP status + send-test. Used for password reset, invitations, and notifications.
            </p>
          </div>
          <Button onClick={load} variant="outline" size="sm" className="border-dashboard-border text-gray-300">
            Refresh
          </Button>
        </div>

        <Card className="bg-dashboard-surface border-dashboard-border">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : configured ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              )}
              Current configuration
              {status && (
                <Badge
                  variant="outline"
                  className={
                    configured
                      ? "ml-2 border-green-500/30 text-green-300"
                      : "ml-2 border-yellow-500/30 text-yellow-300"
                  }
                >
                  {configured ? "SMTP configured" : "Console (no SMTP)"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-xs text-gray-500 py-2">Loading…</div>
            ) : !status ? (
              <div className="text-xs text-red-400 py-2">Failed to load status.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Row label="Backend" value={status.backend} />
                <Row label="Host" value={status.host || "—"} />
                <Row label="Port" value={status.port ? String(status.port) : "—"} />
                <Row label="Use TLS" value={status.use_tls ? "Yes" : "No"} />
                <Row label="From email" value={status.from_email || "—"} />
                <Row label="Username set" value={status.username_set ? "Yes" : "No"} />
              </div>
            )}

            {status && !status.configured && (
              <div className="mt-4 p-3 rounded border border-yellow-500/30 bg-yellow-500/5 text-xs text-yellow-200">
                <strong>Console backend active.</strong> Outgoing emails are logged to the server stdout
                instead of being sent. To enable real delivery, set{" "}
                <code className="px-1 bg-dashboard-bg rounded">EMAIL_HOST_USER</code> and{" "}
                <code className="px-1 bg-dashboard-bg rounded">EMAIL_HOST_PASSWORD</code> in Render
                dashboard env vars, then redeploy.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-dashboard-surface border-dashboard-border">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-accent" />
              Send a test email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-400">
              Sends a quick test message to verify the email pipeline end-to-end.
              Works with both SMTP (real send) and console (logs to server).
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 bg-dashboard-bg border-dashboard-border text-white"
                disabled={sending}
              />
              <Button
                onClick={sendTest}
                disabled={sending || !testTo}
                className="bg-accent text-black hover:bg-accent/90 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send test
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashboard-border/50 pb-1">
      <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
      <span className="text-white font-mono text-sm truncate ml-2">{value}</span>
    </div>
  );
}
