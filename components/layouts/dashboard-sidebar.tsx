import Image from "next/image";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Settings 
} from "lucide-react";
import { NavItem } from "@/components/features/dashboard/nav-item";

export function DashboardSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[296px] bg-white shadow-[1px_0px_10px_2px_rgba(0,0,0,0.25)] z-10">
      {/* Logo and Welcome Section */}
      <div className="h-[78px] flex items-center px-8 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image
            src="/images/main-logo.svg"
            alt="Geolock Logo"
            width={40}
            height={40}
            className="rounded-[10px]"
          />
          <div>
            <h1 className="text-[20px] font-semibold text-[#004eec]">
              Geolock
            </h1>
            <p className="text-[12px] text-gray-600">
              Welcome back, <span className="font-semibold">fc-ssc</span>!
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-12 px-5 space-y-4">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard size={24} />}
          label="Dashboard"
        />
        <NavItem
          href="/events"
          icon={<Calendar size={24} />}
          label="Events"
        />
        <NavItem
          href="/attendees"
          icon={<Users size={24} />}
          label="Attendees"
        />
        <NavItem
          href="/reports"
          icon={<FileText size={24} />}
          label="Reports"
        />
        <NavItem
          href="/settings"
          icon={<Settings size={24} />}
          label="Settings"
        />
      </nav>
    </aside>
  );
}