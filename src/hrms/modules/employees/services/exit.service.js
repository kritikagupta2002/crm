const STORAGE_KEY = 'bgs_employee_exit_requests';
const INITIAL_EXITS = [
    {
        id: 'exit-001',
        employeeId: 'BGS-024',
        employeeName: 'Deepak Chouhan',
        department: 'Geology & Mineral Exploration',
        designation: 'Field Geologist',
        avatar: '',
        exitType: 'Resignation',
        resignationDate: '2026-08-15',
        requestedLWD: '2026-09-15',
        approvedLWD: '2026-09-15',
        noticePeriodDays: 30,
        noticeServedDays: 30,
        reason: 'Higher studies in Geoinformatics abroad (University of Leeds).',
        status: 'In Clearance',
        exitInterviewDone: true,
        exitInterviewFeedback: 'Great field experience, excellent mentorship from Senior Geologist. Recommended for rehire after Masters.',
        clearances: [
            {
                id: 'c1',
                department: 'IT',
                reviewerName: 'Aman Jain (Systems Admin)',
                status: 'Approved',
                clearanceDate: '2026-09-12',
                checklistNotes: 'Dell Rugged Latitude laptop, SIM card, and company email access revoked.',
            },
            {
                id: 'c2',
                department: 'Admin & Assets',
                reviewerName: 'Dr. Sunita Meena (Admin Exec)',
                status: 'Approved',
                clearanceDate: '2026-09-14',
                checklistNotes: 'Company ID badge, camp locker key, and safety helmet returned in good order.',
            },
            {
                id: 'c3',
                department: 'Finance & Accounts',
                reviewerName: 'Dr. Amit Bansal (Director)',
                status: 'Pending',
                checklistNotes: 'Verifying final site imprest bills (₹4,200 pending submission).',
                pendingDuesOrAssets: '₹4,200 Imprest voucher adjustment',
            },
            {
                id: 'c4',
                department: 'HR & Legal',
                reviewerName: 'Kritika Gupta (Head HR)',
                status: 'Pending',
                checklistNotes: 'Awaiting finance clearance sign-off to execute F&F statement.',
            },
        ],
        fnf: {
            id: 'fnf-001',
            exitRequestId: 'exit-001',
            employeeId: 'BGS-024',
            payableDaysSalary: 28500,
            leaveEncashmentAmount: 14250,
            gratuityAmount: 0,
            annualBonusAmount: 5000,
            grossPayable: 47750,
            noticeShortfallDeduction: 0,
            unsettledAdvanceDeduction: 4200,
            taxTdsDeduction: 1200,
            totalDeductions: 5400,
            netPayable: 42350,
            paymentStatus: 'Pending',
        },
        relievingLetterIssued: false,
    },
    {
        id: 'exit-002',
        employeeId: 'BGS-039',
        employeeName: 'Anil Kumar',
        department: 'Finance & Accounts',
        designation: 'Senior Accountant',
        avatar: '',
        exitType: 'Resignation',
        resignationDate: '2026-07-01',
        requestedLWD: '2026-07-31',
        approvedLWD: '2026-07-31',
        noticePeriodDays: 30,
        noticeServedDays: 30,
        reason: 'Relocating to home town (Kota) due to family reasons.',
        status: 'Settled & Relieved',
        exitInterviewDone: true,
        exitInterviewFeedback: 'Positive parting terms. Completed thorough handover of Tally GST books.',
        clearances: [
            { id: 'c5', department: 'IT', reviewerName: 'Aman Jain', status: 'Approved', clearanceDate: '2026-07-28', checklistNotes: 'System access and banking tokens safely returned.' },
            { id: 'c6', department: 'Admin & Assets', reviewerName: 'Dr. Sunita Meena', status: 'Approved', clearanceDate: '2026-07-29', checklistNotes: 'ID card and desk keys surrendered.' },
            { id: 'c7', department: 'Finance & Accounts', reviewerName: 'Kritika Gupta', status: 'Approved', clearanceDate: '2026-07-30', checklistNotes: 'Zero outstanding company loans or advances.' },
            { id: 'c8', department: 'HR & Legal', reviewerName: 'Kritika Gupta', status: 'Approved', clearanceDate: '2026-07-31', checklistNotes: 'All 4 clearances completed. Relieving letter generated.' },
        ],
        fnf: {
            id: 'fnf-002',
            exitRequestId: 'exit-002',
            employeeId: 'BGS-039',
            payableDaysSalary: 45000,
            leaveEncashmentAmount: 18000,
            gratuityAmount: 52000,
            annualBonusAmount: 10000,
            grossPayable: 125000,
            noticeShortfallDeduction: 0,
            unsettledAdvanceDeduction: 0,
            taxTdsDeduction: 4500,
            totalDeductions: 4500,
            netPayable: 120500,
            settlementDate: '2026-08-05',
            paymentStatus: 'Processed',
            bankReferenceNumber: 'HDFC-NEFT-99214482',
        },
        relievingLetterIssued: true,
    },
    {
        id: 'exit-003',
        employeeId: 'BGS-052',
        employeeName: 'Mohit Sharma',
        department: 'GIS & Remote Sensing',
        designation: 'Junior GIS Executive',
        avatar: '',
        exitType: 'Mutual Separation',
        resignationDate: '2026-09-01',
        requestedLWD: '2026-09-30',
        approvedLWD: '2026-09-30',
        noticePeriodDays: 30,
        noticeServedDays: 20,
        reason: 'Career transition into spatial software web development.',
        status: 'In Clearance',
        exitInterviewDone: false,
        clearances: [
            { id: 'c9', department: 'IT', reviewerName: 'Aman Jain', status: 'Pending', checklistNotes: 'GIS workstation software license audit in progress.' },
            { id: 'c10', department: 'Admin & Assets', reviewerName: 'Dr. Sunita Meena', status: 'Approved', clearanceDate: '2026-09-18', checklistNotes: 'Biometric registration deactivation scheduled.' },
            { id: 'c11', department: 'Finance & Accounts', reviewerName: 'Kritika Gupta', status: 'Approved', clearanceDate: '2026-09-20', checklistNotes: 'Zero dues.' },
            { id: 'c12', department: 'HR & Legal', reviewerName: 'Kritika Gupta', status: 'Pending', checklistNotes: 'Exit interview scheduled for 26th September.' },
        ],
        fnf: {
            id: 'fnf-003',
            exitRequestId: 'exit-003',
            employeeId: 'BGS-052',
            payableDaysSalary: 32000,
            leaveEncashmentAmount: 6400,
            gratuityAmount: 0,
            annualBonusAmount: 0,
            grossPayable: 38400,
            noticeShortfallDeduction: 0,
            unsettledAdvanceDeduction: 0,
            taxTdsDeduction: 800,
            totalDeductions: 800,
            netPayable: 37600,
            paymentStatus: 'Pending',
        },
        relievingLetterIssued: false,
    },
];
export const exitService = {
    getExits: async () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EXITS));
                return INITIAL_EXITS;
            }
            return JSON.parse(data);
        }
        catch {
            return INITIAL_EXITS;
        }
    },
    getExitByEmployee: async (employeeId) => {
        const list = await exitService.getExits();
        return list.find((e) => e.employeeId === employeeId);
    },
    initiateExit: async (data) => {
        const list = await exitService.getExits();
        const newExit = {
            ...data,
            id: `exit-${Date.now()}`,
            relievingLetterIssued: false,
            clearances: [
                { id: `c-${Date.now()}-1`, department: 'IT', reviewerName: 'Aman Jain', status: 'Pending', checklistNotes: 'Hardware and account de-provisioning' },
                { id: `c-${Date.now()}-2`, department: 'Admin & Assets', reviewerName: 'Dr. Sunita Meena', status: 'Pending', checklistNotes: 'ID card, access fob & company gear' },
                { id: `c-${Date.now()}-3`, department: 'Finance & Accounts', reviewerName: 'Kritika Gupta', status: 'Pending', checklistNotes: 'Imprest bills and travel advance reconciliation' },
                { id: `c-${Date.now()}-4`, department: 'HR & Legal', reviewerName: 'Kritika Gupta', status: 'Pending', checklistNotes: 'Exit interview and non-disclosure signoff' },
            ],
        };
        list.unshift(newExit);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return newExit;
    },
    updateClearance: async (exitId, department, status, notes) => {
        const list = await exitService.getExits();
        const exitIndex = list.findIndex((e) => e.id === exitId);
        if (exitIndex === -1)
            throw new Error('Exit request not found');
        const exit = { ...list[exitIndex] };
        exit.clearances = exit.clearances.map((c) => c.department === department
            ? {
                ...c,
                status,
                checklistNotes: notes,
                clearanceDate: new Date().toLocaleDateString('en-CA'),
            }
            : c);
        // If all 4 approved, advance status to 'FnF Pending'
        const allApproved = exit.clearances.every((c) => c.status === 'Approved');
        if (allApproved && exit.status === 'In Clearance') {
            exit.status = 'FnF Pending';
        }
        list[exitIndex] = exit;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return exit;
    },
    finalizeFnF: async (exitId, bankReference) => {
        const list = await exitService.getExits();
        const exitIndex = list.findIndex((e) => e.id === exitId);
        if (exitIndex === -1)
            throw new Error('Exit request not found');
        const exit = { ...list[exitIndex] };
        if (exit.fnf) {
            exit.fnf = {
                ...exit.fnf,
                paymentStatus: 'Processed',
                settlementDate: new Date().toLocaleDateString('en-CA'),
                bankReferenceNumber: bankReference || `BGS-NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
            };
        }
        exit.status = 'Settled & Relieved';
        exit.relievingLetterIssued = true;
        list[exitIndex] = exit;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return exit;
    },
    getStats: async () => {
        const list = await exitService.getExits();
        const activeExits = list.filter((e) => e.status !== 'Settled & Relieved' && e.status !== 'Revoked').length;
        let pendingClearances = 0;
        list.forEach((e) => {
            if (e.status === 'In Clearance' || e.status === 'Initiated') {
                pendingClearances += e.clearances.filter((c) => c.status === 'Pending').length;
            }
        });
        const completedThisQuarter = list.filter((e) => e.status === 'Settled & Relieved').length;
        const avgNoticeCompliancePercent = 95;
        return {
            activeExits,
            pendingClearances,
            completedThisQuarter,
            avgNoticeCompliancePercent,
        };
    },
};
