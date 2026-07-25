import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageWithFooter } from "@/components/layout/PageWithFooter";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <PageWithFooter className="bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="flex items-center justify-center p-4 min-h-screen">
        <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Link to="/" className="inline-block mb-6">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F9904588c60fb490e85274cacb675da8b%2F3b2338ca45e44b4c92f4630003d43891?format=webp&width=800"
                  alt="NITTIVA"
                  className="h-12 w-auto hover:opacity-80 transition-opacity mx-auto"
                />
              </Link>
              <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-4">
                404
              </h1>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Page Not Found
              </h2>
              <p className="text-gray-300">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWithFooter>
  );
};

export default NotFound;
