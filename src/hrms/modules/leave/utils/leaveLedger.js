/*
 * Leave balance ledger, shared by the API and the browser (plain JS, no imports, so both can load it).
 *
 *   balance = opening balance on the opening date (from the HR sheet)
 *           + monthly credits after it (credited on each month end, pro rata to the days employed that month)
 *           - approved leave taken after the opening date
 *
 * Pending requests are shown separately and reduce what can still be applied for.
 */
export const DEFAULT_OPENING_DATE = '2026-10-31';
export const DEFAULT_MONTHLY_ACCRUAL = { PL: 1, CL: 0.5, SL: 0.5 };

const pad = (n) => String(n).padStart(2, '0');
const round2 = (n) => Math.round(n * 100) / 100;
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
const LEGACY_CODES = { EL: 'PL' };

/** The leave code for a request's leave type name ("Privilege Leave (PL)" → "PL"). */
export function leaveCodeOf(leaveTypeName, leaveTypes = []) {
    const type = leaveTypes.find((t) => t.name === leaveTypeName);
    const code = type?.code || String(leaveTypeName || '').match(/\(([A-Z]+)\)\s*$/)?.[1] || '';
    return LEGACY_CODES[code] || code;
}

/** Month credits from the month after the opening date up to the last month that has ended on or before asOf. */
export function monthlyCredits({ openingDate = DEFAULT_OPENING_DATE, asOf, joiningDate, exitDate, rate }) {
    if (!rate || !asOf) return { total: 0, months: [] };
    let [y, m] = openingDate.split('-').map(Number);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
    const months = [];
    let total = 0;
    for (;;) {
        const last = daysInMonth(y, m);
        const monthEnd = `${y}-${pad(m)}-${pad(last)}`;
        if (monthEnd > asOf) break;
        const first = `${y}-${pad(m)}-01`;
        const from = joiningDate && joiningDate > first ? joiningDate : first;
        const to = exitDate && exitDate < monthEnd ? exitDate : monthEnd;
        let employed = 0;
        if (from <= to) employed = Number(to.slice(8, 10)) - Number(from.slice(8, 10)) + 1;
        const credit = round2((rate * employed) / last);
        if (credit > 0) months.push({ month: `${y}-${pad(m)}`, credit, employedDays: employed, daysInMonth: last });
        total += credit;
        m += 1;
        if (m > 12) { m = 1; y += 1; }
    }
    return { total: round2(total), months };
}

/**
 * Balances for one employee.
 * @param employee        employee record ({ employeeId, employment: { joiningDate, exitDate } })
 * @param requests        all leave requests (any employee; filtered here)
 * @param leaveTypes      leave type records ({ name, code, monthlyAccrual })
 * @param openingBalances list of { employeeId, CL, PL, SL, asOf }
 * @param settings        leave settings ({ openingBalanceDate, monthlyAccrual })
 * @param asOf            'YYYY-MM-DD' (today)
 */
export function computeLeaveBalances({ employee, employeeId, requests = [], leaveTypes = [], openingBalances = [], settings = {}, asOf }) {
    const id = employeeId || employee?.employeeId;
    const opening = openingBalances.find((o) => o.employeeId === id) || {};
    const openingDate = opening.asOf || settings.openingBalanceDate || DEFAULT_OPENING_DATE;
    const fromSettings = settings.monthlyAccrual || {};
    const joiningDate = employee?.employment?.joiningDate || employee?.joiningDate || '';
    const exitDate = employee?.employment?.exitDate || employee?.employment?.lastWorkingDay || employee?.exitDate || '';
    const mine = requests.filter((r) => r.employeeId === id && String(r.startDate) > openingDate);

    return leaveTypes.map((type) => {
        const code = LEGACY_CODES[type.code] || type.code;
        // Leave settings (HR) win, then the leave type's own rate, then the policy default.
        const rate = Number(fromSettings[code] ?? type.monthlyAccrual ?? DEFAULT_MONTHLY_ACCRUAL[code]) || 0;
        const ofType = mine.filter((r) => leaveCodeOf(r.leaveType, leaveTypes) === code);
        const used = ofType.filter((r) => r.status === 'Approved' || r.status === 'Partially Approved')
            .reduce((sum, r) => sum + (Number(r.approvedDays ?? r.days) || 0), 0);
        const pending = ofType.filter((r) => r.status === 'Pending')
            .reduce((sum, r) => sum + (Number(r.requestedDays ?? r.days) || 0), 0);
        const openingDays = Number(opening[code]) || 0;
        const credits = monthlyCredits({ openingDate, asOf, joiningDate, exitDate, rate });
        const allocated = round2(openingDays + credits.total);
        const available = round2(allocated - used);
        return {
            leaveType: type.name,
            code,
            opening: openingDays,
            openingDate,
            accrued: credits.total,
            accrualMonths: credits.months,
            monthlyAccrual: rate,
            allocated,
            used: round2(used),
            pending: round2(pending),
            available,
            availableToApply: Math.max(0, round2(available - pending)),
        };
    });
}
