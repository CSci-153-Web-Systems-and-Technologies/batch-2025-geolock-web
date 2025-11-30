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
        "relative flex items-center h-[66px] rounded-l-[10px] transition-all group",
        isActive
          ? "bg-gradient-to-r from-[rgba(0,78,236,0.87)] to-[rgba(124,168,255,0.87)]"
          : "bg-white hover:bg-gradient-to-r hover:from-[rgba(0,78,236,0.02)] hover:to-[rgba(124,168,255,0)]"
      )}
    >
      {/* Active indicator */}
      <div
        className={cn(
          "absolute left-0 w-[6px] h-full rounded-l-[10px]",
          isActive ? "bg-[#004eec]" : "bg-[rgba(0,0,0,0.04)]"
        )}
      />

      {/* Content */}
      <div className="flex items-center gap-3 ml-8">
        <div
          className={cn(
            "w-6 h-6 flex items-center justify-center",
            isActive ? "text-white" : "text-black"
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            "text-[18px] font-medium",
            isActive ? "text-white" : "text-black"
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}