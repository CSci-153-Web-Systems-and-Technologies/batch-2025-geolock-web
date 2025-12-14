'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, QrCode, Download, Users, MapPin, Calendar, 
  Clock, Copy, LogIn, LogOut, RefreshCw, Power // ADDED RefreshCw & Power
} from 'lucide-react';
import { toast } from 'sonner';

export interface DetailedEvent {
  id: string | number;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  geofenceRadius: number;
  attendeeCount: number;
  capacity: number;
  status: 'upcoming' | 'active' | 'completed';
  qrCode: string;
  checkoutQrCode: string;
  eventCode: string;
}

interface Attendee {
  id: string;
  name: string;
  email: string;
  student_id: string;
  faculty: string;
  program: string;
  check_in_time: string;
  check_out_time?: string;
  type: 'check-in' | 'check-out';
  year_level: string; // Add this
}

interface EventDetailsProps {
  event: DetailedEvent;
  onBack: () => void;
  onUpdateEvent: (event: DetailedEvent) => void;
}

export default function EventDetails({ event, onBack, onUpdateEvent }: EventDetailsProps) {
  const [supabase] = useState(() => createClient());
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalEntries = attendees.length;
  const uniqueCheckIns = attendees.filter(a => a.type === 'check-in').length;
  const uniqueCheckOuts = attendees.filter(a => a.type === 'check-out').length;
  const currentlyPresent = uniqueCheckIns - uniqueCheckOuts;

  const fetchAttendees = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setAttendees(data as Attendee[]);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast.error('Could not load attendance data');
    } finally {
      setIsRefreshing(false);
    }
  }, [event.id, supabase]);

  useEffect(() => {
    fetchAttendees();
    const channel = supabase
      .channel(`event_attendees_${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees', filter: `event_id=eq.${event.id}` }, 
      () => { fetchAttendees(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [event.id, fetchAttendees, supabase]);

  const getStatusColor = (status: DetailedEvent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // --- TOGGLE EVENT STATUS ---
  const toggleEventStatus = async () => {
    const newStatus = event.status === 'active' ? 'completed' : 'active';
    try {
        const { error } = await supabase
            .from('events')
            .update({ status: newStatus })
            .eq('id', event.id);
        
        if(error) throw error;
        onUpdateEvent({ ...event, status: newStatus });
        toast.success(newStatus === 'active' ? 'Event Activated' : 'Event Deactivated');
    } catch (err) {
        console.error(err);
        toast.error("Failed to update status");
    }
  };

  const copyQRLink = (type: 'checkin' | 'checkout') => {
    const baseUrl = window.location.origin;
    const typeParam = type === 'checkin' ? 'check-in' : 'check-out';
    const attendeeLink = `${baseUrl}/attend/${event.id}?type=${typeParam}`;
    navigator.clipboard.writeText(attendeeLink);
    toast.success('Link copied!');
  };

  const copyEventCode = () => {
    navigator.clipboard.writeText(event.eventCode);
    toast.success('Event code copied!');
  };

  const downloadQR = async (type: 'checkin' | 'checkout') => {
    const qrUrl = type === 'checkin' ? event.qrCode : event.checkoutQrCode;
    try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.name}-${type}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("QR Code downloaded");
    } catch (e) {
        console.error(e);
        toast.error("Failed to download QR");
    }
  };

  const exportAttendance = () => {
    const csvContent = [
      ['Name', 'Email', 'Student ID', 'Faculty', 'Program', 'Year Level', 'Type', 'Time'],
      ...attendees.map(a => [
        `"${a.name}"`, 
        a.email, 
        a.student_id, 
        `"${a.faculty}"`, 
        `"${a.program}"`, 
        a.year_level, // Add this
        a.type,
        new Date(a.check_in_time).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name}-attendance.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                <Badge variant="secondary" className={`${getStatusColor(event.status)} text-white hover:${getStatusColor(event.status)}`}>
                  {event.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4 max-w-2xl">{event.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{event.date}</div>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{event.time}</div>
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</div>
                <div className="flex items-center gap-1"><Users className="w-4 h-4" />{event.geofenceRadius}m radius</div>
              </div>
            </div>
            
            {/* ACTIVATION BUTTON */}
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleEventStatus}
                className={event.status === 'active' 
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700" 
                  : "bg-blue-600 text-white hover:bg-blue-700"}
              >
                <Power className="w-4 h-4 mr-2" />
                {event.status === 'active' ? 'Deactivate Event' : 'Activate Event'}
              </Button>
            </div>
          </div>
        </div>

        {/* LIGHTER STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
              <LogIn className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalEntries}</div>
              <p className="text-xs text-gray-500">Check-ins + Check-outs</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unique Check-ins</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{uniqueCheckIns}</div>
              <p className="text-xs text-gray-500">Unique attendees</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Checked Out</CardTitle>
              <LogOut className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{uniqueCheckOuts}</div>
              <p className="text-xs text-gray-500">Completed attendance</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Present Now</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{currentlyPresent}</div>
              <p className="text-xs text-gray-500">Active on site</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="qr" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="qr">QR Codes</TabsTrigger>
            <TabsTrigger value="attendance">Live Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="qr">
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5 text-blue-600" />Event Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-lg p-6 border-2 border-dashed border-blue-300 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Event Access Code</p>
                    <div className="text-3xl font-bold tracking-widest text-blue-600 font-mono">{event.eventCode}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyEventCode}><Copy className="w-4 h-4 mr-2" />Copy Code</Button>
                </div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><LogIn className="w-5 h-5 text-green-500" />Check-in QR Code</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 flex justify-center">
                      <Image src={event.qrCode} alt="Check-in QR" width={200} height={200} unoptimized />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => downloadQR('checkin')}><Download className="w-4 h-4 mr-2" />Download</Button>
                      <Button variant="outline" size="sm" onClick={() => copyQRLink('checkin')}><Copy className="w-4 h-4 mr-2" />Link</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><LogOut className="w-5 h-5 text-blue-500" />Check-out QR Code</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 flex justify-center">
                       <Image src={event.checkoutQrCode} alt="Check-out QR" width={200} height={200} unoptimized />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => downloadQR('checkout')}><Download className="w-4 h-4 mr-2" />Download</Button>
                      <Button variant="outline" size="sm" onClick={() => copyQRLink('checkout')}><Copy className="w-4 h-4 mr-2" />Link</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Live Attendance</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchAttendees} disabled={isRefreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportAttendance}>
                      <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {attendees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No attendees yet</div>
                ) : (
                  <div className="space-y-2">
                    {attendees.map((attendee) => (
                      <div key={attendee.id} className="flex justify-between p-3 border rounded-lg hover:bg-slate-50">
                        <div>
                          <div className="font-medium">{attendee.name}</div>
                          <div className="text-xs text-muted-foreground">{attendee.email}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div className={`font-bold ${attendee.type === 'check-in' ? 'text-green-600' : 'text-blue-600'}`}>{attendee.type.toUpperCase()}</div>
                          <div>{new Date(attendee.check_in_time).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}