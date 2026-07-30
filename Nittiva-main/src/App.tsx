import { BrowserRouter, Routes, Route, useParams, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";   // ⬅️ add this
import { TaskProvider } from "./context/TaskContext";
import { UserProvider } from "./context/UserContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { GoogleAuthProvider } from "./components/auth/GoogleOAuthProvider";
import { Toaster } from "sonner";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import AdminLogin from "./pages/admin/AdminLogin";
import EmailSettings from "./pages/admin/EmailSettings";

// Protected Pages
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import TimeTracking from "./pages/TimeTracking";
import ProjectTasks from "./pages/ProjectTasks";
import TaskBoard from "./pages/TaskBoard";
import TaskDetail from "./pages/TaskDetail";
import Users from "./pages/Users";
import Clients from "./pages/Clients";
import Meetings from "./pages/Meetings";
import Todos from "./pages/Todos";
import Notes from "./pages/Notes";
import Chat from "./pages/Chat";
import Invoice from "./pages/Invoice";
import LeaveRequests from "./pages/LeaveRequests";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import TenantManagement from "./pages/admin/TenantManagement";
import Timeline from "./pages/Timeline";
import Sprint from "./pages/Sprint";
import Progress from "./pages/Progress";
import AgentTimeLogDetail from "./pages/AgentTimeLogDetail";
import Statuses from "./pages/Statuses";
import Priorities from "./pages/Priorities";

import "./App.css";

function App() {
  return (
    <GoogleAuthProvider>
      <AuthProvider>                         {/* 1) Auth first */}
        <ProjectProvider>                    {/* 2) Projects need auth */}
          <UserProvider>                     {/* 3) Users can also depend on auth */}
            <TaskProvider>                   {/* 4) Tasks may depend on currentProject */}
              <BrowserRouter>
                <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Landing />
                    </ProtectedRoute>
                  }
                />
                        <Route
                          path="/login"
                          element={
                            <ProtectedRoute requireAuth={false}>
                              <Login />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/login"
                          element={<AdminLogin />}
                        />
                        <Route
                          path="/register"
                          element={
                            <ProtectedRoute requireAuth={false}>
                              <Register />
                            </ProtectedRoute>
                          }
                        />
                <Route
                  path="/email-verification"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <EmailVerification />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <ForgotPassword />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <ResetPassword />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accept-invitation"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <AcceptInvitation />
                    </ProtectedRoute>
                  }
                />
                {/* A-3 (Arjun) — public /invite/:token route.
                    Same component, but the token is in the path, not the
                    query string. Cleaner URL to paste in an email. */}
                <Route
                  path="/invite/:token"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <InviteAcceptFromPath />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Index />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:projectId" element={<ProjectTasks />} />
                  <Route path="projects/:projectId/board" element={<TaskBoard />} />
                  <Route path="tasks/:taskId" element={<TaskDetail />} />
                  <Route path="tasks" element={<TimeTracking />} />
                  <Route path="progress" element={<Progress />} />
                  <Route path="agents/:agentId/time-logs" element={<AgentTimeLogDetail />} />
                  <Route path="statuses" element={<Statuses />} />
                  <Route path="priorities" element={<Priorities />} />
                  <Route path="timeline" element={<Timeline />} />
                  <Route path="sprint" element={<Sprint />} />
                  <Route
                    path="workspaces"
                    element={<div className="p-6 text-white">Workspaces - Coming Soon</div>}
                  />
                  <Route path="chat" element={<Chat />} />
                  <Route path="invoice" element={<Invoice />} />
                  <Route path="users" element={<Users />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="meetings" element={<Meetings />} />
                  <Route path="todos" element={<Todos />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="leave-requests" element={<LeaveRequests />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="admin/email" element={<EmailSettings />} />
                  <Route path="admin/tenants" element={<TenantManagement />} />
                </Route>

                  {/* Catch all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>

                <Toaster
                  theme="dark"
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "white",
                    },
                  }}
                />
              </BrowserRouter>
            </TaskProvider>
          </UserProvider>
        </ProjectProvider>
      </AuthProvider>
    </GoogleAuthProvider>
  );
}

export default App;

// A-3 (Arjun) — Wraps AcceptInvitation and synthesizes a `?token=`
// query string from the path param. Lets us reuse the same component
// for both the legacy /accept-invitation?token=<t> URL and the
// cleaner /invite/<token> URL that the A-1 picker generates.
function InviteAcceptFromPath() {
  const { token } = useParams<{ token: string }>();
  if (!token) return <Navigate to="/" replace />;
  // Use window.location to inject the token into the query string
  // the existing AcceptInvitation already reads from.
  const search = new URLSearchParams(window.location.search);
  search.set("token", token);
  return (
    <Navigate to={`/accept-invitation?${search.toString()}`} replace />
  );
}
