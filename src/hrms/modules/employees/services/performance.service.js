const STORAGE_KEY = 'bgs_performance_appraisals';

const INITIAL_APPRAISALS = [
    {
        id: 'appr-001',
        employeeId: 'BGS/04',
        employeeName: 'Vikas Verma',
        department: 'Mining & Survey',
        designation: 'Surveyor',
        avatar: '',
        reviewCycle: 'Annual Appraisal FY 2025-26',
        reviewerName: 'Inder Nogiya',
        reviewerDesignation: 'Manager (Survey)',
        overallScore: 4.8,
        goalsAchievementPercent: 96,
        rating: 'Outstanding',
        status: 'HR Finalized',
        reviewDate: '2026-04-15',
        goals: [
            { id: 'g1', title: 'Topographic Boundary Delineation', description: 'Delivered accurate polygon boundary surveys for mining blocks', weightage: 40, targetScore: 5, achievedScore: 4.9 },
            { id: 'g2', title: 'Total Station TS07 Field Calibration', description: 'Maintained zero optical error across 85 field baseline checkpoints', weightage: 30, targetScore: 5, achievedScore: 4.8 },
            { id: 'g3', title: 'Field Camp HSE Protocols', description: 'Zero safety incidents across mining concession mapping sites', weightage: 30, targetScore: 5, achievedScore: 4.7 },
        ],
        strengths: 'Fast baseline setups, meticulous boundary traverse checks, proactive technical teamwork.',
        areasOfImprovement: 'Expand skills into automated point cloud filtering in GIS.',
        managerFeedback: 'Exceptional field precision and commitment. Highly recommended for Senior Surveyor role and incentive bonus.',
        promotionRecommended: true,
        bonusMultiplier: 1.25,
    },
    {
        id: 'appr-002',
        employeeId: 'BGS/09',
        employeeName: 'Balveer Singh Yadav',
        department: 'Mineral Exploration',
        designation: 'Jr. Geologist',
        avatar: '',
        reviewCycle: 'Annual Appraisal FY 2025-26',
        reviewerName: 'Dr. Amit Kumar Bansal',
        reviewerDesignation: 'Managing Director & Chief Geologist',
        overallScore: 4.6,
        goalsAchievementPercent: 92,
        rating: 'Exceeds Expectations',
        status: 'HR Finalized',
        reviewDate: '2026-04-18',
        goals: [
            { id: 'g4', title: 'Drill Core Geological Logging', description: 'Characterized lithological boundaries and mineralized zones accurately', weightage: 40, targetScore: 5, achievedScore: 4.7 },
            { id: 'g5', title: 'Geochemical Soil & Rock Chip Sampling', description: '100% adherence to QA/QC standard duplicate protocols', weightage: 30, targetScore: 5, achievedScore: 4.6 },
            { id: 'g6', title: 'Exploration Resource Synthesis', description: 'Timely synthesis of field cross-sections for preliminary reports', weightage: 30, targetScore: 5, achievedScore: 4.5 },
        ],
        strengths: 'Strong structural geology field instincts, excellent lithological identification, energetic camp attitude.',
        areasOfImprovement: 'Further practice in 3D geological modeling software.',
        managerFeedback: 'Very promising geologist with strong potential. Commended for diligent field logging.',
        promotionRecommended: false,
        bonusMultiplier: 1.15,
    },
    {
        id: 'appr-003',
        employeeId: 'BGS/12',
        employeeName: 'Madhurika Saini',
        department: 'Mineral Exploration',
        designation: 'Sr. GIS Analyst',
        avatar: '',
        reviewCycle: 'Annual Appraisal FY 2025-26',
        reviewerName: 'Dharmendra Goyal',
        reviewerDesignation: 'Executive Director',
        overallScore: 4.9,
        goalsAchievementPercent: 98,
        rating: 'Outstanding',
        status: 'HR Finalized',
        reviewDate: '2026-04-20',
        goals: [
            { id: 'g7', title: 'Spatial Data Geodatabase Structuring', description: 'Organized enterprise GIS geodatabases with topological validation', weightage: 40, targetScore: 5, achievedScore: 5.0 },
            { id: 'g8', title: 'Thematic Mineral Concession Mapping', description: 'Prepared publication-ready cadastral and geological overlays', weightage: 35, targetScore: 5, achievedScore: 4.9 },
            { id: 'g9', title: 'Client Map Portal Integration', description: 'Delivered web map layers ahead of statutory submission deadlines', weightage: 25, targetScore: 5, achievedScore: 4.8 },
        ],
        strengths: 'Mastery in spatial analysis, high cartographic precision, efficient automation workflows.',
        areasOfImprovement: 'Mentorship of junior interns on Python GIS automation.',
        managerFeedback: 'Outstanding analytical rigor and dedication. Core contributor to client project deliverables.',
        promotionRecommended: true,
        bonusMultiplier: 1.30,
    },
];

export const performanceService = {
    getAll: async () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error(e);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPRAISALS));
        return INITIAL_APPRAISALS;
    },

    getByEmployeeId: async (employeeId) => {
        const list = await performanceService.getAll();
        return list.filter((a) => a.employeeId === employeeId);
    },

    save: async (appraisal) => {
        const list = await performanceService.getAll();
        const existingIdx = list.findIndex((a) => a.id === appraisal.id);
        if (existingIdx >= 0) {
            list[existingIdx] = appraisal;
        } else {
            list.unshift(appraisal);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return appraisal;
    },
};
