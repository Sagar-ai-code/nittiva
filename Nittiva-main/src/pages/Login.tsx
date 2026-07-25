import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2, User, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthPageLayout } from "@/components/layout/AuthPageLayout";
import { useAuth } from "@/context/AuthContext";
import { getRedirectRoute } from "@/lib/roleNavigation";
import { toast } from "sonner";

const managerLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const agentLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  company_id: z.string().min(3, "Company ID is required").max(20, "Company ID must be 20 characters or less"),
});

type ManagerLoginFormData = z.infer<typeof managerLoginSchema>;
type AgentLoginFormData = z.infer<typeof agentLoginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [userType, setUserType] = useState<"manager" | "agent">("manager");
  const [showPassword, setShowPassword] = useState(false);

  const managerForm = useForm<ManagerLoginFormData>({
    resolver: zodResolver(managerLoginSchema),
  });

  const agentForm = useForm<AgentLoginFormData>({
    resolver: zodResolver(agentLoginSchema),
  });

  const handleManagerLogin = async (data: ManagerLoginFormData) => {
    try {
      // For manager login, we need to get company_id from user's tenant
      // First try to login without company_id, backend will handle it
      const result = await login({
        email: data.username, // Use username as email
        password: data.password,
        company_id: "", // Manager login - backend will find tenant from user
      });

      if (result.success && result.user) {
        const user = result.user as any;
        if (user.role === "manager") {
          toast.success("Login successful!");
          const redirectRoute = getRedirectRoute(user.role);
          navigate(redirectRoute);
        } else {
          toast.error("Invalid credentials for manager login");
        }
      } else {
        // Show detailed errors
        const errorMessage = result.message || "Invalid credentials";
        const errors = result.errors || {};
        
        // Display field-specific errors
        Object.keys(errors).forEach((field) => {
          const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          fieldErrors.forEach((error: string) => {
            toast.error(`${field}: ${error}`);
          });
        });
        
        // Also show general message
        if (Object.keys(errors).length === 0) {
          toast.error(errorMessage);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login");
    }
  };

  const handleAgentLogin = async (data: AgentLoginFormData) => {
    try {
      const result = await login({
        email: data.username, // Use username as email
        password: data.password,
        company_id: data.company_id.toUpperCase(),
      });

      if (result.success && result.user) {
        const user = result.user as any;
        if (user.role === "agent") {
          toast.success("Login successful!");
          const redirectRoute = getRedirectRoute(user.role);
          navigate(redirectRoute);
        } else {
          toast.error("Invalid credentials for agent login");
        }
      } else {
        // Show detailed errors
        const errorMessage = result.message || "Invalid credentials";
        const errors = result.errors || {};
        
        // Display field-specific errors
        Object.keys(errors).forEach((field) => {
          const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          fieldErrors.forEach((error: string) => {
            toast.error(`${field}: ${error}`);
          });
        });
        
        // Also show general message
        if (Object.keys(errors).length === 0) {
          toast.error(errorMessage);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login");
    }
  };

  return (
    <AuthPageLayout showAuthLinks={false}>
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader className="text-center">
              <Link to="/" className="flex items-center justify-center space-x-2 mb-4">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F9904588c60fb490e85274cacb675da8b%2F3b2338ca45e44b4c92f4630003d43891?format=webp&width=800"
                  alt="NITTIVA"
                  className="h-10 w-auto hover:opacity-80 transition-opacity"
                />
              </Link>
              <CardTitle className="text-2xl text-white">Welcome to NITTIVA</CardTitle>
              <CardDescription className="text-gray-300">
                Sign in as Manager or Agent
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* User Type Selection */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                <Button
                  type="button"
                  variant={userType === "manager" ? "default" : "ghost"}
                  onClick={() => setUserType("manager")}
                  className={`flex-1 ${
                    userType === "manager"
                      ? "bg-accent text-black hover:bg-accent/80"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Manager
                </Button>
                <Button
                  type="button"
                  variant={userType === "agent" ? "default" : "ghost"}
                  onClick={() => setUserType("agent")}
                  className={`flex-1 ${
                    userType === "agent"
                      ? "bg-accent text-black hover:bg-accent/80"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  Agent
                </Button>
              </div>

              {/* Manager Login Form */}
              {userType === "manager" && (
                <form
                  onSubmit={managerForm.handleSubmit(handleManagerLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="manager_username" className="text-white">
                      Manager Username
                    </Label>
                    <Input
                      id="manager_username"
                      placeholder="Enter your username"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      {...managerForm.register("username")}
                    />
                    {managerForm.formState.errors.username && (
                      <p className="text-red-400 text-sm">
                        {managerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager_password" className="text-white">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="manager_password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 pr-10"
                        {...managerForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {managerForm.formState.errors.password && (
                      <p className="text-red-400 text-sm">
                        {managerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In as Manager"
                    )}
                  </Button>
                </form>
              )}

              {/* Agent Login Form */}
              {userType === "agent" && (
                <form
                  onSubmit={agentForm.handleSubmit(handleAgentLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="agent_username" className="text-white">
                      Agent Username
                    </Label>
                    <Input
                      id="agent_username"
                      placeholder="Enter your username"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      {...agentForm.register("username")}
                    />
                    {agentForm.formState.errors.username && (
                      <p className="text-red-400 text-sm">
                        {agentForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent_password" className="text-white">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="agent_password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 pr-10"
                        {...agentForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {agentForm.formState.errors.password && (
                      <p className="text-red-400 text-sm">
                        {agentForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agent_company_id" className="text-white">
                      Company ID <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="agent_company_id"
                      type="text"
                      placeholder="Enter Company ID (e.g., YYT6USJJ)"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 uppercase"
                      style={{ textTransform: "uppercase" }}
                      {...agentForm.register("company_id")}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        agentForm.register("company_id").onChange(e);
                      }}
                    />
                    {agentForm.formState.errors.company_id && (
                      <p className="text-red-400 text-sm">
                        {agentForm.formState.errors.company_id.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In as Agent"
                    )}
                  </Button>
                </form>
              )}

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-gray-300">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuthPageLayout>
  );
}
