"use client";

import Image from "next/image";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Settings 
} from "lucide-react";
import { NavItem } from "@/components/features/dashboard/nav-item";

interface DashboardSidebarProps {
  orgAbbr: string;
}

export function DashboardSidebar({ orgAbbr }: DashboardSidebarProps) {
  return (
    // FIX: Increased z-index to 'z-50'
    <aside className="fixed left-0 top-0 h-screen w-[296px] bg-white shadow-[1px_0px_10px_2px_rgba(0,0,0,0.05)] z-50 flex flex-col font-sans">
      
      {/* Header / Logo Section */}
      <div className="h-[100px] flex items-center px-8">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex-shrink-0">
             <Image
              src="/images/auth-logo.svg" 
              alt="Geolock Logo"
              fill
              className="object-contain rounded-[10px]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[20px] font-semibold text-[#004eec] leading-none mb-1">
              Geolock
            </h1>
            <p className="text-[12px] text-gray-600">
              Welcome back, <span className="font-semibold">{orgAbbr?.toLowerCase() || "user"}</span>!
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6 space-y-2 pr-0">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard size={22} />}
          label="Dashboard"
        />
        <NavItem
          href="/events"
          icon={<Calendar size={22} />}
          label="Events"
        />
        <NavItem
          href="/attendees"
          icon={<Users size={22} />}
          label="Attendees"
        />
        <NavItem
          href="/reports"
          icon={<FileText size={22} />}
          label="Reports"
        />
        <NavItem
          href="/settings"
          icon={<Settings size={22} />}
          label="Settings"
        />
      </nav>
    </aside>
  );
}