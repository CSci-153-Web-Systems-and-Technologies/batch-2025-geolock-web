"use client";

import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface DashboardHeaderProps {
  orgName?: string;
  orgType?: string;
  avatarUrl?: string;
}

export function DashboardHeader({ 
  orgName = "Organization", 
  orgType = "Organization", 
  avatarUrl = "" 
}: DashboardHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === "/dashboard") return "Dashboard";
    if (path.includes("/events")) return "Events";
    if (path.includes("/attendees")) return "Attendees";
    if (path.includes("/reports")) return "Reports";
    if (path.includes("/settings")) return "Settings";
    return "Overview";
  };

  const currentTitle = getPageTitle(pathname);
  
  const formattedType = orgType.split('_').map((word) => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const initials = orgName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    // FIX: Added 'bg-white' and increased z-index to 'z-40'
    <header className="fixed top-0 left-[296px] right-0 h-[78px] bg-white border-b border-gray-100 z-40 flex items-center justify-between px-8 transition-all duration-300">
      
      {/* Left Side: Page Title */}
      <div>
        <h1 className="text-[24px] font-bold text-gray-800 tracking-tight">
          {currentTitle}
        </h1>
      </div>

      {/* Right Side: Profile */}
      <Link href="/dashboard/settings">
        <div className="flex items-center gap-4 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-semibold text-gray-500 group-hover:text-[#004eec] transition-colors">
              {formattedType}
            </p>
            <p className="text-[14px] font-bold text-gray-900 leading-tight">
              {orgName}
            </p>
          </div>

          <Avatar className="h-10 w-10 border-2 border-white shadow-sm group-hover:ring-2 group-hover:ring-blue-100 transition-all">
            <AvatarImage src={avatarUrl} alt={orgName} />
            <AvatarFallback className="bg-[#4361EE] text-white font-medium text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </Link>
    </header>
  );
}