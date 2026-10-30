import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  MapPin,
  LogIn,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Compass,
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
import { GeofenceMap } from './GeofenceMap';

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

  // Active employee ID (Amit Bansal = BGS/DIR-01, Dharmendra Goyal = BGS/DIR-03)
  const empId = user?.employeeId || (user?.name?.includes('Amit') ? 'BGS/DIR-01' : user?.name?.includes('Dharmendra') ? 'BGS/DIR-03' : 'BGS/ADM-01');
  const empName = user?.name || 'Executive';
  const empRole = user?.designation || 'Director';

  const [todayRecord, setTodayRecord] = useState(() =>
    storage.getAttendance().find((a) => a.employeeId === empId && a.date === todayIso())
  );
  const [isPunching, setIsPunching] = useState(false);

  // Geofence GPS location (defaults to inside office polygon)
  const [userCoords, setUserCoords] = useState(() => ({
    latitude: OFFICE_CENTROID[0],
    longitude: OFFICE_CENTROID[1],
    accuracy: 8,
    simulated: true,
  }));
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [showInlineMap, setShowInlineMap] = useState(false);

  const geofence = useMemo(() => {
    return evaluateGeofence(userCoords?.latitude, userCoords?.longitude, userCoords?.accuracy || 10);
  }, [userCoords]);
  const isInsideGeofence = geofence.isInside;

  // Real GPS detection on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            simulated: false,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
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

    if (!isInsideGeofence) {
      toast.error(
        `Attendance Locked: You are outside the office geofence (${Math.round(geofence.distanceMeters || 0)}m away). Move inside the office boundary to punch.`,
        'Geofence Required'
      );
      setIsGeofenceModalOpen(true);
      return;
    }

    setIsPunching(true);
    try {
      const punchSource = `Office Geofenced GPS (${isInsideGeofence ? 'Verified Inside' : 'Outside'})`;
      const rec = await attendanceService.recordPunch(
        empId,
        isClockedIn ? 'checkOut' : 'checkIn',
        punchSource,
        userCoords
      );
      setTodayRecord(rec);
      if (isClockedIn) {
        toast.success(
          `Punched out at ${rec.checkOut}. Total hours: ${rec.workingHours}. · Geofence Verified`,
          'Attendance Recorded'
        );
      } else {
        toast.success(
          `Punched in at ${rec.checkIn}${rec.status === 'Late' ? ` (late by ${rec.lateBy})` : ''} · Geofence Verified.`,
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
      <Card className={`p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl ${className}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity & Status */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/80 dark:border-teal-800/80">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 dark:text-white text-base">
                  {empName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {empId}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {empRole}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-slate-700 dark:text-slate-200 tabular-nums">{timeFormatted}</strong>
                </span>
                <span>•</span>
                <span>Shift: <strong>09:30 AM – 06:00 PM</strong> (HQ)</span>
              </div>
            </div>
          </div>

          {/* Today's Punch Summary Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 bg-slate-50 dark:bg-slate-800/50 p-2.5 px-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
            <div>
              <span className="block text-[10.5px] uppercase font-semibold text-slate-400">
                Check In
              </span>
              <span className={`font-bold tabular-nums text-sm ${clockInTime ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {clockInTime || '—'}
              </span>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="block text-[10.5px] uppercase font-semibold text-slate-400">
                Check Out
              </span>
              <span className={`font-bold tabular-nums text-sm ${clockOutTime ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                {clockOutTime || '—'}
              </span>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="block text-[10.5px] uppercase font-semibold text-slate-400">
                Duration
              </span>
              <span className="font-bold tabular-nums text-sm text-slate-800 dark:text-slate-200">
                {todayRecord?.workingHours || (isClockedIn ? 'In Progress' : '—')}
              </span>
            </div>
          </div>

          {/* Geofence Status & Punch Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Geofence Pill */}
            <div className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between sm:justify-start gap-2 border ${
              isInsideGeofence
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isInsideGeofence ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="font-bold">
                  {isInsideGeofence ? 'Inside Geofence (0m)' : `Outside (${Math.round(geofence.distanceMeters || 0)}m)`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsGeofenceModalOpen(true)}
                className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline shrink-0"
              >
                Map
              </button>
            </div>

            {/* Test Simulation Controls */}
            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setUserCoords({ latitude: OFFICE_CENTROID[0], longitude: OFFICE_CENTROID[1], accuracy: 8, simulated: true })}
                className={`px-2 py-1 rounded text-[10.5px] font-bold transition ${
                  isInsideGeofence
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
                title="Test: Simulate inside office"
              >
                Inside
              </button>
              <button
                type="button"
                onClick={() => setUserCoords({ latitude: 26.8552, longitude: 75.7682, accuracy: 12, simulated: true })}
                className={`px-2 py-1 rounded text-[10.5px] font-bold transition ${
                  !isInsideGeofence
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
                title="Test: Simulate 150m outside office"
              >
                Outside
              </button>
            </div>

            {/* Punch In / Out Button */}
            <Button
              variant={isClockedIn ? 'outline' : 'primary'}
              size="md"
              onClick={handleTogglePunch}
              disabled={punchedOut || isPunching || !isInsideGeofence}
              className={`font-bold whitespace-nowrap min-w-[170px] ${
                !isInsideGeofence
                  ? '!bg-slate-200 dark:!bg-slate-800 !text-slate-500 dark:!text-slate-400 !cursor-not-allowed !border-slate-300 dark:!border-slate-700'
                  : isClockedIn
                    ? '!border-rose-300 !text-rose-700 hover:!bg-rose-50 dark:!border-rose-800 dark:!text-rose-400 dark:hover:!bg-rose-950/40'
                    : '!bg-emerald-600 hover:!bg-emerald-700 !text-white shadow-xs'
              }`}
              leftIcon={
                !isInsideGeofence ? (
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                ) : isClockedIn ? (
                  <LogOut className="w-4 h-4 text-rose-500" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )
              }
            >
              {!isInsideGeofence
                ? `Locked (${Math.round(geofence.distanceMeters || 0)}m)`
                : isClockedIn
                  ? 'Punch Out'
                  : punchedOut
                    ? 'Punched Out Today'
                    : 'Punch In Now'}
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
