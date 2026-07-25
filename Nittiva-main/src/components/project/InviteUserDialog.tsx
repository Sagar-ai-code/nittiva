import React, { useState } from "react";
import { X, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | number;
  projectName: string;
  onInviteSent?: () => void;
}

export function InviteUserDialog({
  isOpen,
  onClose,
  projectId,
  projectName,
  onInviteSent,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.inviteUserToProject(
        projectId,
        email.trim(),
        role,
        message.trim() || undefined
      );

      if (response.success) {
        toast.success(`Invitation sent to ${email}`);
        setEmail("");
        setMessage("");
        setRole("member");
        onInviteSent?.();
        onClose();
      } else {
        toast.error(response.message || "Failed to send invitation");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dashboard-surface border-dashboard-border text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite User to {projectName}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Send an invitation to join this project. The user will receive an email with a link to accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-dashboard-bg border-dashboard-border text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-300">
              Role
            </Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)}>
              <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dashboard-surface border-dashboard-border">
                <SelectItem value="admin">Admin - Full access</SelectItem>
                <SelectItem value="member">Member - Can create and edit tasks</SelectItem>
                <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300">
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-dashboard-bg border-dashboard-border text-white min-h-[100px]"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-dashboard-border text-gray-400 hover:text-white"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent text-black hover:bg-accent/80"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
