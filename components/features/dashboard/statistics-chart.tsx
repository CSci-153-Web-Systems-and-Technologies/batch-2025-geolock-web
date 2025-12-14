'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  name: string;      // Event Name
  expected: number;  // Total Registered
  actual: number;    // Checked In
}

interface StatisticsChartProps {
  data?: ChartData[];
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export function StatisticsChart({ 
  data = [], 
  years = [], 
  selectedYear, 
  onYearChange 
}: StatisticsChartProps) {
  return (
    <Card className="col-span-4 bg-white border border-gray-100 shadow-sm rounded-[20px] h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle className="text-base font-semibold text-gray-900">Event Statistics</CardTitle>
          <p className="text-xs text-gray-500 mt-1">Attendance performance per event</p>
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
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barGap={4}>
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
                {/* Expected Attendees - Increased barSize to 32 */}
                <Bar
                  dataKey="expected"
                  name="Expected"
                  fill="#60A5FA" 
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
                {/* Actual Attendees - Increased barSize to 32 */}
                <Bar
                  dataKey="actual"
                  name="Actual"
                  fill="#2563EB"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
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