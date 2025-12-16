"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic"; // 1. Import dynamic
import { Button } from "@/components/ui/button";
import { MapPin, ShieldCheck, QrCode, ArrowRight, Smartphone, School } from "lucide-react";

// 2. Dynamically import the Map to avoid SSR issues
const HeroMap = dynamic(() => import("@/components/landing/hero-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
      <MapPin className="h-10 w-10 animate-pulse mb-2 opacity-20" />
      <p className="text-sm font-medium">Loading Map...</p>
    </div>
  ),
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100">
      {/* --- NAV BAR --- */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
               <Image 
                 src="/images/auth-logo.svg" 
                 alt="Geolock Logo" 
                 fill 
                 className="object-contain rounded-md"
               />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Geolock</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-600 hover:text-[#004eec] rounded-full hover:bg-blue-50 font-medium hidden sm:inline-flex transition-colors">
                Log in
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-[#004eec] hover:bg-[#0040c4] text-white rounded-full px-6 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Geofencing Active
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 animate-in fade-in slide-in-from-bottom-6">
            Attendance that <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004eec] to-indigo-600">
              verifies itself.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            A secure, location-based attendance system designed for student organizations and classrooms. Verify presence instantly using GPS Geofencing and Dynamic QR Codes.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/auth/sign-up">
              <Button size="lg" className="h-14 px-8 rounded-full bg-[#004eec] hover:bg-[#0040c4] text-white text-base shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                Create Organization Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-gray-200 text-gray-700 hover:bg-gray-50 text-base transition-colors">
                How it works
              </Button>
            </Link>
          </div>

          {/* Hero Image / Map Integration */}
          <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white/50 p-2 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <div className="rounded-xl overflow-hidden bg-gray-50 aspect-[16/9] relative z-0 border border-gray-100">
               {/* 3. Replaced static text with the Interactive Map Component */}
               <HeroMap />
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Core System Features</h2>
            <p className="mt-4 text-gray-600">Designed to eliminate attendance fraud and simplify record keeping.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 text-[#004eec] rounded-xl flex items-center justify-center mb-6">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Radius Geofencing</h3>
              <p className="text-gray-600 leading-relaxed">
                Define a precise check-in zone (e.g., 50m) around your venue. Students can only mark attendance if their device GPS is within the boundary.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Dynamic QR Codes</h3>
              <p className="text-gray-600 leading-relaxed">
                Generates a unique QR code that refreshes every few seconds, preventing students from sharing static codes with absent friends.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Anti-Spoofing</h3>
              <p className="text-gray-600 leading-relaxed">
                Integrates browser location checks to detect GPS mocking and VPN usage, ensuring the integrity of your attendance data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 bg-white relative overflow-hidden">
         {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to test the system?</h2>
          <p className="text-xl text-gray-600 mb-10">
            Streamline your organization&apos;s event management today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="h-14 px-10 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-lg shadow-xl transition-all hover:scale-105">
                Register Organization
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-gray-400"/> Mobile Responsive
            </span>
            <span className="flex items-center gap-2">
              <School className="h-4 w-4 text-gray-400"/> Academic Project
            </span>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-gray-100 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm mb-2">© 2025 Geolock Attendance System.</p>
          <p className="text-gray-400 text-xs">
            Developed for Web Systems & Technologies Requirement. Not for commercial use.
          </p>
        </div>
      </footer>
    </div>
  );
}