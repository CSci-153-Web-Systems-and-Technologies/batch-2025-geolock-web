interface YearProgressBarProps {
  year: string;
  percentage: number;
}

export function YearProgressBar({ year, percentage }: YearProgressBarProps) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-medium text-gray-700">{year}</p>
      <div className="relative h-[7px] w-full">
        {/* Background */}
        <div className="absolute inset-0 rounded-[8px] bg-[#d9d9d9]" />
        
        {/* Progress */}
        <div
          className="absolute inset-0 rounded-[8px] bg-gradient-to-r from-[#004eec] to-[#7ca8ff]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}