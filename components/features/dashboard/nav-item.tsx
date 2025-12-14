"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center h-[64px] transition-all duration-300 group overflow-hidden",
        // SHAPE LOGIC:
        // 1. ml-6: Pushes it away from the left edge (creating the gap)
        // 2. rounded-l-[30px]: Rounds the left side heavily
        // 3. rounded-r-none: Keeps the right side flat to flush with the border
        "ml-6 rounded-l-[10px] rounded-r-none", 
        isActive
          ? "bg-gradient-to-r from-[rgba(0,78,236,0.87)] to-[rgba(124,168,255,0.87)] shadow-md"
          : "bg-transparent hover:bg-gray-50"
      )}
    >
      {/* Active Left Strip Indicator (Optional, matches your previous design) */}
      <div
        className={cn(
          "absolute left-0 w-[6px] h-full transition-colors duration-300",
          isActive ? "bg-[#004eec]" : "bg-transparent group-hover:bg-gray-200/50"
        )}
      />

      {/* Icon & Label */}
      <div className="flex items-center gap-4 ml-6 z-10">
        <div
          className={cn(
            "flex items-center justify-center transition-colors duration-300",
            isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            "text-[16px] font-medium transition-colors duration-300",
            isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}