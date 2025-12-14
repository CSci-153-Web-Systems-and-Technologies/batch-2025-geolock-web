'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Users, BarChart3, TrendingUp, Clock, CheckCircle, UserCheck, Award, Loader2, MoreHorizontal } from "lucide-react";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { StatisticsChart } from "@/components/features/dashboard/statistics-chart";
import { AttendeesBreakdown } from "@/components/features/dashboard/attendees-breakdown";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- TYPES ---
interface DashboardMetrics {
  totalEvents: number;
  activeEvents: number;
  totalAttendees: number;
  completionRate: string;
}

interface ActivityLog {
  id: string;
  name: string;
  type: string;
  created_at: string;
  email: string;
  year_level: string;
  event: { name: string } | null; 
}

interface ChartData {
  name: string;
  expected: number;
  actual: number;
}

interface BreakdownData {
  name: string;
  value: number;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; 
}

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#2563EB'];
// Define standard order for years to ensure they always appear
const STANDARD_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function DashboardPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  
  // Raw Data State
  const [allAttendees, setAllAttendees] = useState<ActivityLog[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEvents: 0, activeEvents: 0, totalAttendees: 0, completionRate: "0%",
  });

  // Filter State
  const [selectedYear, setSelectedYear] = useState<string>("All");
  
  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Metrics Counts
        const { count: totalEvents } = await supabase.from('events').select('*', { count: 'exact', head: true });
        const { count: activeEvents } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { count: totalCheckIns } = await supabase.from('attendees').select('*', { count: 'exact', head: true }).eq('type', 'check-in');
        const { count: totalCheckOuts } = await supabase.from('attendees').select('*', { count: 'exact', head: true }).eq('type', 'check-out');
        const rate = totalCheckIns && totalCheckOuts ? Math.round((totalCheckOuts / totalCheckIns) * 100) : 0;

        setMetrics({
          totalEvents: totalEvents || 0,
          activeEvents: activeEvents || 0,
          totalAttendees: totalCheckIns || 0,
          completionRate: `${rate}%`
        });

        // 2. Fetch All Attendees (Detailed)
        const { data, error } = await supabase
          .from('attendees')
          .select('created_at, type, faculty, year_level, name, email, id, student_id, event:events(name)')
          .order('created_at', { ascending: false });

        if (error) console.error("Supabase Error:", error);
        
        if (data) {
          setAllAttendees(data as unknown as ActivityLog[]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const subscription = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase]);

  // --- PROCESSED DATA (MEMOIZED) ---
  const { chartData, breakdownData, totalUniqueCount, recentActivity, availableYears } = useMemo(() => {
    
    // Calculate available years dynamically or use standard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dynamicYears = Array.from(new Set(allAttendees.map((a: any) => a.year_level).filter(Boolean))).sort();
    const yearsToShow = dynamicYears.length > 0 ? dynamicYears : STANDARD_YEARS;

    // 1. Filter Data based on selection
    const filteredData = selectedYear === "All" 
      ? allAttendees 
      : allAttendees.filter(a => a.year_level === selectedYear);

    // 2. Process Statistics Chart
    const eventMap = new Map<string, { expected: number, actual: number }>();
    filteredData.forEach(log => {
      const eventName = log.event?.name || "Unknown Event";
      if (!eventMap.has(eventName)) eventMap.set(eventName, { expected: 0, actual: 0 });
      
      const stats = eventMap.get(eventName)!;
      stats.expected += 1; 
      if (log.type === 'check-in') stats.actual += 1;
    });

    const processedChartData: ChartData[] = Array.from(eventMap.entries()).map(([name, stats]) => ({
      name, expected: stats.expected, actual: stats.actual
    }));

    // 3. Process Attendees Breakdown (ENSURE ALL YEARS EXIST)
    // First, count the filtered data
    const currentCounts: Record<string, number> = {};
    filteredData.forEach(a => {
        if (a.year_level) currentCounts[a.year_level] = (currentCounts[a.year_level] || 0) + 1;
    });

    // Map through ALL available years. If a year isn't in 'currentCounts' (because it was filtered out),
    // it gets value 0 but still appears in the list.
    const processedBreakdown: BreakdownData[] = yearsToShow.map((year, index) => ({
      name: year,
      value: currentCounts[year] || 0, // Returns 0 if filtered out
      color: COLORS[index % COLORS.length]
    }));

    // Calculate total unique for the circle (Global or Filtered? Filtered makes sense for the view)
    const uniqueStudentIds = new Set<string>();
    filteredData.forEach(a => uniqueStudentIds.add(a.email));

    // 4. Recent Activity
    const processedRecent = allAttendees.slice(0, 20); 

    return {
        chartData: processedChartData,
        breakdownData: processedBreakdown,
        totalUniqueCount: uniqueStudentIds.size,
        recentActivity: processedRecent,
        availableYears: yearsToShow
    };

  }, [allAttendees, selectedYear]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 text-[#004eec] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 mt-[78px]"> 
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Events" value={metrics.totalEvents.toString()} subtitle="All time events" icon={Calendar} subtitleIcon={Clock} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
        <StatCard title="Active Events" value={metrics.activeEvents.toString()} subtitle="Currently Running" icon={TrendingUp} subtitleIcon={CheckCircle} iconBgColor="bg-green-100" iconColor="text-green-600" />
        <StatCard title="Total Attendees" value={metrics.totalAttendees.toString()} subtitle="Total Check-ins" icon={Users} subtitleIcon={UserCheck} iconBgColor="bg-orange-100" iconColor="text-orange-600" />
        <StatCard title="Completion Rate" value={metrics.completionRate} subtitle="Check-out Rate" icon={BarChart3} subtitleIcon={Award} iconBgColor="bg-yellow-100" iconColor="text-yellow-600" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StatisticsChart 
            data={chartData} 
            years={availableYears} 
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          /> 
        </div>
        <div>
          {/* Pass selectedYear so it knows which to highlight */}
          <AttendeesBreakdown 
             data={breakdownData} 
             totalUnique={totalUniqueCount} 
             selectedYear={selectedYear}
          />
        </div>
      </div>

      {/* Recent Activity Section */}
      <Card className="rounded-[20px] border border-gray-100 bg-white shadow-sm flex flex-col max-h-[500px]"> 
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-50 flex-shrink-0">
          <CardTitle className="text-lg font-medium text-gray-900">Recent Activity</CardTitle>
          <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
        </CardHeader>
        
        <CardContent className="pt-4 overflow-y-auto custom-scrollbar flex-1">
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Clock className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No recent activity found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start justify-between group p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border border-gray-100">
                      <AvatarFallback className={`${log.type === 'check-in' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'} font-medium text-xs`}>
                        {getInitials(log.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {log.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                          log.type === 'check-in' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-[11px] text-gray-400">at {log.event?.name || 'Unknown Event'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-900">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}