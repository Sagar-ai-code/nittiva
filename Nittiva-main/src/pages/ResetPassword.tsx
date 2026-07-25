import React, { useState, useEffect } from "react";
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
import { ArrowLeft, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiService, ResetPasswordCredentials } from "@/lib/api";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Get token and email from URL params
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (tokenParam) {
      setToken(tokenParam);
    }
    if (emailParam) {
      setEmail(emailParam);
      setValue("email", emailParam);
    }

    // If no token or email, redirect to forgot password
    if (!tokenParam || !emailParam) {
      toast.error("Invalid reset link. Please request a new password reset.");
      setTimeout(() => {
        navigate("/forgot-password");
      }, 2000);
    }
  }, [searchParams, navigate, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || !email) {
      toast.error("Invalid reset link. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    try {
      const credentials: ResetPasswordCredentials = {
        email: data.email,
        token: token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      };

      const response = await apiService.resetPassword(credentials);
      if (response.success) {
        setIsSuccess(true);
        toast.success("Password reset successful!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(response.message || "Failed to reset password");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while resetting your password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>

              <CardTitle className="text-2xl text-white">
                Password Reset Successful!
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your password has been reset successfully. Redirecting to login...
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-center justify-center pt-4 border-t border-white/10">
                <Link
                  to="/login"
                  className="flex items-center text-blue-400 hover:text-blue-300 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Go to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Invalid Reset Link</CardTitle>
            <CardDescription className="text-gray-300">
              The password reset link is invalid or expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300">
              Request a new password reset
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-2xl font-bold text-white">Nittiva</span>
            </div>

            <CardTitle className="text-2xl text-white">Reset Your Password</CardTitle>
            <CardDescription className="text-gray-300">
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                  disabled
                  value={email || ""}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation" className="text-white">
                  Confirm New Password
                </Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  placeholder="Confirm your new password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                  {...register("password_confirmation")}
                />
                {errors.password_confirmation && (
                  <p className="text-red-400 text-sm">
                    {errors.password_confirmation.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Link
                to="/login"
                className="flex items-center text-blue-400 hover:text-blue-300 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Link>

              <Link
                to="/forgot-password"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Request New Link
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


