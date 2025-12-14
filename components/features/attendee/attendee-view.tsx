'use client';

import React, { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import jsQR from 'jsqr';
import { 
  MapPin, Calendar, Clock, Check, Loader2, Search, QrCode, 
  Keyboard, AlertCircle, LogIn, LogOut, User, Hash, School, BookOpen,
  GraduationCap 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// --- TYPES ---
type Step = 'scanner' | 'geofence' | 'form' | 'success' | 'error';
type AttendanceType = 'check-in' | 'check-out';

interface EventData {
  id: string;
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  date: string;
}

interface AttendeeRecord {
  id: string;
  name: string;
  email: string;
  student_id: string;
  faculty: string;
  program: string;
  year_level: string;
}

interface AttendeeViewProps {
  eventId?: string;
  initialType?: 'check-in' | 'check-out';
}

const YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year"
];

// --- DATA MAPPING ---
const FACULTY_PROGRAMS: Record<string, string[]> = {
  "Faculty of Agriculture and Food Sciences": [
    "Bachelor of Science in Agriculture",
    "Bachelor of Science in Development Communication",
    "Bachelor of Science in Food Technology"
  ],
  "Faculty of Humanities and Social Sciences": [
    "Bachelor of Arts in English Language Studies",
    "Bachelor of Arts in Philosophy"
  ],
  "Faculty of Natural and Mathematical Sciences": [
    "Bachelor of Science in Applied Physics",
    "Bachelor of Science in Biology",
    "Bachelor of Science in Biotechnology",
    "Bachelor of Science in Chemistry",
    "Bachelor of Science in Marine Biology",
    "Bachelor of Science in Mathematics",
    "Bachelor of Science in Statistics"
  ],
  "Faculty of Computing": [
    "Bachelor of Science in Computer Science"
  ],
  "Faculty of Teacher Education": [
    "Bachelor of Culture and Arts Education",
    "Bachelor of Early Childhood Education",
    "Bachelor of Elementary Education",
    "Bachelor of Physical Education",
    "Bachelor of Secondary Education"
  ],
  "Faculty of Engineering": [
    "Bachelor of Science in Agricultural and Biosystems Engineering",
    "Bachelor of Science in Civil Engineering",
    "Bachelor of Science in Geodetic Engineering",
    "Bachelor of Science in Mechanical Engineering",
    "Bachelor of Science in Meteorology"
  ],
  "Faculty of Forestry and Environmental Sciences": [
    "Bachelor of Science in Environmental Science",
    "Bachelor of Science in Forestry"
  ],
  "Faculty of Management and Economics": [
    "Bachelor of Science in Agribusiness",
    "Bachelor of Science in Economics",
    "Bachelor of Science in Hospitality Management",
    "Bachelor of Science in Tourism Management"
  ],
  "Faculty of Nursing": [
    "Bachelor of Science in Nursing"
  ],
  "Faculty of Veterinary Medicine": [
    "Doctor of Veterinary Medicine"
  ]
};

// --- HELPER: DISTANCE CALCULATION ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; 
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// --- LAYOUT WRAPPER ---
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-[100dvh] w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
    <div className="text-center mb-8 w-full max-w-md">
      <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">Geolocked Attendance System</h1>
      <p className="text-gray-500 text-sm md:text-base">Secure attendance tracking with location verification</p>
    </div>
    <Card className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-0 relative">
      <div className="p-6 md:p-8">
        {children}
      </div>
    </Card>
  </div>
);

