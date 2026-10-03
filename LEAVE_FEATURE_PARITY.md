# Bansal Geo HRMS — Leave Management Feature Parity Document

## 1. Overview & Project Context
This document verifies the complete, source-accurate migration of the **Leave Management** module from the Bansal Geo CRM/HRMS web application (`crm/src/hrms/modules/leave/`) into the native React Native mobile application (`mobile/src/screens/hrms/`).

This phase was executed with **Zero Fake Numbers**, strict **frontend-only architecture**, local persistence via **AsyncStorage**, native **working-day calculations**, and bidirectional **Leave ↔ Attendance synchronization**.

---

## 2. Source Web Files Inspected
The implementation strictly follows the business logic, storage keys, validation routines, and calculations from the existing web codebase:

1. **`crm/src/hrms/modules/leave/utils/workingDays.js`**:
   - Single source of truth for working day counts.
   - Excludes Saturdays (Day 6) and Sundays (Day 0).
   - Excludes 14 Indian national public holidays for FY 2026 (`NATIONAL_HOLIDAYS_2026`).
   - Pure local date parsing at noon local time (`parseLocalDate`) to eliminate timezone drift.
   - `countWorkingDays`, `getWorkingDates`, `getNonWorkingDates`, `formatDate`.

2. **`crm/src/hrms/modules/leave/services/leave.service.js`**:
   - `checkDateConflict`: Detects overlapping date ranges with active (non-rejected, non-cancelled) requests.
   - `syncAttendanceForLeave`: Updates attendance records to `'On Leave'` / `'On-Leave'` for approved dates; reverts on rejection or cancellation.
   - `applyLeave`: 7-tier validation sequence (chronology, working days > 0, 30-day max, CL $\le$ 3-day limit, quota availability, overlap checks, substantive justification $\ge 10$ chars, Indian phone format).
   - `reviewLeave`: Full approval, partial approval, and rejection with mandatory rejection comment and 4-Eyes Principle enforcement.
   - `cancelLeave`: Application withdrawal, quota refund, and attendance reversion.

3. **`crm/src/hrms/data/leave/leave.js`**:
   - Quotas, colors, and initial seed applications (`lr-501` to `lr-508`).

4. **`crm/src/hrms/core/storage/storage.js`**:
   - `getBalancesForEmployee(empId, empName)`: Computes `used`, `pending`, `available`, and `availableForNew = Math.max(0, totalAllocated - used - pending)`.

5. **`crm/src/hrms/modules/leave/pages/`**:
   - `LeaveDashboardPage.jsx`: Personal balances, quick access tiles, recent applications.
   - `ApplyLeavePage.jsx`: Live working day counter, skipped dates breakdown, overlap resolution.
   - `LeaveApprovalsPage.jsx`: Adjudication modal, full/partial/rejection modes, quota impact preview.

---

## 3. Leave Screens & Components Implemented

