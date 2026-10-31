import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  MapPin,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  Compass,
  CheckCircle2,
  Crosshair,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';
import { attendanceService } from '../services/attendance.service';
import { todayIso, nowClock } from '../utils/punch';
import {
  evaluateGeofence,
  OFFICE_CENTROID,
} from '../utils/geofence';
import { GeofenceModal } from './GeofenceModal';

export function ExecutivePunchCard({ className = '' }) {
  const { user } = useAuth();
  const toast = useToast();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatted = useMemo(() => {
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }, [now]);

  // Executive identity (Dr. Amit Bansal = BGS/DIR-01, Dharmendra Goyal = BGS/DIR-03, Kritika Gupta = BGS/ADM-01)
  const empId = user?.employeeId || (user?.name?.includes('Amit') ? 'BGS/DIR-01' : user?.name?.includes('Dharmendra') ? 'BGS/DIR-03' : 'BGS/ADM-01');
  const empName = user?.name || (empId === 'BGS/DIR-01' ? 'Dr. Amit Kumar Bansal' : empId === 'BGS/DIR-03' ? 'Dharmendra Goyal' : 'Kritika Gupta');
  const empRole = user?.designation || (empId === 'BGS/DIR-01' ? 'Managing Director' : empId === 'BGS/DIR-03' ? 'Executive Director' : 'Super Admin');

  const [todayRecord, setTodayRecord] = useState(() =>
    storage.getAttendance().find((a) => a.employeeId === empId && a.date === todayIso())
  );
  const [isPunching, setIsPunching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Real GPS location
  const [userCoords, setUserCoords] = useState(() => ({
    latitude: OFFICE_CENTROID[0],
    longitude: OFFICE_CENTROID[1],
    accuracy: 10,
    simulated: false,
  }));
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);

  const geofence = useMemo(() => {
    return evaluateGeofence(userCoords?.latitude, userCoords?.longitude, userCoords?.accuracy || 10);
  }, [userCoords]);
  const isInsideGeofence = geofence.isInside;

  // Real GPS acquisition
  const fetchRealGps = () => {
    if (!navigator.geolocation) {
      toast.warning('Geolocation is not supported by your browser.', 'GPS Unavailable');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          simulated: false,
        });
        toast.info(
          `GPS Acquired: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} (±${Math.round(pos.coords.accuracy)}m)`,
          'Satellite Lock'
        );
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation acquisition error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchRealGps();
  }, []);

  useEffect(() => {
    if (empId) {
      setTodayRecord(storage.getAttendance().find((a) => a.employeeId === empId && a.date === todayIso()));
    }
  }, [empId]);

  const punchedIn = Boolean(todayRecord?.checkIn && todayRecord.checkIn !== '-');
  const punchedOut = Boolean(todayRecord?.checkOut && todayRecord.checkOut !== '-');
  const isClockedIn = punchedIn && !punchedOut;
  const clockInTime = punchedIn ? todayRecord.checkIn : null;
  const clockOutTime = punchedOut ? todayRecord.checkOut : null;

  const handleTogglePunch = async () => {
    if (punchedOut || isPunching) return;

    setIsPunching(true);
    try {
      const punchSource = isInsideGeofence
        ? 'Jaipur HQ Office (Geofence Verified)'
        : 'Executive Duty / Field Visit (GPS Verified)';

      const rec = await attendanceService.recordPunch(
        empId,
        isClockedIn ? 'checkOut' : 'checkIn',
        punchSource,
        userCoords
      );
      setTodayRecord(rec);
      if (isClockedIn) {
        toast.success(
          `Punched out at ${rec.checkOut}. Total hours: ${rec.workingHours}.`,
          'Attendance Recorded'
        );
      } else {
        toast.success(
          `Punched in at ${rec.checkIn}${rec.status === 'Late' ? ` (late by ${rec.lateBy})` : ''} · ${punchSource}`,
          'Attendance Marked'
        );
      }
    } catch (err) {
      toast.error(err.message, 'Punch not recorded');
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <>
      <Card className={`p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-[#121f2d] text-white border border-slate-800 shadow-md rounded-2xl relative overflow-hidden ${className}`}>
        {/* Subtle executive geometric background accent */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-10 w-44 h-44 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* 1. Identity & Role */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/30 font-bold text-base shadow-inner">
              {empName
                .replace(/^Dr\.\s*/, '')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                  {empName}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {empRole}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {empId}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <strong className="text-white tabular-nums tracking-wider">{timeFormatted}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>Shift: <strong className="text-slate-200">09:30 AM – 06:00 PM</strong> (HQ & Operations)</span>
              </div>
            </div>
          </div>

          {/* 2. Today's Punch Summary Ledger */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-800/80 backdrop-blur-md p-3 px-4 rounded-xl border border-slate-700/80 text-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Check In
              </span>
              <span className={`font-mono font-extrabold text-sm sm:text-base tabular-nums ${clockInTime ? 'text-emerald-400' : 'text-slate-500'}`}>
                {clockInTime || '—'}
              </span>
            </div>
            <div className="border-l border-slate-700/80 pl-3 sm:pl-4">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Check Out
              </span>
              <span className={`font-mono font-extrabold text-sm sm:text-base tabular-nums ${clockOutTime ? 'text-blue-400' : 'text-slate-500'}`}>
                {clockOutTime || '—'}
              </span>
            </div>
            <div className="border-l border-slate-700/80 pl-3 sm:pl-4">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Duration
              </span>
              <span className="font-mono font-extrabold text-sm sm:text-base tabular-nums text-slate-200">
                {todayRecord?.workingHours && todayRecord.workingHours !== '-'
                  ? todayRecord.workingHours
                  : isClockedIn
                    ? 'Active'
                    : '—'}
              </span>
            </div>
          </div>

          {/* 3. Location Status & Clean Executive Punch Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Geofence Status Badge */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/80 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isInsideGeofence ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div className="flex flex-col">
                <span className="font-bold text-slate-200 text-xs">
                  {isInsideGeofence ? 'Jaipur HQ (In Perimeter)' : 'Executive / Field Zone'}
                </span>
                <span className="text-[10.5px] text-slate-400">
                  {isInsideGeofence ? 'Office Geofenced ±8m' : `Jaipur Region (${Math.round(geofence.distanceMeters || 0)}m)`}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-auto sm:ml-2">
                <button
                  type="button"
                  onClick={fetchRealGps}
                  disabled={isLocating}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Detect live GPS coordinates"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-teal-400' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsGeofenceModalOpen(true)}
                  className="text-[11px] font-bold text-teal-400 hover:text-teal-300 hover:underline px-1"
                >
                  Map
                </button>
              </div>
            </div>

            {/* Executive Punch Button */}
            <Button
              variant={isClockedIn ? 'outline' : 'primary'}
              size="md"
              onClick={handleTogglePunch}
              disabled={punchedOut || isPunching}
              className={`font-bold whitespace-nowrap min-w-[170px] shadow-sm transition-all ${
                punchedOut
                  ? '!bg-slate-800 !text-slate-400 !cursor-not-allowed !border-slate-700'
                  : isClockedIn
                    ? '!border-rose-500 !bg-rose-500/10 !text-rose-400 hover:!bg-rose-500/20'
                    : '!bg-emerald-600 hover:!bg-emerald-500 !text-white !border-transparent shadow-emerald-950/50'
              }`}
              leftIcon={
                punchedOut ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isClockedIn ? (
                  <LogOut className="w-4 h-4 text-rose-400" />
                ) : (
                  <LogIn className="w-4 h-4 text-white" />
                )
              }
            >
              {punchedOut
                ? 'Punched Out Today'
                : isClockedIn
                  ? 'Punch Out Now'
                  : isInsideGeofence
                    ? 'Punch In (HQ)'
                    : 'Punch In (Executive)'}
            </Button>
          </div>
        </div>
      </Card>

      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        userCoords={userCoords}
        onCoordsChange={setUserCoords}
      />
    </>
  );
}
