import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Map background */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/images/auth-map.svg"
          alt="Map illustration"
          fill
          className="object-cover object-center"
          sizes="50vw"
          quality={100}
          priority
        />
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}