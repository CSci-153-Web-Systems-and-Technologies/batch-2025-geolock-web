import Image from "next/image";

export function DashboardHeader() {
  return (
    <header className="fixed top-0 left-[296px] right-0 h-[78px] bg-white shadow-sm z-10">
      <div className="h-full flex items-center justify-end px-8">
        {/* Organization Info */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/org-logo.png"
            alt="Organization Logo"
            width={45}
            height={45}
            className="rounded-full"
          />
          <div className="text-left">
            <p className="text-[12px] font-semibold text-gray-600">
              Faculty of Computing
            </p>
            <p className="text-[12px] font-semibold text-black">
              Supreme Student Council
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}