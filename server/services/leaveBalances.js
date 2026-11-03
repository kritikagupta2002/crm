import { db } from './db.js';
import { today } from './dates.js';
import { computeLeaveBalances } from '../../src/hrms/modules/leave/utils/leaveLedger.js';

/*
 * Leave balances from the ledger: opening balance on 31/10/2026 (HR sheet) + month-end credits − approved leave.
 * Never stored, always computed, so an approval, cancellation or month end shows up immediately.
 */
export function balancesFor(employeeId, asOf = today()) {
  const employee = db.get('employees').find((e) => e.employeeId === employeeId);
  return computeLeaveBalances({
    employee,
    employeeId,
    requests: db.get('leaves'),
    leaveTypes: db.get('leave_types'),
    openingBalances: db.get('leave_opening_balances') || [],
    settings: db.get('leave_settings') || {},
    asOf,
  });
}
