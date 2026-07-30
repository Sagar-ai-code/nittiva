import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Mail, Clock, UserPlus, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // A-3 (Arjun) — inline signup form state. Email is pre-filled from
  // the invitation; the user just sets a password.
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [signingUp, setSigningUp] = useState(false);

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

  // A-3 (Arjun) — handle the inline signup + accept flow.
  // Registers the new user (using the invitation's email), logs them
  // in, then accepts the invitation so they're added to the project.
  const handleSignupAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !token) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSigningUp(true);
    try {
      // Derive first/last name from the email's local-part (best-effort).
      const localPart = (invitation.email || "").split("@")[0] || "user";
      const [firstName, ...rest] = localPart.split(/[._-]/);
      const lastName = rest.join(" ") || "—";

      // 1) Register the new user
      const reg = await apiService.register({
        email: invitation.email,
        first_name: firstName,
        last_name: lastName,
        password,
        company_id: (invitation as any).tenant_id || undefined,
        company: invitation.project_name || "Nittiva",
        role: "user",
      } as any);
      if (!reg.success) {
        if ((reg.message || "").toLowerCase().includes("already")) {
          toast.info("Account already exists. Logging you in…");
          await login(invitation.email, password);
        } else {
          toast.error(reg.message || "Could not create account.");
          return;
        }
      } else {
        await login(invitation.email, password);
      }

      // 2) Accept the invitation (now that we're authed)
      const acceptRes = await apiService.acceptInvitation(token);
      if (acceptRes.success) {
        toast.success("Welcome! You've been added to the project.");
        setTimeout(() => {
          navigate(`/dashboard/projects/${acceptRes.data.project.id}`);
        }, 1500);
      } else {
        toast.error(acceptRes.message || "Account created but invitation accept failed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Signup failed.");
    } finally {
      setSigningUp(false);
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
              <div className="pt-4 space-y-3">
                {!isAuthenticated ? (
                  // A-3: inline signup form (email pre-filled, password
                  // + confirm). Replaces the "Login or Register" buttons
                  // with a single form so the invitee can join in one
                  // step without leaving the page.
                  <form onSubmit={handleSignupAndAccept} className="space-y-3">
                    <p className="text-sm text-gray-400">
                      Set a password to join{" "}
                      <span className="text-white font-medium">{invitation.project_name}</span>:
                    </p>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={invitation.email}
                        readOnly
                        className="bg-dashboard-bg border-dashboard-border text-white opacity-70 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider">
                        Password
                      </label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="bg-dashboard-bg border-dashboard-border text-white"
                        disabled={signingUp}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wider">
                        Confirm password
                      </label>
                      <Input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="bg-dashboard-bg border-dashboard-border text-white"
                        disabled={signingUp}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={signingUp || password.length < 8}
                      className="w-full bg-accent text-black hover:bg-accent/80"
                    >
                      {signingUp ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining…
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 mr-2" />
                          Join {invitation.project_name}
                        </>
                      )}
                    </Button>
                    <div className="text-center">
                      <Link
                        to={`/login?redirect=/accept-invitation?token=${token}`}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        Already have an account? Log in
                      </Link>
                    </div>
                  </form>
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
