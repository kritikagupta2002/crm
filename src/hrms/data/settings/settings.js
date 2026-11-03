export const INITIAL_COMPANY_SETTINGS = {
    companyName: 'Bansal Geo Solutions Pvt. Ltd.',
    legalEntityName: 'Bansal Geo Solutions Private Limited',
    cinNumber: 'U14290RJ2022PTC083921',
    gstin: '08AAFCB4920M1Z8',
    panNumber: 'AAFCB4920M',
    registeredOffice: '604, 607 & 612, 6th Floor, Okay Plus Square, Madhyam Marg, Mansarovar, Jaipur, Rajasthan - 302020, India',
    contactEmail: 'info@bansalgeo.com',
    phone: '+91 90010 85208 / +91 98876 95208',
    website: 'https://bansalgeo.com',
    foundedYear: '2022',
    headquarters: 'Jaipur, Rajasthan',
};
export const INITIAL_ATTENDANCE_SETTINGS = {
    workStartTime: '09:30 AM',
    workEndTime: '06:00 PM',
    gracePeriodMinutes: 15,
    halfDayThresholdHours: 4.5,
    fullDayMinimumHours: 8.0,
    biometricSyncIntervalMinutes: 5,
    allowMobileGpsPunch: true,
    geofenceRadiusMeters: 500,
};

export const INITIAL_LEAVE_SETTINGS = {
    // Opening balances are as on this date; from the next month every month end credits these days (pro rata).
    openingBalanceDate: '2026-10-31',
    monthlyAccrual: { PL: 1, CL: 0.5, SL: 0.5 },
    approvalLevels: 2,
    probationaryLeaveAllowed: false,
    companyHolidays: [],
};
export const INITIAL_PAYROLL_SETTINGS = {
    payPeriodStartDay: 1,
    salaryDisbursementDay: 30,
    pfDeductionPercentage: 12.0,
    esiEmployerPercentage: 3.25,
    esiEmployeePercentage: 0.75,
    professionalTaxMonthly: 200,
    currency: 'INR (₹)',
};
