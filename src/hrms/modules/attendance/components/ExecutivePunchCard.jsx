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
      {/* The CRM's light card: identity, today's punches, location and the punch button. */}
      <section className={`card exec-punch ${className}`}>
        <div className="exec-punch-who">
          <span className="exec-punch-avatar">{initials}</span>
          <div className="min-w-0">
            <div className="exec-punch-name">
              <strong>{empName}</strong>
              <span className="pill tone-info">{empRole}</span>
              <span className="pill tone-neutral">{empId}</span>
            </div>
            <p className="exec-punch-meta">
              <Clock size={14} /> <b>{timeFormatted}</b> · Shift 09:30 AM – 06:00 PM
            </p>
          </div>
        </div>

        <dl className="exec-punch-times">
          <div><dt>Check in</dt><dd className={clockInTime ? 'is-in' : ''}>{clockInTime || '—'}</dd></div>
          <div><dt>Check out</dt><dd>{clockOutTime || '—'}</dd></div>
          <div>
            <dt>Duration</dt>
            <dd>{todayRecord?.workingHours && todayRecord.workingHours !== '-' ? todayRecord.workingHours : isClockedIn ? 'Active' : '—'}</dd>
          </div>
        </dl>

        <div className="exec-punch-actions">
          <div className={`exec-punch-place ${isInsideGeofence ? 'is-inside' : ''}`}>
            <span className="exec-punch-dot" />
            <div className="min-w-0">
              <strong>{isInsideGeofence ? 'Jaipur HQ · In Perimeter' : 'Executive / Field Zone'}</strong>
              <small>
                {isInsideGeofence
                  ? `Office Geofence ±${Math.round(userCoords?.accuracy || 10)}m`
                  : `${Math.round(geofence.distanceMeters || 0)}m from HQ`}
              </small>
            </div>
            <button type="button" className="icon-button" onClick={fetchRealGps} disabled={isLocating} title="Refresh GPS">
              <Crosshair size={16} className={isLocating ? 'animate-spin' : ''} />
            </button>
            <button type="button" className="link-button" onClick={() => setIsGeofenceModalOpen(true)}>Map</button>
          </div>

          <Button
            variant={punchedOut || isClockedIn ? 'secondary' : 'primary'}
            onClick={handleTogglePunch}
            disabled={punchedOut || isPunching}
            leftIcon={punchedOut ? <CheckCircle2 size={16} /> : isClockedIn ? <LogOut size={16} /> : <LogIn size={16} />}
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
      </section>

      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        userCoords={userCoords}
        onCoordsChange={setUserCoords}
      />
    </>
  );
}