// --- MAIN COMPONENT ---
export default function AttendeeView({ eventId, initialType = 'check-in' }: AttendeeViewProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState<Step>(eventId ? 'geofence' : 'scanner');
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(initialType);
  const [deviceId, setDeviceId] = useState<string>('');
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string>('');
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(0);
  
  // Scanner States
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    faculty: '',
    program: '',
    yearLevel: '',
  });
  
  const [suggestions, setSuggestions] = useState<AttendeeRecord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // 1. INITIALIZE DEVICE ID
  useEffect(() => {
    let id = localStorage.getItem('geolock_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('geolock_device_id', id);
    }
    setDeviceId(id);
  }, []);

  // 2. CHECK-OUT AUTO-FILL LOGIC
  useEffect(() => {
    async function checkPreviousSession() {
      if (attendanceType === 'check-out' && eventData && deviceId) {
        const { data } = await supabase
          .from('attendees')
          .select('*')
          .eq('event_id', eventData.id)
          .eq('device_id', deviceId)
          .eq('type', 'check-in')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          const record = data as AttendeeRecord;
          setFormData({
            name: record.name,
            email: record.email,
            studentId: record.student_id,
            faculty: record.faculty,
            program: record.program,
            yearLevel: record.year_level || '' 
          });
          setIsAutoFilled(true);
          toast.success("Welcome back! Your details have been auto-filled.");
        }
      } else if (attendanceType === 'check-in') {
        setIsAutoFilled(false);
        setFormData({ name: '', email: '', studentId: '', faculty: '', program: '', yearLevel: '' });
      }
    }
    checkPreviousSession();
  }, [attendanceType, eventData, deviceId, supabase]);

  // 3. AUTOCOMPLETE LOGIC
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (attendanceType === 'check-out' && formData.name.length > 2 && eventData && !isAutoFilled) {
        const { data } = await supabase
          .from('attendees')
          .select('*')
          .eq('event_id', eventData.id)
          .eq('type', 'check-in')
          .ilike('name', `%${formData.name}%`)
          .limit(3);
        
        if (data) setSuggestions(data as AttendeeRecord[]);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [formData.name, attendanceType, eventData, supabase, isAutoFilled]);

  const handleSelectSuggestion = (record: AttendeeRecord) => {
    setFormData({
      name: record.name,
      email: record.email,
      studentId: record.student_id,
      faculty: record.faculty,
      program: record.program,
      yearLevel: record.year_level || ''
    });
    setShowSuggestions(false);
  };

  // 4. HELPERS
  const handleCheckLocation = useCallback((targetLat: number, targetLng: number, radius: number) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setStep('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ latitude: userLat, longitude: userLng });

        const dist = calculateDistance(userLat, userLng, targetLat, targetLng);
        setDistance(dist);
        
        if (dist <= radius + 20) {
          setIsWithinGeofence(true);
          setTimeout(() => setStep('form'), 2000); 
        } else {
          setError(`You are ${Math.round(dist)}m away. You must be within ${radius}m to ${attendanceType}.`);
          setStep('error');
        }
      },
      (err) => {
        console.error(err);
        setError('Location access denied. Please enable GPS.');
        setStep('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [attendanceType]);

  const fetchEventData = useCallback(async (code: string) => {
    try {
      let query = supabase.from('events').select('*');
      if (isUUID(code)) {
         query = query.or(`id.eq.${code},event_code.eq.${code}`);
      } else {
         query = query.eq('event_code', code);
      }
      const { data, error } = await query.single();

      if (error || !data) {
        setError('Event not found.');
        setStep('error');
        return;
      }
      
      if (data.status !== 'active') {
        setError('Sorry, the event attendance is already closed or not yet started.');
        setStep('error');
        return;
      }

      setEventData({
        id: data.id,
        title: data.name,
        location: data.location_address || 'Unknown',
        latitude: data.location_lat,
        longitude: data.location_lng,
        radius: data.geofence_radius,
        date: `${data.date} at ${data.time}`
      });

      setStep('geofence');
      handleCheckLocation(data.location_lat, data.location_lng, data.geofence_radius);
    } catch (err) {
      console.error(err);
      setError('System error. Please try again.');
      setStep('error');
    }
  }, [supabase, handleCheckLocation]);

  // 5. FETCH EVENT ON MOUNT
  useEffect(() => {
    if (eventId) fetchEventData(eventId);
  }, [eventId, fetchEventData]);

  // 6. PROCESS CODE
  const handleProcessCode = async (code: string) => {
    const cleanCode = code.trim();
    if (cleanCode.includes('/attend/')) {
        try {
            const parts = cleanCode.split('/attend/');
            if (parts.length > 1) {
                let idPart = parts[1];
                if (idPart.includes('?')) idPart = idPart.split('?')[0];
                if (isUUID(idPart)) {
                    router.push(`/attend/${idPart}?type=${attendanceType}`);
                    return;
                }
            }
        } catch (e) { console.error("URL Parsing error", e); }
    }
    if (isUUID(cleanCode)) {
        router.push(`/attend/${cleanCode}?type=${attendanceType}`);
        return;
    }
    if (!eventId) {
      setIsScanning(false);
      try {
        let query = supabase.from('events').select('id');
        if (isUUID(cleanCode)) {
           query = query.or(`id.eq.${cleanCode},event_code.eq.${cleanCode}`);
        } else {
           query = query.eq('event_code', cleanCode);
        }
        const { data, error } = await query.single();

        if (error || !data) {
          setError('Invalid QR Code. Event not found.');
          setIsScanning(false);
          return;
        }
        router.push(`/attend/${data.id}?type=${attendanceType}`);
      } catch (err) {
        console.error(err);
        setError('Connection error. Please try again.');
        setIsScanning(false);
      }
      return;
    }
    fetchEventData(cleanCode);
  };

  // 7. CAMERA & SCANNING
  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

        if (code) {
          setIsScanning(false);
          handleProcessCode(code.data);
          if (stream) stream.getTracks().forEach(track => track.stop());
          return; 
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    if (isScanning) {
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.play();
            animationFrameId = requestAnimationFrame(scanFrame);
          }
        } catch (err) {
          console.error("Camera error:", err);
          setError("Could not access camera. Ensure you are on HTTPS or localhost.");
          setIsScanning(false);
        }
      };
      startCamera();
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  // 8. SUBMIT HANDLER
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventData || !userLocation || !deviceId) return;
    setIsSubmitting(true);

    try {
      if (attendanceType === 'check-in') {
        const { data: existing } = await supabase
          .from('attendees')
          .select('id')
          .eq('event_id', eventData.id)
          .eq('type', 'check-in')
          .or(`student_id.eq.${formData.studentId},device_id.eq.${deviceId}`)
          .maybeSingle();
        if (existing) throw new Error("You (or this device) have already checked in.");
      }

      if (attendanceType === 'check-out') {
         const { data: existing } = await supabase
          .from('attendees')
          .select('id')
          .eq('event_id', eventData.id)
          .eq('student_id', formData.studentId)
          .eq('type', 'check-out')
          .maybeSingle();
         if (existing) throw new Error("You have already checked out.");
      }

      const { error: insertError } = await supabase.from('attendees').insert({
        event_id: eventData.id,
        device_id: deviceId,
        name: formData.name,
        email: formData.email,
        student_id: formData.studentId,
        faculty: formData.faculty,
        program: formData.program,
        year_level: formData.yearLevel,
        type: attendanceType,
        check_in_time: new Date().toISOString(),
        location_lat: userLocation.latitude,
        location_lng: userLocation.longitude
      });

      if (insertError) throw new Error(insertError.message);
      setStep('success');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to save attendance.';
      setError(msg);
      setStep('error'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => router.push('/scan');

  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, faculty: e.target.value, program: '' }));
  };

  // --- VIEWS ---

  if (step === 'scanner') {
    if (isScanning) {
        return (
          <LayoutWrapper>
            <div className="flex flex-col items-center text-center relative h-[400px]">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan QR Code</h2>
              <div className="relative w-full flex-1 bg-black rounded-xl overflow-hidden mb-4">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-sm"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-sm"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-sm"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-sm"></div>
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-[scan_2s_infinite]"></div>
                  </div>
                </div>
                <div className="absolute bottom-6 left-0 right-0 text-white text-xs px-4">Align QR code within frame</div>
              </div>
              <Button variant="ghost" onClick={() => setIsScanning(false)} className="text-gray-500 hover:text-gray-900">Cancel</Button>
            </div>
          </LayoutWrapper>
        );
    }
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6"><QrCode className="w-10 h-10 text-blue-600" /></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Scan Event QR Code</h2>
          <p className="text-gray-500 text-sm mb-8 px-4 leading-relaxed">Scan the QR code displayed at the event venue to record your attendance</p>
          <div className="w-full bg-gray-50 p-1.5 rounded-xl mb-6 border border-gray-100">
            <p className="text-left text-xs font-semibold text-gray-500 mb-2 px-2">Select Action:</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAttendanceType('check-in')} className={`flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition-all border ${attendanceType === 'check-in' ? 'bg-white text-green-600 border-green-200 shadow-sm' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}><LogIn className="w-4 h-4" /> Check In</button>
              <button onClick={() => setAttendanceType('check-out')} className={`flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition-all border ${attendanceType === 'check-out' ? 'bg-white text-orange-600 border-orange-200 shadow-sm' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}><LogOut className="w-4 h-4" /> Check Out</button>
            </div>
          </div>
          {!showManual ? (
            <div className="w-full space-y-4">
              <Button onClick={() => setIsScanning(true)} className="w-full h-12 bg-[#00B050] hover:bg-[#009040] text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-100"><QrCode className="w-5 h-5" /> Scan a QR Code</Button>
              <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-200"></div><span className="flex-shrink-0 mx-4 text-gray-300 text-xs uppercase font-medium">or</span><div className="flex-grow border-t border-gray-200"></div></div>
              <Button onClick={() => setShowManual(true)} variant="outline" className="w-full h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm flex items-center justify-center gap-2"><Keyboard className="w-5 h-5" /> Enter Code Manually</Button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if(manualCode) handleProcessCode(manualCode); }} className="w-full space-y-4 animate-in slide-in-from-bottom-4">
              <div className="text-left"><Label className="text-gray-700 mb-1.5 block text-sm font-medium">Event Code</Label><Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="uppercase h-12 bg-white border-gray-200 rounded-xl focus:ring-blue-500 text-black text-lg tracking-wide text-center" autoFocus /></div>
              <div className="flex gap-3 pt-2"><Button variant="outline" onClick={() => setShowManual(false)} className="flex-1 h-12 rounded-xl border-gray-200 font-medium">Cancel</Button><Button type="submit" disabled={!manualCode} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-100">Next</Button></div>
            </form>
          )}
        </div>
      </LayoutWrapper>
    );
  }

  if (step === 'geofence') {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center text-center pt-4">
          <h2 className="text-lg font-medium text-gray-900 mb-8">{eventData?.title}</h2>
          <div className="relative mb-6">
            {isWithinGeofence ? (
              <div className="w-24 h-24 bg-[#E8F5E9] rounded-full flex items-center justify-center animate-in zoom-in duration-300"><Check className="w-10 h-10 text-[#2E7D32] stroke-[3]" /></div>
            ) : (
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center relative"><div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-20"></div><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
            )}
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isWithinGeofence ? 'text-[#2E7D32]' : 'text-gray-900'}`}>{isWithinGeofence ? 'Location Verified' : 'Verifying Location...'}</h3>
          <p className="text-gray-500 text-sm mb-8">{isWithinGeofence ? `You are within ${Math.round(distance)}m of the event venue` : 'Please wait while we verify your location'}</p>
          <div className="w-full mb-8"><Progress value={isWithinGeofence ? 100 : 45} className="h-2 bg-blue-100 [&>div]:bg-blue-600" /></div>
          <div className="w-full bg-[#E3F2FD] border border-[#BBDEFB] rounded-xl p-4 flex items-start gap-3 text-left"><MapPin className="w-5 h-5 text-[#1976D2] mt-0.5 flex-shrink-0" /><div><p className="text-[#1565C0] font-medium text-sm mb-1">Location Requirements</p><p className="text-[#1976D2] text-xs leading-relaxed">You must be within {eventData?.radius} meters of the event venue to record attendance.</p></div></div>
        </div>
      </LayoutWrapper>
    );
  }

  if (step === 'form' && eventData) {
    const isCheckOut = attendanceType === 'check-out';
    const headerBg = isCheckOut ? 'bg-[#FFF3E0]' : 'bg-[#E8F5E9]';
    const iconColor = isCheckOut ? 'text-[#EF6C00]' : 'text-[#2E7D32]';
    const headerText = isCheckOut ? 'text-[#E65100]' : 'text-[#1B5E20]';
    const btnBg = isCheckOut ? 'bg-[#EF6C00] hover:bg-[#E65100]' : 'bg-[#00B050] hover:bg-[#009040]';

    return (
      <LayoutWrapper>
        <div className={`${headerBg} rounded-2xl p-5 mb-6 transition-colors`}>
          <div className="flex items-center gap-3 mb-3">
             <div className="flex-shrink-0">{isCheckOut ? <Clock className={`w-5 h-5 ${iconColor}`} /> : <Check className={`w-5 h-5 ${iconColor}`} />} </div>
             <h2 className={`${headerText} font-semibold text-lg`}>{isCheckOut ? `Check Out: ${eventData.title}` : `Check In: ${eventData.title}`}</h2>
          </div>
          <div className="flex flex-col gap-2 pl-1">
            <div className={`flex items-center gap-2 text-sm ${isCheckOut ? 'text-orange-800' : 'text-green-800'}`}><MapPin className="w-4 h-4 opacity-75" /><span className="truncate font-medium">{eventData.location}</span></div>
            <div className={`flex items-center gap-2 text-sm ${isCheckOut ? 'text-orange-800' : 'text-green-800'}`}><Calendar className="w-4 h-4 opacity-75" /><span className="font-medium">{eventData.date}</span></div>
          </div>
        </div>

        {isAutoFilled && isCheckOut && (
           <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-xl mb-4 border border-blue-100 flex gap-2"><Check className="w-4 h-4" /><span>Details auto-filled from your check-in.</span></div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NAME */}
          <div className="space-y-1.5 relative"><Label className="text-gray-900 font-bold text-sm">Full Name <span className="text-red-500">*</span></Label><div className="relative"><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Juan Dela Cruz" className="bg-[#F3F4F6] border-transparent h-12 pl-10 rounded-lg focus:bg-white focus:border-blue-500 text-black" autoComplete="off" readOnly={isAutoFilled} /><User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" /></div>
            {showSuggestions && suggestions.length > 0 && (<div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 overflow-hidden"><div className="bg-gray-50 p-2 text-xs text-gray-500">Found Check-in:</div>{suggestions.map((record) => (<button key={record.id} type="button" onClick={() => handleSelectSuggestion(record)} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-2"><Search className="w-4 h-4 text-gray-400" /><span>{record.name}</span></button>))}</div>)}
          </div>
          {/* EMAIL */}
          <div className="space-y-1.5 relative"><Label className="text-gray-900 font-bold text-sm">Email Address <span className="text-red-500">*</span></Label><div className="relative"><Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="juan@example.com" className="bg-[#F3F4F6] border-transparent h-12 pl-10 rounded-lg" readOnly={isAutoFilled} /><Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" /></div></div>
          {/* ID */}
          <div className="space-y-1.5 relative"><Label className="text-gray-900 font-bold text-sm">Student ID <span className="text-red-500">*</span></Label><div className="relative"><Input required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} placeholder="20-1-0001" className="bg-[#F3F4F6] border-transparent h-12 pl-10 rounded-lg" readOnly={isAutoFilled} /><Hash className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" /></div></div>
          
          {/* FACULTY */}
          <div className="space-y-1.5 relative"><Label className="text-gray-900 font-bold text-sm">Faculty <span className="text-red-500">*</span></Label><div className="relative"><select required value={formData.faculty} onChange={handleFacultyChange} disabled={isAutoFilled} className="w-full bg-[#F3F4F6] border-transparent h-12 pl-10 pr-4 rounded-lg focus:bg-white focus:ring-2 text-black appearance-none"><option value="" disabled>Select Faculty</option>{Object.keys(FACULTY_PROGRAMS).map(f => <option key={f} value={f}>{f}</option>)}</select><School className="w-5 h-5 text-gray-400 absolute left-3 top-3.5 pointer-events-none" /></div></div>
          
          {/* PROGRAM */}
          <div className="space-y-1.5 relative"><Label className="text-gray-900 font-bold text-sm">Program <span className="text-red-500">*</span></Label><div className="relative"><select required value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} disabled={isAutoFilled || !formData.faculty} className="w-full bg-[#F3F4F6] border-transparent h-12 pl-10 pr-4 rounded-lg focus:bg-white focus:ring-2 text-black appearance-none disabled:opacity-50"><option value="" disabled>Select Program</option>{formData.faculty && FACULTY_PROGRAMS[formData.faculty]?.map(p => <option key={p} value={p}>{p}</option>)}</select><BookOpen className="w-5 h-5 text-gray-400 absolute left-3 top-3.5 pointer-events-none" /></div></div>

          {/* YEAR LEVEL */}
          <div className="space-y-1.5 relative"><Label className="text-gray-900 font-bold text-sm">Year Level <span className="text-red-500">*</span></Label><div className="relative"><select required value={formData.yearLevel} onChange={e => setFormData({...formData, yearLevel: e.target.value})} disabled={isAutoFilled} className="w-full bg-[#F3F4F6] border-transparent h-12 pl-10 pr-4 rounded-lg focus:bg-white focus:ring-2 text-black appearance-none"><option value="" disabled>Select Year Level</option>{YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}</select><GraduationCap className="w-5 h-5 text-gray-400 absolute left-3 top-3.5 pointer-events-none" /></div></div>

          <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-4 flex items-start gap-3 mt-6"><Clock className="w-5 h-5 text-[#F57C00] flex-shrink-0 mt-0.5" /><p className="text-xs text-[#E65100] leading-relaxed font-medium">This device will be marked as submitted. You cannot submit {attendanceType} again for this event from this device.</p></div>
          <div className="flex gap-4 pt-4"><Button type="button" variant="outline" onClick={handleExit} className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 font-medium hover:bg-gray-50">Cancel</Button><Button type="submit" disabled={isSubmitting} className={`flex-1 h-12 rounded-xl text-white font-medium shadow-lg ${btnBg}`}>{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isCheckOut ? 'Submit Check Out' : 'Submit Check In')}</Button></div>
        </form>
      </LayoutWrapper>
    );
  }

  if (step === 'success') {
    const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateString = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center text-center"><div className="w-24 h-24 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-6"><Check className="w-10 h-10 text-[#2E7D32] stroke-[3]" /></div><h2 className="text-lg font-semibold text-green-600 mb-2">Attendance Recorded</h2><p className="text-gray-500 text-sm mb-8">Your attendance has been successfully recorded for:</p><div className="w-full space-y-3"><div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl p-4 text-left"><p className="text-[#1B5E20] font-medium text-sm mb-1">{eventData?.title}</p><div className="flex items-center gap-2 text-xs text-[#2E7D32]"><Calendar className="w-3.5 h-3.5" /><span>Recorded on {dateString} at {timeString}</span></div></div><div className="bg-[#E3F2FD] border border-[#BBDEFB] rounded-xl p-4 text-left flex items-start gap-3"><div className="w-1.5 h-1.5 bg-[#1976D2] rounded-full mt-1.5 flex-shrink-0"></div><p className="text-xs text-[#0D47A1] font-medium">Your attendance has been saved to the system</p></div><div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-xl p-4 text-left flex items-start gap-3"><div className="w-1.5 h-1.5 bg-[#F57C00] rounded-full mt-1.5 flex-shrink-0"></div><p className="text-xs text-[#E65100] font-medium">This device cannot submit attendance again for this event</p></div><div className="bg-[#F3E5F5] border border-[#E1BEE7] rounded-xl p-4 text-left flex items-start gap-3"><div className="w-1.5 h-1.5 bg-[#9C27B0] rounded-full mt-1.5 flex-shrink-0"></div><p className="text-xs text-[#4A148C] font-medium">You may close this page or scan another event&apos;s QR code</p></div></div><Button onClick={handleExit} className="w-full h-11 bg-[#0066FF] hover:bg-blue-700 text-white font-medium rounded-lg mt-8 shadow-md">Scan Another QR Code</Button></div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="flex flex-col items-center text-center py-8"><div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6"><AlertCircle className="w-10 h-10 text-red-500" /></div><h2 className="text-xl font-bold text-red-600 mb-2">Action Failed</h2><p className="text-gray-600 mb-8 bg-red-50 p-4 rounded-xl text-sm w-full border border-red-100">{error}</p><Button onClick={handleExit} variant="outline" className="w-full h-12 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl">Try Again</Button></div>
    </LayoutWrapper>
  );
}