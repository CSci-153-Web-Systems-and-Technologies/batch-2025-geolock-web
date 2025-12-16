# Geolock 📍

**Attendance that verifies itself.**

Geolock is a secure, location-based attendance system designed for student organizations and classrooms. It eliminates attendance fraud by verifying physical presence through a combination of GPS Geofencing and Dynamic QR Codes.

![Geolock Landing](/public/images/preview.png)

## 🚀 Key Features

* **📍 Radius Geofencing:** Users can only mark attendance if their device is within a specific radius (e.g., 50m) of the event location.
* **🔏 Dynamic QR Codes:** Anti-spoofing mechanism where QR codes refresh automatically to prevent static sharing.
* **📊 Real-time Dashboard:**
    * Visualize attendance trends with **Recharts**.
    * Track "Expected" (Capacity) vs "Actual" (Unique) attendees.
    * View real-time "Present Now" status.
* **📂 Data Management:**
    * Export attendance logs to **CSV**.
    * Filter data by Year Level and specific Events.
* **🛡️ Secure Authentication:** Organization management powered by **Supabase Auth** & Row Level Security (RLS).
* **🌍 Public Access:** Frictionless attendance taking for students via QR scans without requiring login.

## 🛠️ Tech Stack

* **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Backend & Auth:** [Supabase](https://supabase.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Charts:** [Recharts](https://recharts.org/)
* **Maps:** [Leaflet / React-Leaflet](https://react-leaflet.js.org/)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
* Node.js (v18 or higher)
* npm or yarn
* A Supabase project

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/CSci-153-Web-Systems-and-Technologies/batch-2025-geolock-web.git](https://github.com/CSci-153-Web-Systems-and-Technologies/batch-2025-geolock-web.git)
    cd geolock
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Setup (Supabase)

To make the application function correctly, you need to set up the following tables and Row Level Security (RLS) policies in your Supabase SQL Editor.

### 1. Events Table
```sql
create table public.events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  date date not null,
  time time not null,
  location_address text,
  capacity int,
  geofence_radius int default 50,
  status text check (status in ('upcoming', 'active', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.events enable row level security;

-- Policy: Allow public read access (Required for attendance pages)
create policy "Enable read access for all users"
on "public"."events" for select to public using (true);