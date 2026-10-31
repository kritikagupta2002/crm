import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  Crosshair,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';
import { attendanceService } from '../services/attendance.service';
import { todayIso } from '../utils/punch';
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

  const empId = user?.employeeId || (user?.name?.includes('Amit') ? 'BGS/DIR-01' : user?.name?.includes('Dharmendra') ? 'BGS/DIR-03' : 'BGS/ADM-01');
  const empName = user?.name || (empId === 'BGS/DIR-01' ? 'Dr. Amit Kumar Bansal' : empId === 'BGS/DIR-03' ? 'Dharmendra Goyal' : 'Kritika Gupta');
  const empRole = user?.designation || (empId === 'BGS/DIR-01' ? 'Managing Director' : empId === 'BGS/DIR-03' ? 'Executive Director' : 'Super Admin');

  const initials = empName
    .replace(/^Dr\.\s*/, '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const [todayRecord, setTodayRecord] = useState(() =>
    storage.getAttendance().find((a) => a.employeeId === empId && a.date === todayIso())
  );
  const [isPunching, setIsPunching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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
          `GPS lock: ±${Math.round(pos.coords.accuracy)}m`,
          'Satellite Fix'
        );
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => { fetchRealGps(); }, []);

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
        toast.success(`Punched out at ${rec.checkOut}. Total: ${rec.workingHours}.`, 'Attendance Recorded');
      } else {
        toast.success(`Punched in at ${rec.checkIn}${rec.status === 'Late' ? ` (late by ${rec.lateBy})` : ''}.`, 'Attendance Marked');
      }
    } catch (err) {
      toast.error(err.message, 'Punch failed');
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <>
      {/* Plain div instead of <Card> to avoid .card CSS overriding the dark gradient background */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border border-slate-700/80 shadow-lg relative overflow-hidden ${className}`}
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #131e2d 50%, #162032 100%)',
          color: '#fff',
        }}
      >
        {/* Subtle background accents */}
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)' }} />
        <div className="absolute left-1/4 -bottom-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-5">

          {/* ── 1. Identity ── */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-base font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.06) 100%)',
                border: '1px solid rgba(20,184,166,0.3)',
                color: '#5eead4',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-lg tracking-tight truncate" style={{ color: '#fff' }}>
                  {empName}
                </span>
                <span
                  className="text-[11px] px-2.5 py-0.5 rounded-full font-bold shrink-0"
                  style={{
                    background: 'rgba(20,184,166,0.15)',
                    color: '#5eead4',
                    border: '1px solid rgba(20,184,166,0.3)',
                  }}
                >
                  {empRole}
                </span>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0"
                  style={{
                    background: 'rgba(30,41,59,0.9)',
                    color: '#94a3b8',
                    border: '1px solid rgba(51,65,85,0.8)',
                  }}
                >
                  {empId}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap" style={{ color: '#94a3b8', fontSize: '12px' }}>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" style={{ color: '#2dd4bf' }} />
                  <strong className="tabular-nums tracking-wider" style={{ color: '#fff' }}>{timeFormatted}</strong>
                </span>
                <span style={{ color: '#334155' }}>•</span>
                <span>Shift: <strong style={{ color: '#e2e8f0' }}>09:30 AM – 06:00 PM</strong></span>
              </div>
            </div>
          </div>

          {/* ── 2. Check In / Check Out / Duration Ledger ── */}
          <div
            className="grid grid-cols-3 rounded-xl text-xs shrink-0"
            style={{
              background: 'rgba(30,41,59,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(51,65,85,0.6)',
              padding: '14px 18px',
              minWidth: '260px',
            }}
          >
            <div>
              <span className="block uppercase font-bold tracking-wider" style={{ fontSize: '10px', color: '#94a3b8' }}>
                Check In
              </span>
              <span
                className="font-mono font-extrabold tabular-nums"
                style={{ fontSize: '15px', color: clockInTime ? '#34d399' : '#475569' }}
              >
                {clockInTime || '—'}
              </span>
            </div>
            <div style={{ borderLeft: '1px solid rgba(51,65,85,0.6)', paddingLeft: '14px' }}>
              <span className="block uppercase font-bold tracking-wider" style={{ fontSize: '10px', color: '#94a3b8' }}>
                Check Out
              </span>
              <span
                className="font-mono font-extrabold tabular-nums"
                style={{ fontSize: '15px', color: clockOutTime ? '#60a5fa' : '#475569' }}
              >
                {clockOutTime || '—'}
              </span>
            </div>
            <div style={{ borderLeft: '1px solid rgba(51,65,85,0.6)', paddingLeft: '14px' }}>
              <span className="block uppercase font-bold tracking-wider" style={{ fontSize: '10px', color: '#94a3b8' }}>
                Duration
              </span>
              <span
                className="font-mono font-extrabold tabular-nums"
                style={{ fontSize: '15px', color: '#e2e8f0' }}
              >
                {todayRecord?.workingHours && todayRecord.workingHours !== '-'
                  ? todayRecord.workingHours
                  : isClockedIn ? 'Active' : '—'}
              </span>
            </div>
          </div>

          {/* ── 3. Location + Punch Action ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Geofence chip */}
            <div
              className="flex items-center gap-2.5 rounded-xl text-xs"
              style={{
                background: 'rgba(30,41,59,0.7)',
                border: '1px solid rgba(51,65,85,0.6)',
                padding: '10px 14px',
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: isInsideGeofence ? '#34d399' : '#fbbf24',
                  boxShadow: isInsideGeofence ? '0 0 6px rgba(52,211,153,0.5)' : 'none',
                  animation: isInsideGeofence ? 'pulse 2s infinite' : 'none',
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold truncate" style={{ color: '#e2e8f0', fontSize: '12px' }}>
                  {isInsideGeofence ? 'Jaipur HQ · In Perimeter' : 'Executive / Field Zone'}
                </span>
                <span className="truncate" style={{ color: '#64748b', fontSize: '10.5px' }}>
                  {isInsideGeofence
                    ? `Office Geofence ±${Math.round(userCoords?.accuracy || 10)}m`
                    : `${Math.round(geofence.distanceMeters || 0)}m from HQ`}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchRealGps}
                  disabled={isLocating}
                  className="p-1.5 rounded-lg transition"
                  style={{ color: isLocating ? '#2dd4bf' : '#94a3b8' }}
                  title="Refresh GPS"
                >
                  <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsGeofenceModalOpen(true)}
                  className="font-bold px-1.5 transition"
                  style={{ color: '#2dd4bf', fontSize: '11px' }}
                >
                  Map
                </button>
              </div>
            </div>

            {/* Punch button */}
            <Button
              variant={isClockedIn ? 'outline' : 'primary'}
              size="md"
              onClick={handleTogglePunch}
              disabled={punchedOut || isPunching}
              className={`font-bold whitespace-nowrap min-w-[180px] h-11 text-sm shadow-sm transition-all ${
                punchedOut
                  ? '!bg-slate-800 !text-slate-400 !cursor-not-allowed !border-slate-700'
                  : isClockedIn
                    ? '!border-rose-500 !bg-rose-500/10 !text-rose-400 hover:!bg-rose-500/20'
                    : '!bg-emerald-600 hover:!bg-emerald-500 !text-white !border-transparent'
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
      </div>

      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        userCoords={userCoords}
        onCoordsChange={setUserCoords}
      />
    </>
  );
}
