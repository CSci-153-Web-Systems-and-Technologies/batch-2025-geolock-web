import Image from 'next/image'

export function AuthMapBackground() {
  return (
    <div className="hidden lg:block lg:w-1/2 relative">
      <Image
        src="/images/auth-map.svg"
        alt="Map illustration"
        fill
        className="object-cover"
        priority
      />
    </div>
  )
}