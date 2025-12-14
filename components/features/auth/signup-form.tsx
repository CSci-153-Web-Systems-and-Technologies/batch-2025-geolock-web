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

// Icons
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { AuthHeader } from "./auth-header";

export function SignUpForm() {
  // Organization Details State
  const [orgName, setOrgName] = useState("");
  const [orgAbbr, setOrgAbbr] = useState("");
  const [orgType, setOrgType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. STRICT VALIDATION Check
    if (!orgName.trim() || !orgAbbr.trim() || !orgType || !email.trim() || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: orgName, 
            org_abbr: orgAbbr,
            org_type: orgType,
            account_type: 'organization', 
            role: 'admin' 
          },
        },
      });

      if (signUpError) {
        // CHECK: specific error for existing user
        if (signUpError.message.includes("User already registered") || signUpError.message.includes("already exists")) {
          setError("ACCOUNT_EXISTS"); // Set a specific flag for the UI
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user && !data.session) {
        setSuccess(true); 
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[500px] bg-white rounded-[20px] shadow-[0px_2px_6.8px_rgba(0,0,0,0.25)] border-0">
      <CardContent className="p-8 md:p-10">
        
        <AuthHeader 
          title="Create Account"
          subtitle="Register your organization to get started"
        />

        {/* --- CUSTOM WARNING: ACCOUNT EXISTS --- */}
        {error === "ACCOUNT_EXISTS" ? (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Account already exists</p>
              <p className="mt-1 text-amber-800">
                This email is already registered. Would you like to{" "}
                <Link href="/auth/login" className="underline font-medium hover:text-amber-950">
                  Log in instead?
                </Link>
              </p>
            </div>
          </div>
        ) : error && (
          /* --- STANDARD ERROR --- */
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="mt-6 text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <p className="font-semibold mb-1">Organization Account Created!</p>
              Please check <strong>{email}</strong> to verify the account before logging in.
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="w-full h-[49.5px] rounded-[10px] border-[#d9d9d9] text-gray-700 font-medium bg-white"
            >
              Back to Organization Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            
            {/* GRID LAYOUT: Name and Abbr */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="orgName" className="text-xs font-medium text-gray-800">
                  Organization Name
                </Label>
                <Input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-[49.5px] rounded-[10px] border-[#d9d9d9] bg-white focus:bg-white transition-all"
                  placeholder="e.g. Supreme Student Council"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgAbbr" className="text-xs font-medium text-gray-800">
                  Abbreviation
                </Label>
                <Input
                  id="orgAbbr"
                  type="text"
                  value={orgAbbr}
                  onChange={(e) => setOrgAbbr(e.target.value)}
                  className="h-[49.5px] rounded-[10px] border-[#d9d9d9] bg-white focus:bg-white transition-all"
                  placeholder="e.g. SSC"
                  required
                />
              </div>
            </div>

            {/* Org Type */}
            <div className="space-y-1.5">
              <Label htmlFor="orgType" className="text-xs font-medium text-gray-800">
                Organization Type
              </Label>
              <div className="relative">
                <select
                  id="orgType"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full h-[49.5px] rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  required
                >
                  <option value="" disabled>Select Type</option>
                  <option value="academic">Academic (School/College)</option>
                  <option value="student_council">Student Council</option>
                  <option value="club">Club / Organization</option>
                  <option value="corporate">Corporate / Business</option>
                  <option value="non_profit">Non-Profit / NGO</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

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
                className="h-[49.5px] rounded-[10px] border-[#d9d9d9] bg-white focus:bg-white transition-all"
                placeholder="ssc@university.edu"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-gray-800">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[49.5px] rounded-[10px] border-[#d9d9d9] bg-white focus:bg-white transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-[49.5px] rounded-[10px] bg-[#004eec] hover:bg-[#0040c4] text-sm text-white font-medium mt-4 shadow-lg shadow-blue-500/20"
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
              {loading ? "Registering Org..." : "Create Organization Account"}
            </Button>
          </form>
        )}

        {/* Login Link */}
        <p className="mt-6 text-center text-[13px] font-medium text-gray-700">
          Already registered your Organization?{" "}
          <Link
            href="/auth/login"
            className="text-gray-800 underline hover:text-[#004eec]"
          >
            Log in here
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}