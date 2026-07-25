import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function EmailVerification() {
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a verification token in the URL
    const token = searchParams.get("token");
    if (token) {
      handleEmailVerification(token);
    }

    // Get user email from various sources
    const user = apiService.getCurrentUser();
    const storedEmail = localStorage.getItem("pending_verification_email");

    if (user?.email) {
      setUserEmail(user.email);
    } else if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      // If no email found, redirect to register
      toast.error("No email found for verification. Please register again.");
      navigate("/register");
    }
  }, [searchParams, navigate]);

  const handleEmailVerification = async (token: string) => {
    try {
      const response = await apiService.verifyEmail(token);
      if (response.success) {
        toast.success(response.message || "Email verified successfully!");
        // Clear pending email
        localStorage.removeItem("pending_verification_email");
        // Redirect to login
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(response.message || "Email verification failed");
      }
    } catch (error) {
      toast.error("An error occurred during email verification");
    }
  };

  const handleResendEmail = async () => {
    if (!userEmail) {
      toast.error("No email address found. Please register again.");
      navigate("/register");
      return;
    }

    setIsResending(true);
    try {
      const response = await apiService.resendEmailVerification(userEmail);
      if (response.success) {
        toast.success(
          response.message ||
            "Verification email sent! Please check your inbox.",
        );
      } else {
        toast.error(response.message || "Failed to send verification email");
      }
    } catch (error) {
      toast.error("An error occurred while sending the email");
    } finally {
      setIsResending(false);
    }
  };

  // Development bypass function
  const handleDevBypass = async () => {
    try {
      // Simulate successful verification with mock token
      const response = await apiService.verifyEmail("dev-bypass-token");
      if (response.success) {
        toast.success("Email verified successfully (Development Mode)!");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (error) {
      toast.error("Bypass failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Development Mode Notice */}
        <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 mb-4 text-center">
          <p className="text-yellow-300 text-sm font-medium">
            🛠️ Development Mode
          </p>
          <p className="text-yellow-200 text-xs mt-1">
            No real emails are sent. Use the "Skip Verification" button below.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-2xl font-bold text-white">Nittiva</span>
            </div>

            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>

            <CardTitle className="text-2xl text-white">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-gray-300">
              We've sent a verification link to{" "}
              <span className="text-blue-400 font-medium">{userEmail}</span>.
              Please click the link to verify your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-1">Next Steps:</p>
                  <ul className="space-y-1 text-blue-200/80">
                    <li>• Check your email inbox</li>
                    <li>• Click the verification link</li>
                    <li>• Return here to sign in</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-400 text-sm">
                Didn't receive the email? Check your spam folder or
              </p>

              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend Email"}
                </Button>

                {/* Development Mode Bypass */}
                <Button
                  onClick={handleDevBypass}
                  variant="secondary"
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  Skip Verification (Dev Mode)
                </Button>
                <p className="text-xs text-gray-400 text-center">
                  Development Mode: No real emails are sent
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Link
                to="/register"
                className="flex items-center text-blue-400 hover:text-blue-300 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Register
              </Link>

              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Sign In Instead
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
