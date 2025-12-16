'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Users, BarChart3, TrendingUp, Clock, CheckCircle, UserCheck, Award, Loader2, MoreHorizontal, X } from "lucide-react";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { StatisticsChart } from "@/components/features/dashboard/statistics-chart";
import { AttendeesBreakdown } from "@/components/features/dashboard/attendees-breakdown";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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

interface EventCapacity {
  name: string;
  capacity: number;
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
}

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#2563EB'];
const STANDARD_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function DashboardPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [allAttendees, setAllAttendees] = useState<ActivityLog[]>([]);
  const [eventCapacities, setEventCapacities] = useState<EventCapacity[]>([]); 
  const [metricsCounts, setMetricsCounts] = useState({ totalEvents: 0, activeEvents: 0 }); 

  // Filter State
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  
  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Get Current User (Organization)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.error("No user found");
            return;
        }

        // 2. Fetch Metrics Counts (Restricted to My Org)
        const { count: totalEvents } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', user.id); // <--- FILTER ADDED

        const { count: activeEvents } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('organization_id', user.id); // <--- FILTER ADDED
        
        setMetricsCounts({
          totalEvents: totalEvents || 0,
          activeEvents: activeEvents || 0,
        });

        // 3. Fetch Event Capacities (Restricted to My Org)
        const { data: eventsData } = await supabase
          .from('events')
          .select('name, capacity')
          .eq('organization_id', user.id); // <--- FILTER ADDED
          
        if (eventsData) {
          setEventCapacities(eventsData as EventCapacity[]);
        }

        // 4. Fetch All Attendees (RLS handles this, but explicit join helps context)
        // We fetch attendees where the *event* belongs to *me*.
        // Since we fixed the RLS, 'select * from attendees' works, but this is explicit.
        const { data, error } = await supabase
          .from('attendees')
          .select('created_at, type, faculty, year_level, name, email, id, student_id, event:events!inner(name, organization_id)') // !inner enforces the join filter if we added one
          .eq('event.organization_id', user.id) // Optional double-check
          .order('created_at', { ascending: false });

        if (error) console.error("Supabase Error:", error);
        
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAllAttendees(data.map((d: any) => ({
             ...d,
             event: { name: d.event?.name }
          })) as ActivityLog[]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Subscribe to changes
    const attendeeSub = supabase
      .channel('dashboard_attendees')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, () => fetchDashboardData())
      .subscribe();

    const eventSub = supabase
      .channel('dashboard_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(attendeeSub);
      supabase.removeChannel(eventSub);
    };
  }, [supabase]);

  // --- PROCESSED DATA (MEMOIZED) ---
  const { 
    metrics, 
    chartData, 
    breakdownData, 
    totalUniqueCount, 
    recentActivity, 
    availableYears 
  } = useMemo(() => {
    
    // --- 1. METRICS CALCULATION ---
    let metricsSource = allAttendees;
    
    if (selectedYear !== "All") {
      metricsSource = metricsSource.filter(a => a.year_level === selectedYear);
    }
    
    if (selectedEvent) {
      metricsSource = metricsSource.filter(a => a.event?.name === selectedEvent);
    }

    const uniqueAttendees = new Set(metricsSource.map(a => a.email)); 

    const completionMap = new Map<string, Set<string>>(); 
    metricsSource.forEach(log => {
      const eventName = log.event?.name || "Unknown";
      const key = `${eventName}|${log.email}`;
      if (!completionMap.has(key)) completionMap.set(key, new Set());
      completionMap.get(key)!.add(log.type);
    });

    let completedCount = 0;
    let totalParticipants = 0; 
    completionMap.forEach((types) => {
      totalParticipants++;
      if (types.has('check-in') && types.has('check-out')) {
        completedCount++;
      }
    });

    const completionRate = totalParticipants > 0 
      ? Math.round((completedCount / totalParticipants) * 100) 
      : 0;

    const calculatedMetrics: DashboardMetrics = {
      totalEvents: metricsCounts.totalEvents,
      activeEvents: metricsCounts.activeEvents,
      totalAttendees: uniqueAttendees.size,
      completionRate: `${completionRate}%`
    };


    // --- 2. CHART DATA (FIXED LOGIC) ---
    // Expected: Comes from 'eventCapacities' (Static Capacity from DB)
    // Actual: Comes from 'allAttendees' (Filtered Unique Count)
    
    const eventStats = new Map<string, { expected: number, actualSet: Set<string> }>();
    
    // Step A: Initialize all known events with their Capacity
    eventCapacities.forEach(ec => {
      if (ec.name) {
        eventStats.set(ec.name, { 
          expected: ec.capacity || 0, // USE CAPACITY HERE
          actualSet: new Set() 
        });
      }
    });

    // Step B: Fill in Actuals based on current filters
    const yearFiltered = selectedYear === "All" 
      ? allAttendees 
      : allAttendees.filter(a => a.year_level === selectedYear);

    yearFiltered.forEach(log => {
      const eventName = log.event?.name || "Unknown Event";
      // Only count if the event exists in our capacity map (or add it dynamically if needed)
      if (eventStats.has(eventName)) {
         eventStats.get(eventName)!.actualSet.add(log.email);
      } else {
         // Fallback for events found in logs but missing in event list (rare)
         eventStats.set(eventName, { expected: 0, actualSet: new Set([log.email]) });
      }
    });

    const processedChartData: ChartData[] = Array.from(eventStats.entries()).map(([name, stats]) => ({
      name, 
      expected: stats.expected, 
      actual: stats.actualSet.size 
    }));


    // --- 3. BREAKDOWN DATA ---
    const currentCounts: Record<string, number> = {};
    const uniqueBreakdownStudents = new Set<string>();

    metricsSource.forEach(a => {
        if (a.year_level) currentCounts[a.year_level] = (currentCounts[a.year_level] || 0) + 1;
        uniqueBreakdownStudents.add(a.email);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dynamicYears = Array.from(new Set(allAttendees.map((a: any) => a.year_level).filter(Boolean))).sort();
    const yearsToShow = dynamicYears.length > 0 ? dynamicYears : STANDARD_YEARS;

    const processedBreakdown: BreakdownData[] = yearsToShow.map((year, index) => ({
      name: year,
      value: currentCounts[year] || 0,
      color: COLORS[index % COLORS.length]
    }));


    // --- 4. RECENT ACTIVITY ---
    const processedRecent = allAttendees.slice(0, 20); 

    return {
        metrics: calculatedMetrics,
        chartData: processedChartData,
        breakdownData: processedBreakdown,
        totalUniqueCount: uniqueBreakdownStudents.size, 
        recentActivity: processedRecent,
        availableYears: yearsToShow
    };

  }, [allAttendees, eventCapacities, metricsCounts, selectedYear, selectedEvent]);

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
        <StatCard 
          title="Total Attendees" 
          value={metrics.totalAttendees.toString()} 
          subtitle={selectedYear !== "All" ? `${selectedYear} Participants` : (selectedEvent ? "For selected event" : "Unique Participants")} 
          icon={Users} 
          subtitleIcon={UserCheck} 
          iconBgColor="bg-orange-100" 
          iconColor="text-orange-600" 
        />
        <StatCard 
          title="Completion Rate" 
          value={metrics.completionRate} 
          subtitle={selectedYear !== "All" ? `For ${selectedYear}` : "Check-in & Out"} 
          icon={BarChart3} 
          subtitleIcon={Award} 
          iconBgColor="bg-yellow-100" 
          iconColor="text-yellow-600" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          {selectedEvent && (
            <div className="absolute top-4 left-4 z-10 animate-in fade-in zoom-in duration-300">
               <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setSelectedEvent(null)}
                className="text-xs h-7 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
               >
                 Filtering: {selectedEvent} <X className="w-3 h-3 ml-1" />
               </Button>
            </div>
          )}
          <StatisticsChart 
            data={chartData} 
            years={availableYears} 
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            selectedEvent={selectedEvent}
            onBarClick={(eventName: string) => setSelectedEvent(eventName === selectedEvent ? null : eventName)}
          /> 
        </div>
        <div>
          <AttendeesBreakdown 
             data={breakdownData} 
             totalUnique={totalUniqueCount} 
             selectedYear={selectedYear}
             title={selectedEvent ? "Event Attendees" : "Total Attendees"}
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