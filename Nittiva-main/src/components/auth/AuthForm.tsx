import React, { useState } from "react";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  company_id: z.string().min(3, "Company ID is required (3-20 characters)").max(20, "Company ID must be 20 characters or less"),
});

const registerSchema = z
  .object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^[+]?[0-9\s\-\(\)]+$/, "Please enter a valid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z.string(),
    company: z.string().optional(),
    company_id: z.string().min(3, "Company ID is required (3-20 characters)").max(20, "Company ID must be 20 characters or less"),
    type: z.string().default("member"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (data: LoginFormData | RegisterFormData) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  isLoading?: boolean;
  isSocialLoading?: boolean;
}

export function AuthForm({
  type,
  onSubmit,
  onGoogleLogin,
  isLoading,
  isSocialLoading,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLogin = type === "login";
  const schema = isLogin ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: isLogin ? undefined : { type: "member" },
  });

  const handleFormSubmit = (data: LoginFormData | RegisterFormData) =>
    onSubmit(data);

  return (
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
          <CardTitle className="text-2xl text-white">
            {isLogin ? "Welcome to NITTIVA" : "Join NITTIVA"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {isLogin
              ? "Access your enterprise business management platform"
              : "Transform your business operations with our comprehensive platform"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {!isLogin && (
              <>
                <input type="hidden" {...register("type" as any)} value="member" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-white">
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      placeholder="Enter your first name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      {...register("first_name" as any)}
                    />
                    {"first_name" in errors && (
                      <p className="text-red-400 text-sm">
                        {(errors as any).first_name?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-white">
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      placeholder="Enter your last name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      {...register("last_name" as any)}
                    />
                    {"last_name" in errors && (
                      <p className="text-red-400 text-sm">
                        {(errors as any).last_name?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    {...register("phone" as any)}
                  />
                  {"phone" in errors && (
                    <p className="text-red-400 text-sm">
                      {(errors as any).phone?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-white">
                    Company (Optional)
                  </Label>
                  <Input
                    id="company"
                    placeholder="Enter your company name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    {...register("company" as any)}
                  />
                  {"company" in errors && (
                    <p className="text-red-400 text-sm">
                      {(errors as any).company?.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Company ID field (required for both login and register) */}
            <div className="space-y-2">
              <Label htmlFor="company_id" className="text-white">
                Company ID <span className="text-red-400">*</span>
              </Label>
              <Input
                id="company_id"
                type="text"
                placeholder="Enter your company ID (e.g., ACME123)"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 uppercase"
                {...register("company_id" as any)}
                style={{ textTransform: "uppercase" }}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("company_id" as any).onChange(e);
                }}
              />
              <p className="text-xs text-gray-400">
                Contact your administrator to get your company ID
              </p>
              {"company_id" in errors && (
                <p className="text-red-400 text-sm">
                  {(errors as any).company_id?.message}
                </p>
              )}
            </div>

            {/* Email field (used for both login and register) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                {...register("email" as any)}
              />
              {"email" in errors && (
                <p className="text-red-400 text-sm">
                  {(errors as any).email?.message}
                </p>
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
                  {...register("password" as any)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {"password" in errors && (
                <p className="text-red-400 text-sm">
                  {(errors as any).password?.message}
                </p>
              )}
            </div>

            {/* Confirm password only for register */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="password_confirmation" className="text-white">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 pr-10"
                    {...register("password_confirmation" as any)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {"password_confirmation" in errors && (
                  <p className="text-red-400 text-sm">
                    {(errors as any).password_confirmation?.message}
                  </p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {onGoogleLogin && (
            <>
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-white/20"></div>
                <span className="text-sm text-gray-300 font-medium">
                  Or continue with
                </span>
                <div className="flex-1 h-px bg-white/20"></div>
              </div>
              <SocialLoginButtons
                onGoogleLogin={onGoogleLogin}
                isLoading={isSocialLoading}
              />
            </>
          )}

          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-gray-300">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link
                to={isLogin ? "/register" : "/login"}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
