/*
 * One-off migration to the real leave data (safe to run more than once):
 *
 *   node server/scripts/migrate-2026-11-leave-data.js            # dry run: shows what would change
 *   node server/scripts/migrate-2026-11-leave-data.js --apply    # backs up to server/backups/, then applies
 *
 *   1. Leave types become CL, SL and PL (the dummy EL / CO / FDL / ML types are removed).
 *   2. Opening balances on 31/10/2026 are loaded from "Leave data upto 31102026.xlsx".
 *   3. Leave settings switch from annual quotas to month-end credits (1 PL, 0.5 CL, 0.5 SL, pro rata).
 *   4. Dummy leave requests are removed: the seeded ones (id "lr-…") and every request starting on or before
 *      31/10/2026, which the opening balance already accounts for. Their "On Leave" attendance rows go with them.
 *   5. The old dummy per-employee balance list (leave_balances) is cleared.
 *   6. The built-in 2026 public holiday list is dropped: holidays and half days are now only the days HR / Admin
 *      mark on the attendance calendar (days already marked by HR are kept).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../services/db.js';
import { postgres } from '../services/postgres.js';
import { INITIAL_LEAVE_TYPES, INITIAL_LEAVE_OPENING_BALANCES, LEAVE_OPENING_DATE } from '../../src/hrms/data/leave/leave.js';

const apply = process.argv.includes('--apply');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLD_SETTING_KEYS = ['publicHolidays', 'annualCasualLeave', 'annualSickLeave', 'annualEarnedLeave', 'annualCompOffLeave', 'annualFieldDutyLeave', 'carryForwardLimit'];

async function main() {
  await db.ready;
  console.log(apply ? 'Mode: APPLY' : 'Mode: dry run (add --apply to change the data)');
  console.log(`Store: ${postgres.isConnected() ? 'PostgreSQL' : 'local JSON files'}`);

  const leaves = db.get('leaves');
  const dummy = leaves.filter((l) => String(l.id).startsWith('lr-') || String(l.startDate) <= LEAVE_OPENING_DATE);
  const dummyIds = new Set(dummy.map((l) => l.id));
  const attendance = db.get('attendance');
  // "On Leave" rows written for a removed request: linked by id, or (older rows) by person and date range.
  const fromDummy = (a) => a.status === 'On Leave' && !/\d/.test(String(a.checkIn || '')) && (dummyIds.has(a.leaveId)
    || (!a.leaveId && dummy.some((l) => l.employeeId === a.employeeId && a.date >= l.startDate && a.date <= l.endDate)));
  const leaveRows = attendance.filter(fromDummy);
  const types = db.get('leave_types');

  console.log(`\nLeave types now: ${types.map((t) => t.code).join(', ') || '(none)'} → ${INITIAL_LEAVE_TYPES.map((t) => t.code).join(', ')}`);
  console.log(`Opening balances to load: ${INITIAL_LEAVE_OPENING_BALANCES.length} employees (as on ${LEAVE_OPENING_DATE})`);
  for (const o of INITIAL_LEAVE_OPENING_BALANCES) console.log(`  ${o.employeeId.padEnd(8)} ${o.name.padEnd(22)} CL ${o.CL}  PL ${o.PL}  SL ${o.SL}`);
  console.log(`\nLeave requests to remove: ${dummy.length} of ${leaves.length}`);
  for (const l of dummy) console.log(`  ${l.id.padEnd(22)} ${String(l.employeeName).padEnd(22)} ${l.leaveType} ${l.startDate}→${l.endDate} (${l.status})`);
  console.log(`Attendance "On Leave" rows to remove: ${leaveRows.length}`);
  console.log(`Old leave_balances entries to clear: ${(db.get('leave_balances') || []).length}`);
  if (!apply) return;

  const backup = {};
  for (const c of ['leaves', 'attendance', 'leave_types', 'leave_settings', 'leave_balances', 'leave_opening_balances']) backup[c] = db.get(c);
  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `leave-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 2), { mode: 0o600 });
  console.log(`\nBackup written to ${file}`);

  db.set('leave_types', INITIAL_LEAVE_TYPES);
  db.set('leave_opening_balances', INITIAL_LEAVE_OPENING_BALANCES);
  const settings = { ...(db.get('leave_settings') || {}) };
  for (const key of OLD_SETTING_KEYS) delete settings[key];
  db.set('leave_settings', { ...settings, openingBalanceDate: LEAVE_OPENING_DATE, monthlyAccrual: { PL: 1, CL: 0.5, SL: 0.5 } });
  if (dummy.length) db.set('leaves', leaves.filter((l) => !dummyIds.has(l.id)));
  if (leaveRows.length) db.set('attendance', attendance.filter((a) => !fromDummy(a)));
  db.set('leave_balances', []);

  if (postgres.isConnected()) await postgres.flush();
  console.log('Leave data migrated.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
