import Image from "next/image";

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AuthHeader({ 
  title = "Organizer Portal",
  subtitle = "Please enter your details" 
}: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Logo */}
      <Image
        src="/images/logo.svg"
        alt="Geolock Logo"
        width={78}
        height={72}
        className="rounded-[10px]"
        priority
      />
      
      {/* Title with gradient */}
      <h1 className="mt-4 text-2xl font-semibold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
        {title}
      </h1>
      
      {/* Subtitle */}
      <p className="mt-4 text-[13px] font-medium text-gray-700">
        {subtitle}
      </p>
    </div>
  );
}