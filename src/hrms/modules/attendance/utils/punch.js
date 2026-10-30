/**
 * Punch-clock helpers: reading "09:05 AM" style times and working out a day's status from the
 * attendance settings (work start, grace minutes, full-day hours).
 */

const pad = (n) => String(n).padStart(2, '0');

export const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* "09:05 AM" → minutes after midnight; null when the text is not a time. */
export function parseClock(text) {
    const m = String(text || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return null;
    let h = Number(m[1]);
    const mins = Number(m[2]);
    if (mins > 59 || h > 23) return null;
    const meridiem = m[3]?.toUpperCase();
    if (meridiem) {
        if (h < 1 || h > 12) return null;
        if (meridiem === 'PM' && h < 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
    }
    return h * 60 + mins;
}

/* Minutes after midnight → "09:05 AM". */
export const clockOf = (mins) => `${pad(((Math.floor(mins / 60) + 11) % 12) + 1)}:${pad(mins % 60)} ${mins >= 720 ? 'PM' : 'AM'}`;

export const durationOf = (mins) => `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;

export const nowClock = () => {
    const d = new Date();
    return clockOf(d.getHours() * 60 + d.getMinutes());
};

/*
 * Status, late-by, hours and overtime for one day's punches. Late means punching in after the work
 * start plus the grace minutes; overtime is time worked beyond the full-day hours.
 */
export function evaluateDay(checkIn, checkOut, settings = {}) {
    const start = parseClock(settings.workStartTime) ?? 9 * 60 + 30;
    const grace = Number(settings.gracePeriodMinutes ?? 15);
    const fullDay = Number(settings.fullDayMinimumHours ?? 8) * 60;
    const inAt = parseClock(checkIn);
    const outAt = parseClock(checkOut);
    if (inAt === null) {
        return { status: 'Absent', lateBy: '-', workingHours: '-', overtime: '-' };
    }
    const late = inAt > start + grace;
    const result = {
        status: late ? 'Late' : 'Present',
        lateBy: late ? (inAt - start >= 60 ? `${Math.floor((inAt - start) / 60)}h ${(inAt - start) % 60}m` : `${inAt - start}m`) : '-',
        workingHours: 'Working...',
        overtime: '-',
    };
    if (outAt !== null) {
        const worked = Math.max(0, outAt - inAt);
        result.workingHours = durationOf(worked);
        result.overtime = worked > fullDay ? `${worked - fullDay}m` : '-';
    }
    return result;
}
