"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import { AuthHeader } from "./auth-header";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-[426px] bg-white rounded-[20px] shadow-[0px_2px_6.8px_rgba(0,0,0,0.25)] border-0">
      <CardContent className="p-8">
        
        {/* Dynamic Header for Log In */}
        <AuthHeader 
          title="Welcome Back"
          subtitle="Please enter your credentials to login"
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-gray-800">
              Organization Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[49.5px] rounded-[10px] border-[#d9d9d9]"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-gray-800">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[49.5px] rounded-[10px] border-[#d9d9d9]"
              required
            />
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded-sm border-[#d9d9d9] accent-[#004eec] cursor-pointer"
              />
              <Label
                htmlFor="rememberMe"
                className="text-xs font-medium text-gray-700 cursor-pointer"
              >
                Remember me
              </Label>
            </div>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-gray-700 underline hover:text-[#004eec]"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[49.5px] rounded-[10px] bg-[#004eec] hover:bg-[#0040c4] text-sm text-white font-medium shadow-lg shadow-blue-500/20"
          >
            {loading && (
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Sign up link */}
        <p className="mt-6 text-center text-[13px] font-medium text-gray-700">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-gray-800 underline hover:text-[#004eec]"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}