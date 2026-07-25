import React from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { cn } from "@/lib/utils";

interface SocialLoginButtonsProps {
  onGoogleLogin: (credentialResponse: CredentialResponse) => void;
  isLoading?: boolean;
  className?: string;
}

export function SocialLoginButtons({
  onGoogleLogin,
  isLoading,
  className,
}: SocialLoginButtonsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="w-full">
        <GoogleLogin
          onSuccess={onGoogleLogin}
          onError={() => {
            console.error("Google Login failed");
          }}
          useOneTap={false}
          theme="filled_white"
          size="large"
          text="continue_with"
          shape="rectangular"
          logo_alignment="left"
        />
      </div>
    </div>
  );
}
