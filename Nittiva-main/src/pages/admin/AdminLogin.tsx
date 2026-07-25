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
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/lib/api";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const handleAdminLogin = async (data: AdminLoginFormData) => {
    // For admin login, send empty company_id
    // The backend will allow superusers to login without company_id validation
    try {
      const result = await login({
        email: data.email,
        password: data.password,
        company_id: "", // Empty - backend allows superusers without validation
      });

      if (result.success && result.user) {
        // Check if user is superuser
        const user = result.user as any;
        if (user.is_superuser || user.is_staff) {
          // Redirect to tenant management
          navigate("/dashboard/admin/tenants");
        } else {
          // Not a superuser, show error and redirect to regular login
          alert("Access denied. This is an admin-only login page. Please use the regular login.");
          navigate("/login");
        }
      } else {
        alert(result.message || "Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      alert(error.message || "An error occurred during login.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
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
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-yellow-400" />
              <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
            </div>
            <CardDescription className="text-gray-300">
              Superadmin access to manage tenants and system settings
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(handleAdminLogin)} className="space-y-4">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@nittiva.local"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In as Admin"
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-gray-300 text-sm">
                Regular user?{" "}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Go to User Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
