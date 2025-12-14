"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { AuthHeader } from "./auth-header";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[426px] bg-white rounded-[20px] shadow-[0px_2px_6.8px_rgba(0,0,0,0.25)] border-0">
      <CardContent className="p-8">
        
        {/* Header - Changes based on state */}
        {!success && (
          <AuthHeader 
            title="Forgot Password?"
            subtitle="Enter your email to receive reset instructions"
          />
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 animate-in fade-in">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-2 text-center animate-in fade-in slide-in-from-bottom-2">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              We&apos;ve sent a password reset link to <br/>
              <span className="font-medium text-gray-900">{email}</span>
            </p>
            
            <div className="mt-8">
              <Button
                variant="outline"
                asChild
                className="w-full h-[49.5px] rounded-[10px] border-[#d9d9d9] text-gray-700 font-medium"
              >
                <Link href="/auth/login">
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-gray-800">
                Organization Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[49.5px] rounded-[10px] border-[#d9d9d9] bg-white"
                placeholder="name@example.com"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-[49.5px] rounded-[10px] bg-[#004eec] hover:bg-[#0040c4] text-sm text-white font-medium shadow-lg shadow-blue-500/20"
            >
              {loading ? "Sending Link..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/login"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}