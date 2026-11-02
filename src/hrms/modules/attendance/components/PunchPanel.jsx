import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Crosshair, LogIn, LogOut, MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';
import { useCrm } from '../../../../context/crm';
import { useAccess } from '../../../../core/permissions/crm';
import { attendanceService } from '../services/attendance.service';
import { todayIso } from '../utils/punch';
import { evaluateGeofence } from '../utils/geofence';
import { formatDistance } from './GeofenceMap';
import { LiveOfficeMap } from './LiveOfficeMap';
import { useLiveLocation } from '../hooks/useLiveLocation';
import './PunchPanel.css';

const useNow = () => {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
};

/*
 * Today's attendance for the signed-in person: a live map with their position and the office, the distance
 * updating as they move, and the punch button that turns on only inside the office boundary. The server checks
 * the location again on every punch.
 */
export function PunchPanel({ title = "Today's attendance" }) {
    const toast = useToast();
    const { user } = useCrm();
    const { has } = useAccess();
    const now = useNow();
    const { coords, status, error, retry } = useLiveLocation();
    const employeeId = user?.employeeId;
    const [record, setRecord] = useState(() => storage.getAttendance().find((a) => a.employeeId === employeeId && a.date === todayIso()) || null);
    const [busy, setBusy] = useState(false);
    const [justEntered, setJustEntered] = useState(false);

    const geo = useMemo(() => (coords ? evaluateGeofence(coords.latitude, coords.longitude, coords.accuracy) : null), [coords]);
    const inside = Boolean(geo?.isInside) && !geo?.isLowAccuracy;

    // A short highlight the moment someone crosses into the office, so the change is noticed.
    const [wasInside, setWasInside] = useState(false);
    useEffect(() => {
        if (inside && !wasInside) {
            setJustEntered(true);
            const t = setTimeout(() => setJustEntered(false), 1600);
            setWasInside(true);
            return () => clearTimeout(t);
        }
        if (!inside && wasInside) setWasInside(false);
        return undefined;
    }, [inside, wasInside]);

    const shift = useMemo(() => {
        const assignment = storage.getShiftAssignments().find((a) => a.employeeId === employeeId && a.status !== 'Inactive');
        const s = storage.getShifts().find((x) => x.id === assignment?.shiftId);
        const settings = storage.getAttendanceSettings();
        return { name: s?.name || 'General shift', start: s?.startTime || settings.workStartTime || '09:30 AM', end: s?.endTime || settings.workEndTime || '06:00 PM' };
    }, [employeeId]);

    const punchedIn = Boolean(record?.checkIn && record.checkIn !== '-');
    const punchedOut = Boolean(record?.checkOut && record.checkOut !== '-');
    const onLeave = record?.status === 'On Leave';
    const canMark = has('attendance.mark') && Boolean(employeeId);
    const done = punchedOut || onLeave;
    const action = punchedIn ? 'checkOut' : 'checkIn';

    const locationLine = (() => {
        if (status === 'denied' || status === 'unsupported') return error;
        if (!coords) return status === 'unavailable' ? error : 'Finding your location…';
        if (geo.isLowAccuracy) return `GPS signal is weak (±${coords.accuracy} m). Move near a window.`;
        if (inside) return geo.rawInside ? 'You are inside the office.' : 'You are at the office boundary.';
        return `${formatDistance(geo.distanceMeters)} from the office`;
    })();

    // Without GPS (most desktop PCs) the server can still verify the office by its network address.
    const noGps = ['denied', 'unavailable', 'unsupported'].includes(status) && !coords;

    const punch = async (viaNetwork = false) => {
        if ((!inside && !viaNetwork) || busy || done) return;
        setBusy(true);
        try {
            const rec = await attendanceService.recordPunch(employeeId, action, viaNetwork ? 'Office network' : 'Office geofence (GPS)', viaNetwork ? null : coords);
            setRecord(rec);
            toast.success(action === 'checkIn' ? `Punched in at ${rec.checkIn}${rec.status === 'Late' ? `, ${rec.lateBy} late` : ''}.` : `Punched out at ${rec.checkOut}.`, action === 'checkIn' ? 'Punched in' : 'Punched out');
        } catch (err) {
            toast.error(err.message, 'Punch not recorded');
        } finally {
            setBusy(false);
        }
    };

    const buttonLabel = done
        ? (onLeave ? 'On approved leave today' : 'Day complete')
        : !inside
            ? (coords ? 'Move inside the office to punch' : 'Waiting for your location')
            : punchedIn ? 'Punch out' : 'Punch in';

    return (<section className={`punch-panel ${inside ? 'is-inside' : 'is-outside'} ${justEntered ? 'just-entered' : ''}`} aria-labelledby="punch-title">
      <div className="punch-main">
        <div className="punch-head">
          <h2 id="punch-title">{title}</h2>
          <span className={`punch-state ${punchedIn && !punchedOut ? 'is-live' : ''}`}>
            {onLeave ? 'On leave' : punchedOut ? 'Punched out' : punchedIn ? 'Punched in' : 'Not punched in'}
          </span>
        </div>

        <div className="punch-clock" aria-live="off">
          <span className="punch-time">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).toUpperCase()}</span>
          <span className="punch-date">{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {shift.start} to {shift.end}</span>
        </div>

        <dl className="punch-times">
          <div>
            <dt>Punch in</dt>
            <dd>{punchedIn ? record.checkIn : '-'}</dd>
          </div>
          <div>
            <dt>Punch out</dt>
            <dd>{punchedOut ? record.checkOut : '-'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{record?.status || '-'}</dd>
          </div>
        </dl>

        <div className={`punch-location ${inside ? 'is-inside' : coords ? 'is-outside' : 'is-unknown'}`} role="status" aria-live="polite">
          {inside ? <CheckCircle2 size={18} aria-hidden="true"/> : coords ? <Navigation size={18} aria-hidden="true"/> : <MapPin size={18} aria-hidden="true"/>}
          <div className="punch-location-text">
            <strong>{locationLine}</strong>
            {coords && <span>GPS accuracy ±{coords.accuracy} m</span>}
          </div>
          {(status === 'denied' || status === 'unavailable' || status === 'unsupported') && (<button type="button" className="link-button" onClick={retry}>
              <Crosshair size={14}/> Try again
            </button>)}
        </div>

        {canMark ? (<button type="button" className={`punch-button ${punchedIn && !punchedOut ? 'is-out' : ''}`} onClick={() => punch(false)} disabled={!inside || busy || done} aria-describedby="punch-hint">
            {punchedIn && !punchedOut ? <LogOut size={18} aria-hidden="true"/> : <LogIn size={18} aria-hidden="true"/>}
            <span>{busy ? 'Recording…' : buttonLabel}</span>
          </button>) : (<p className="punch-note">Your account does not have permission to mark attendance. Contact HR if this is wrong.</p>)}
        {canMark && noGps && !done && (<button type="button" className="btn btn-outline punch-network" onClick={() => punch(true)} disabled={busy}>
            {punchedIn ? 'Punch out from office network' : 'Punch in from office network'}
          </button>)}
        <p id="punch-hint" className="punch-note">Punching is available only inside the office boundary. If you worked elsewhere, request a correction.</p>
      </div>

      <div className="punch-map">
        <LiveOfficeMap coords={coords} inside={inside}/>
        <div className="punch-map-badge" aria-hidden="true">
          {coords ? (inside ? 'Inside office' : `${formatDistance(geo.distanceMeters)} away`) : status === 'locating' ? 'Locating' : 'Location off'}
        </div>
      </div>
    </section>);
}
