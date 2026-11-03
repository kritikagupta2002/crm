/*
 * Leave policy and the real opening balances.
 *
 * Source: "Leave data upto 31102026.xlsx" (leave remaining on 31/10/2026).
 * From 1 Nov 2026 onwards, at every month end each employee is credited 1 PL, 0.5 CL and 0.5 SL, pro rata to the
 * days they were employed that month (see modules/leave/utils/leaveLedger.js).
 */
export const LEAVE_OPENING_DATE = '2026-10-31';

export const INITIAL_LEAVE_TYPES = [
    { id: 'lt-1', name: 'Casual Leave (CL)', code: 'CL', monthlyAccrual: 0.5, annualQuota: 6, carryForwardMax: 0, encashable: false, minNoticeDays: 1, applicableTo: 'All Employees', description: 'Short personal matters, family events and emergencies. 0.5 day credited at every month end.' },
    { id: 'lt-2', name: 'Sick Leave (SL)', code: 'SL', monthlyAccrual: 0.5, annualQuota: 6, carryForwardMax: 0, encashable: false, minNoticeDays: 0, applicableTo: 'All Employees', description: 'Illness, medical recovery and doctor visits. 0.5 day credited at every month end.' },
    { id: 'lt-3', name: 'Privilege Leave (PL)', code: 'PL', monthlyAccrual: 1, annualQuota: 12, carryForwardMax: 0, encashable: true, minNoticeDays: 7, applicableTo: 'All Employees', description: 'Planned leave and vacations. 1 day credited at every month end.' },
];

/* Leave remaining on 31/10/2026, from the HR sheet. Anyone not listed starts at zero. */
export const INITIAL_LEAVE_OPENING_BALANCES = [
    { employeeId: 'BGS/12', name: 'Madhurika Saini', asOf: LEAVE_OPENING_DATE, CL: 0, PL: 1, SL: 0 },
    { employeeId: 'BGS/01', name: 'Inder Nogiya', asOf: LEAVE_OPENING_DATE, CL: 0, PL: 4, SL: 0 },
    { employeeId: 'BGS/04', name: 'Vikas Verma', asOf: LEAVE_OPENING_DATE, CL: 1, PL: 2, SL: 0 },
    { employeeId: 'BGS/05', name: 'Kuldip Singh', asOf: LEAVE_OPENING_DATE, CL: 1, PL: 7, SL: 0 },
    { employeeId: 'BGS/09', name: 'Balveer Singh Yadav', asOf: LEAVE_OPENING_DATE, CL: 1, PL: 5, SL: 0 },
    { employeeId: 'BGS/10', name: 'Vishal Kumawat', asOf: LEAVE_OPENING_DATE, CL: 0, PL: 3.5, SL: 0 },
    { employeeId: 'BGS/11', name: 'Pradeep Chand', asOf: LEAVE_OPENING_DATE, CL: 0, PL: 0, SL: 0 },
];

export const INITIAL_LEAVE_REQUESTS = [];
