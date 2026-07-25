import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NittivaLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark" | "gradient";
}

export function NittivaLogo({
  size = "md",
  className,
  showText = true,
  variant = "gradient",
}: NittivaLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const iconClasses = cn(
    iconSizes[size],
    "rounded-xl flex items-center justify-center",
    {
      "bg-gradient-to-br from-purple-600 to-blue-600": variant === "gradient",
      "bg-white": variant === "light",
      "bg-gray-800": variant === "dark",
    },
  );

  const sparklesClasses = cn(
    "text-white",
    {
      "w-3 h-3": size === "sm",
      "w-4 h-4": size === "md",
      "w-5 h-5": size === "lg",
    },
    {
      "text-purple-600": variant === "light",
      "text-white": variant === "dark" || variant === "gradient",
    },
  );

  const textClasses = cn("font-bold", textSizes[size], {
    "bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent":
      variant === "gradient",
    "text-gray-900": variant === "light",
    "text-white": variant === "dark",
  });

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className={iconClasses}>
        <Sparkles className={sparklesClasses} />
      </div>
      {showText && <span className={textClasses}>Nittiva</span>}
    </div>
  );
}
