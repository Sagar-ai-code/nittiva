import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Mail, Clock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const response = await apiService.getInvitationByToken(token!);
      if (response.success) {
        setInvitation(response.data);
        
        // Check if expired
        if (response.data.status === "expired" || 
            (response.data.expires_at && new Date(response.data.expires_at) < new Date())) {
          setError("This invitation has expired.");
        } else if (response.data.status === "accepted") {
          setError("This invitation has already been accepted.");
        }
      } else {
        setError(response.message || "Invitation not found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/accept-invitation?token=${token}`);
      return;
    }

    setAccepting(true);
    try {
      const response = await apiService.acceptInvitation(token);
      if (response.success) {
        toast.success("Invitation accepted! You've been added to the project.");
        setTimeout(() => {
          navigate(`/dashboard/projects/${response.data.project.id}`);
        }, 2000);
      } else {
        toast.error(response.message || "Failed to accept invitation");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-4">
        <Card className="bg-dashboard-surface border-dashboard-border text-white max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-8 h-8 text-red-400" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
            <CardDescription className="text-gray-400">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full bg-accent text-black hover:bg-accent/80">
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = invitation?.status === "expired" || 
    (invitation?.expires_at && new Date(invitation.expires_at) < new Date());
  const isAccepted = invitation?.status === "accepted";
  const canAccept = !isExpired && !isAccepted && invitation?.status === "pending";

  return (
    <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-4">
      <Card className="bg-dashboard-surface border-dashboard-border text-white max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            {canAccept ? (
              <UserPlus className="w-8 h-8 text-accent" />
            ) : isAccepted ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
            <CardTitle>
              {canAccept ? "Project Invitation" : isAccepted ? "Invitation Accepted" : "Invalid Invitation"}
            </CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            {canAccept
              ? `You've been invited to join a project`
              : isAccepted
              ? "This invitation has already been accepted"
              : "This invitation is no longer valid"}
          </CardDescription>
        </CardHeader>

        {invitation && (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Project</p>
                <p className="text-lg font-medium">{invitation.project_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Invited by</p>
                <p className="text-white">{invitation.invited_by?.name || invitation.invited_by?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Role</p>
                <p className="text-white capitalize">{invitation.role}</p>
              </div>

              {invitation.message && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Message</p>
                  <p className="text-white">{invitation.message}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>
                  Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {canAccept && (
              <div className="pt-4 space-y-2">
                {!isAuthenticated ? (
                  <>
                    <p className="text-sm text-gray-400 text-center">
                      Please login or register to accept this invitation
                    </p>
                    <div className="flex gap-2">
                      <Link to={`/login?redirect=/accept-invitation?token=${token}`} className="flex-1">
                        <Button className="w-full bg-accent text-black hover:bg-accent/80">
                          Login
                        </Button>
                      </Link>
                      <Link to={`/register?token=${token}`} className="flex-1">
                        <Button variant="outline" className="w-full border-dashboard-border">
                          Register
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {user?.email.toLowerCase() !== invitation.email.toLowerCase() && (
                      <p className="text-sm text-yellow-400 text-center">
                        This invitation was sent to {invitation.email}, but you're logged in as {user?.email}
                      </p>
                    )}
                    <Button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="w-full bg-accent text-black hover:bg-accent/80"
                    >
                      {accepting ? "Accepting..." : "Accept Invitation"}
                    </Button>
                  </>
                )}
              </div>
            )}

            {!canAccept && (
              <Link to="/">
                <Button className="w-full bg-accent text-black hover:bg-accent/80">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