| Mobile Screen / Component | File Location | Key Capabilities & Features |
|---|---|---|
| **Leave Screen (Overview & Hub)** | `mobile/src/screens/hrms/LeaveScreen.tsx` | - Role-adaptive view: Personal Quotas & Requests for employees; All Staff Requests tab for HR/Admin.<br>- 6-card Quota Ledger with real colors, used/pending counters, and progress bar.<br>- Search bar and segmented status filters (`All`, `Pending`, `Approved`, `Partially Approved`, `Rejected`).<br>- Rich application cards showing working days, dates, reason, status, and rejection remarks.<br>- Header action button to Approvals Queue with live pending count badge for HR/Admin. |
| **Apply Leave Modal / Engine** | `mobile/src/screens/hrms/LeaveScreen.tsx` (Embedded modal) | - 6 Leave Type selector chips with live available days counter.<br>- Start & End date pickers with local ISO format validation.<br>- **Live Working Day Engine**: Computes exact working days, shows list of excluded weekends & holidays with reasons (e.g., `2026-10-02 (Gandhi Jayanti)`).<br>- Live quota projection and policy warnings (CL $\le$ 3-day limit, inverted dates, 0 working days, over-quota).<br>- Overlap detection with 1-Click "Auto-Adjust Dates" resolution button.<br>- Substantive justification ($\ge 10$ chars counter) and emergency phone validation. |
| **Leave Detail Modal** | `mobile/src/screens/hrms/LeaveScreen.tsx` (Detail sheet) | - Complete metadata: Employee name, department, dates, working days, status badge.<br>- Breakdown of Approved vs. Rejected days for partial approvals.<br>- Applicant justification and emergency phone.<br>- Prominently formatted Rejection Reason box for rejected requests.<br>- Approver remarks and timestamp for approved requests.<br>- "Withdraw / Cancel Application" action for pending owned requests.<br>- Quick "Open in Approvals Queue" for HR administrators. |
| **Leave Approvals Screen** | `mobile/src/screens/hrms/LeaveApprovalsScreen.tsx` | - Restricted to HR & Admin roles (`hasRole(['Admin', 'HR'])`).<br>- **4-Eyes Principle**: Approver cannot approve/reject their own leave request (`item.employeeId === activeEmpId`).<br>- Status filter tabs: `Pending Queue`, `Approved`, `Partially Approved`, `Rejected`, `All Requests`.<br>- Multi-field search (applicant name, ID, leave type, department, reason).<br>- **Adjudication Review Dialog**: Supports Full Approval, Partial Approval (with stepper for custom approved days), and Rejection.<br>- **Mandatory Rejection Reason**: Rejection is blocked without a justification.<br>- Real-time Quota Impact preview showing available quota, deduction, and projected balance. |

---

## 4. Leave Types & Quotas Preserved Exactly

| Leave Type | Code | Annual Quota | Color Token | Policy Constraints |
|---|:---:|:---:|:---:|---|
| **Casual Leave** | `CL` | 12 Days | `#3B82F6` (Blue) | **Max 3 consecutive working days** per application. Non-accumulative. |
| **Sick Leave** | `SL` | 10 Days | `#10B981` (Emerald) | For medical recovery, physician consultation, and illness. |
| **Earned / Privilege Leave** | `EL` | 18 Days | `#F59E0B` (Amber) | Accrued annual vacation; requires advance planning for extended absences. |
| **Compensatory Off** | `CO` | 8 Days | `#8B5CF6` (Purple) | Earned by working weekend shifts, site emergencies, or statutory holidays. |
| **Field Duty Leave** | `FDL` | 15 Days | `#06B6D4` (Cyan) | Rest and recuperation (R&R) following extended continuous drilling/camp tours. |
| **Maternity / Paternity Leave** | `ML` | 180 Days | `#EC4899` (Pink) | Statutory paid parental leave under Indian Maternity Benefit Act (exempt from 30-day limit). |

---

## 5. Working-Day & Holiday Engine

Implemented in `mobile/src/utils/workingDays.ts`:
- **Weekend Exclusion**: Both Saturday (`day === 6`) and Sunday (`day === 0`) are excluded from working days.
- **Indian National Holidays (FY 2026)**:
  1. `2026-01-26` — Republic Day
  2. `2026-03-29` — Good Friday
  3. `2026-04-14` — Dr. Ambedkar Jayanti / Baisakhi
  4. `2026-05-01` — Maharashtra Day / Labour Day
  5. `2026-06-17` — Eid ul-Adha
  6. `2026-07-17` — Muharram
  7. `2026-08-15` — Independence Day
  8. `2026-09-16` — Milad-un-Nabi
  9. `2026-10-02` — Gandhi Jayanti
  10. `2026-10-24` — Dussehra
  11. `2026-11-04` — Diwali (Lakshmi Puja)
  12. `2026-11-05` — Diwali (Bali Pratipada)
  13. `2026-11-24` — Guru Nanak Jayanti
  14. `2026-12-25` — Christmas Day
- **Inverted Date Handling**: Returns `-1` if `endDate < startDate`.
- **Zero Working Days**: Blocks submission if range contains 0 working days (e.g. Saturday-Sunday span or national holiday).

---

## 6. Balance Calculation & Accounting Logic

