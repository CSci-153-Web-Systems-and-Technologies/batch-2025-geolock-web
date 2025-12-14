import Image from "next/image";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  subtitleIcon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  subtitleIcon: SubtitleIcon,
  iconBgColor,
  iconColor,
}: StatCardProps) {
  return (
    <Card className="relative h-[124px] rounded-[12px] border-0 bg-white p-5 overflow-hidden">
      {/* Background illustration - right side */}
      <div className="absolute bottom-0 right-0 w-[87px] h-[79px] opacity-10">
        <Image
          src="/images/chart-illustration.svg"
          alt=""
          fill
          className="object-contain"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-medium text-gray-800">{title}</p>
          <div
            className={`w-[19px] h-[18px] rounded-full flex items-center justify-center ${iconBgColor}`}
          >
            <Icon className={`w-3 h-3 ${iconColor}`} />
          </div>
        </div>

        <p className="text-[24px] font-bold text-black mb-2">{value}</p>

        <div className="flex items-center gap-0.5 text-[7px] font-medium text-gray-800">
          <SubtitleIcon className="w-2.5 h-2.5 text-green-500" />
          <span>{subtitle}</span>
        </div>
      </div>
    </Card>
  );
}