const STORAGE_KEY = 'bgs_employee_exit_requests';

const INITIAL_EXITS = [
    {
        id: 'exit-001',
        employeeId: 'BGS/11',
        employeeName: 'Pradeep Chand',
        department: 'Mineral Exploration',
        designation: 'Intern (Surveyor)',
        avatar: '',
        exitType: 'Internship Completion',
        resignationDate: '2026-03-01',
        requestedLWD: '2026-03-31',
        approvedLWD: '2026-03-31',
        noticePeriodDays: 30,
        noticeServedDays: 30,
        reason: 'Completion of official 6-month survey & mining field internship curriculum.',
        status: 'In Clearance',
        exitInterviewDone: true,
        exitInterviewFeedback: 'Valuable hands-on survey training in Total Station & GPS navigation under Inder Nogiya. Highly recommended for full-time hiring upon graduation.',
        clearances: [
            {
                id: 'c1',
                department: 'Survey Assets & Field Tools',
                reviewerName: 'Inder Nogiya (Manager Survey)',
                status: 'Approved',
                clearanceDate: '2026-03-28',
                checklistNotes: 'Optical Level Kit 32X, prism poles, and field fieldbook returned in good condition.',
            },
            {
                id: 'c2',
                department: 'Administration & Access',
                reviewerName: 'Kritika Gupta (HR & Operations Lead)',
                status: 'Approved',
                clearanceDate: '2026-03-29',
                checklistNotes: 'Office ID card, biometric enrollment, and camp locker key surrendered.',
            },
            {
                id: 'c3',
                department: 'Executive Director Approval',
                reviewerName: 'Dharmendra Goyal (Executive Director)',
                status: 'Pending',
                checklistNotes: 'Reviewing completion certificate and final stipend voucher clearance.',
                pendingDuesOrAssets: 'Final stipend settlement processing',
            },
            {
                id: 'c4',
                department: 'Managing Director Oversight',
                reviewerName: 'Dr. Amit Kumar Bansal (Managing Director)',
                status: 'Pending',
                checklistNotes: 'Final sign-off on internship performance certificate.',
            },
        ],
        settlement: {
            payableAmount: 18000,
            deductions: 0,
            netPayable: 18000,
            status: 'Processing',
        },
    },
];

export const exitService = {
    getAll: async () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error(e);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EXITS));
        return INITIAL_EXITS;
    },

    getById: async (id) => {
        const list = await exitService.getAll();
        return list.find((e) => e.id === id) || null;
    },

    save: async (exitRecord) => {
        const list = await exitService.getAll();
        const existingIdx = list.findIndex((e) => e.id === exitRecord.id);
        if (existingIdx >= 0) {
            list[existingIdx] = exitRecord;
        } else {
            list.unshift(exitRecord);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return exitRecord;
    },
};
