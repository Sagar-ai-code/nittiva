import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AuthHeaderProps {
  showAuthLinks?: boolean;
}

export function AuthHeader({ showAuthLinks = true }: AuthHeaderProps) {
  return (
    <header className="w-full py-4 px-6 relative z-20">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F9904588c60fb490e85274cacb675da8b%2F3b2338ca45e44b4c92f4630003d43891?format=webp&width=800"
            alt="NITTIVA"
            className="h-8 w-auto"
          />
        </Link>

        {/* Auth Navigation */}
        {showAuthLinks && (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link to="/register">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
