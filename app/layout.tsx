import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Geolock",
  description:
    "A Geofenced Attendance designed to automate attendance recording through QR codes and geolocation verification",
};

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body
        className={`${inter.className} antialiased min-h-screen bg-app-gradient`}
      >
        {/* 2. Loader Component */}
        <NextTopLoader
          color="#004eec"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #004eec,0 0 5px #004eec"
        />

        <Toaster position="top-center" richColors closeButton />
        
        {children}
      </body>
    </html>
  );
}