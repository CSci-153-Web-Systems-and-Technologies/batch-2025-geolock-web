import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";
import { DashboardHeader } from "@/components/layouts/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Fetch User Data on Server (Fastest Method)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // 2. Extract Details
  const userDetails = {
    orgName: user.user_metadata?.full_name || "Organization",
    orgAbbr: user.user_metadata?.org_abbr || "User", // <--- We need this
    orgType: user.user_metadata?.org_type || "Organization",
    avatarUrl: user.user_metadata?.avatar_url || "",
  };

  return (
    <div className="min-h-screen bg-app-theme">
      {/* 3. Pass data here */}
      <DashboardSidebar orgAbbr={userDetails.orgAbbr} />

      <div className="lg:pl-[296px] flex flex-col min-h-screen transition-all duration-300">
        <DashboardHeader 
          orgName={userDetails.orgName} 
          orgType={userDetails.orgType} 
          avatarUrl={userDetails.avatarUrl}
        />
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}