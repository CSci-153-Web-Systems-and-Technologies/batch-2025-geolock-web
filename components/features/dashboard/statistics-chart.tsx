'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

interface ChartData {
  name: string;      
  expected: number; 
  actual: number;    
}

interface StatisticsChartProps {
  data?: ChartData[];
  years: string[];
  selectedYear: string;
  selectedEvent: string | null;
  onYearChange: (year: string) => void;
  onBarClick?: (eventName: string) => void;
}

export function StatisticsChart({ 
  data = [], 
  years = [], 
  selectedYear, 
  selectedEvent, 
  onYearChange,
  onBarClick
}: StatisticsChartProps) {

  const processedData = useMemo(() => {
    if (!selectedEvent) return data;
    
    return data.map(item => {
      if (item.name === selectedEvent) return item;
      return { ...item, expected: 0, actual: 0 };
    });
  }, [data, selectedEvent]);

  // UPDATED CLICK HANDLER
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = (data: any) => {
    // 1. Did we click a valid Bar/Column?
    if (data && data.activePayload && data.activePayload.length > 0) {
      onBarClick?.(data.activePayload[0].payload.name);
      return;
    }
    // 2. Did we click a specific Bar element directly?
    if (data && data.name) {
      onBarClick?.(data.name);
      return;
    }

    // 3. WHITESPACE CLICK LOGIC:
    // If we clicked "nothing" (whitespace) AND a filter is currently active...
    if (selectedEvent) {
       // We pass the *current* selectedEvent name back to the parent.
       // The parent logic is: (clickedName === selectedEvent) ? setNull : setName
       // So this effectively toggles it OFF.
       onBarClick?.(selectedEvent);
    }
  };

  return (
    <Card className="col-span-4 bg-white border border-gray-100 shadow-sm rounded-[20px] h-full flex flex-col">
      {/* NUCLEAR CSS FIX FOR BLACK OUTLINE */}
      <style jsx global>{`
        .recharts-wrapper:focus,
        .recharts-surface:focus,
        .recharts-layer:focus {
          outline: none !important;
        }
      `}</style>

      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle className="text-base font-semibold text-gray-900">Event Statistics</CardTitle>
          <p className="text-xs text-gray-500 mt-1">
             Attendance performance per event <span className="text-blue-500 font-medium ml-1">(Click graph to filter)</span>
          </p>
        </div>
        
        {/* Year Level Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#60A5FA]"></span> Expected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span> Actual
            </span>
          </div>
          
          <select 
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="All">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      
      <CardContent className="pl-0 flex-1 min-h-[300px]">
        <div className="h-[300px] w-full">
          {processedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={processedData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }} 
                barGap={4}
                onClick={handleChartClick}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  interval={0} 
                  tickFormatter={(val) => val.length > 10 ? `${val.substring(0, 10)}...` : val}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                />
                
                <Bar
                  dataKey="expected"
                  name="Expected"
                  fill="#60A5FA" 
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  onClick={handleChartClick}
                />
                
                <Bar
                  dataKey="actual"
                  name="Actual"
                  fill="#2563EB"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  onClick={handleChartClick}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No event data available for this filter.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}