Leave balances are calculated dynamically from actual quota configurations and stored applications:
$$\text{Used} = \sum (\text{approvedDays} \text{ for } \text{Approved} \lor \text{Partially Approved})$$
$$\text{Pending} = \sum (\text{requestedDays} \text{ for } \text{Pending})$$
$$\text{Available} = \max(0, \text{Total Allocated} - \text{Used})$$
$$\text{Available To Apply} = \max(0, \text{Total Allocated} - \text{Used} - \text{Pending})$$

- **On Approval**: `used` increases by `approvedDays`.
- **On Partial Approval**: `used` increases only by the granted `approvedDays`. The remaining days are rejected and do not consume balance.
- **On Rejection**: No quota is deducted. Any pending commitment is released back into `availableToApply`.
- **On Cancellation / Withdrawal**: Balance is automatically restored to the available pool.

---

## 7. Cross-Module Leave ↔ Attendance Synchronization

The connection between the Leave module and Attendance module is fully implemented in `LeaveService.syncAttendanceForLeave(req, action)`:
1. When leave is **Approved** or **Partially Approved**:
   - Working dates within the approved span are calculated (`getWorkingDates`).
   - In `@bgspl_attendance`, each approved date record is updated:
     - `status = 'On-Leave'`
     - `punchIn = '-'`, `punchOut = '-'`, `checkIn = '-'`, `checkOut = '-'`
     - `durationHours = 0`, `workingHours = '-'`, `lateBy = '-'`, `overtime = '-'`
     - `workLocation = 'Approved Leave'`, `punchSource = 'Approved Leave'`
   - If no record existed for that date, a new record with `id: att-leave-${employeeId}-${dateStr}` is inserted.
2. When leave is **Rejected** or **Cancelled**:
   - If previously approved, the `On-Leave` record is reverted: auto-generated `att-leave-` records are cleanly removed, and regular daily records are restored to `Present`.
   - The employee does NOT continue to appear as `On-Leave`.

---

## 8. Role-Based Access & Data Isolation

- **Regular Employees (`employee`, `accountant`, `lead`)**:
  - Strictly limited to self-service.
  - Can ONLY see their own leave balances, quotas, and applications.
  - Cannot see organization-wide employee leave records.
  - Cannot access `LeaveApprovalsScreen` (access restricted screen shown if navigated).
- **Managers / HR / Admin (`hr`, `admin`)**:
  - Can switch between "My Balance & Requests" and "All Staff Requests".
  - Full access to `LeaveApprovalsScreen` queue.
  - **4-Eyes Principle Guard**: Self-adjudication is blocked. An HR manager or Admin cannot approve or reject their own leave application.

---

## 9. Verification & Automated Test Results

An automated regression test suite (`mobile/scripts/test-leave-parity.js`) was executed via Node.js, and TypeScript validation (`npx tsc --noEmit`) was run on the entire mobile codebase:

```text
=== RUNNING BGSPL LEAVE PARITY TEST SUITE ===

  [PASS] Working-day count excludes Saturdays and Sundays
  [PASS] National holidays (e.g. Gandhi Jayanti 2026-10-02) are excluded from day counts
  [PASS] Inverted dates (end < start) returns -1
  [PASS] Active/Pending overlapping request is detected
  [PASS] Data isolation: Requests of other employees do not conflict
  [PASS] Rejected requests do not block future overlapping dates
  [PASS] CL duration check: 5 working days correctly detected as exceeding 3-day policy
  [PASS] CL used correctly computes to 4 days
  [PASS] CL pending commitments correctly compute to 2 days
  [PASS] CL remaining quota ledger available is 8 days
  [PASS] CL available to apply (after pending reservation) is 6 days
  [PASS] Approval updates existing attendance to On-Leave
  [PASS] Approval inserts missing dates as On-Leave records
  [PASS] Rejected leave does not increment used quota

=== RESULTS: 14 PASSED, 0 FAILED ===
```

- `npx tsc --noEmit`: Exited with code **0** (Zero errors).

---

## 10. Boundaries & Next Steps
As instructed by the user request:
- **STOP CONDITION HONORED**: Only Leave Management was implemented.
- We did **NOT** implement Expenses, Reimbursement, Finance, Payroll, Employee Directory, Organization, Shifts, Documents, or MIS.
