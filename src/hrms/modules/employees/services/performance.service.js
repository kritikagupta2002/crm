const STORAGE_KEY = 'bgs_performance_appraisals';
const INITIAL_APPRAISALS = [
    {
        id: 'appr-001',
        employeeId: 'BGS-006',
        employeeName: 'Rohan Deshmukh',
        department: 'Geology & Mineral Exploration',
        designation: 'Senior Exploration Geologist',
        avatar: '',
        reviewCycle: 'Annual Appraisal FY 2025-26',
        reviewerName: 'Dr. Amit Bansal',
        reviewerDesignation: 'Managing Director',
        overallScore: 4.7,
        goalsAchievementPercent: 94,
        rating: 'Outstanding',
        status: 'HR Finalized',
        reviewDate: '2026-04-15',
        goals: [
            { id: 'g1', title: 'Bhilwara Core Logging & Assay', description: 'Delivered 1,200m drill core characterization within schedule', weightage: 30, targetScore: 5, achievedScore: 4.8 },
            { id: 'g2', title: 'JORC Resource Model Reporting', description: 'Co-authored compliant resource estimation report', weightage: 40, targetScore: 5, achievedScore: 4.7 },
            { id: 'g3', title: 'Site HSE Protocol Adherence', description: 'Zero lost time injuries across field camp assignments', weightage: 30, targetScore: 5, achievedScore: 4.6 },
        ],
        strengths: 'Exceptional structural geology field acumen, fast turnaround on complex mineral core logs, excellent junior geologist mentorship.',
        areasOfImprovement: 'Advanced geostatistical Leapfrog 3D modeling could be further refined with specialized training.',
        managerFeedback: 'Consistently exceptional contributor. Highly recommended for Senior Lead designation & performance bonus.',
        promotionRecommended: true,
        bonusMultiplier: 1.25,
    },
    {
        id: 'appr-002',
        employeeId: 'BGS-031',
        employeeName: 'Ravi Gurjar',
        department: 'GIS & Remote Sensing',
        designation: 'Senior UAV Drone Specialist',
        avatar: '',
        reviewCycle: 'Annual Appraisal FY 2025-26',
        reviewerName: 'Vikramaditya Rathore',
        reviewerDesignation: 'GIS Lead',
        overallScore: 4.5,
        goalsAchievementPercent: 90,
        rating: 'Exceeds Expectations',
        status: 'HR Finalized',
        reviewDate: '2026-04-18',
        goals: [
            { id: 'g4', title: 'Photogrammetry Orthomosaic Quality', description: 'Sub-centimeter GSD precision achieved across all mine surveys', weightage: 40, targetScore: 5, achievedScore: 4.6 },
            { id: 'g5', title: 'DGCA & Drone Compliance Safety', description: '100% DGCA flight logging without procedural non-conformity', weightage: 30, targetScore: 5, achievedScore: 4.7 },
            { id: 'g6', title: 'LiDAR Point Cloud Turnaround', description: 'Optimized DTM generation processing pipelines', weightage: 30, targetScore: 5, achievedScore: 4.2 },
        ],
        strengths: 'Outstanding drone piloting skills in challenging high-altitude terrain, proactive equipment maintenance and calibration.',
        areasOfImprovement: 'Explore automated thermal LiDAR extraction scripts.',
        managerFeedback: 'Exceptional field reliability and safety dedication. Strong leadership potential.',
        promotionRecommended: false,
        bonusMultiplier: 1.15,
    },
    {
        id: 'appr-003',
        employeeId: 'BGS-005',
        employeeName: 'Vikramaditya Rathore',
        department: 'GIS & Remote Sensing',
        designation: 'Lead Remote Sensing Specialist',
        avatar: '',
        reviewCycle: 'Annual Appraisal FY 2025-26',
        reviewerName: 'Dr. Amit Bansal',
        reviewerDesignation: 'Managing Director',
        overallScore: 4.8,
        goalsAchievementPercent: 96,
        rating: 'Outstanding',
        status: 'HR Finalized',
        reviewDate: '2026-04-20',
        goals: [
            { id: 'g7', title: 'Enterprise GIS Geospatial Server', description: 'Architected company-wide spatial database on PostGIS/QGIS', weightage: 40, targetScore: 5, achievedScore: 4.9 },
            { id: 'g8', title: 'Client Mineral Target Delivery', description: 'Delivered 8 high-probability prospecting lease targets', weightage: 35, targetScore: 5, achievedScore: 4.8 },
            { id: 'g9', title: 'Team Capability Development', description: 'Trained 6 analysts on satellite hyperspectral processing', weightage: 25, targetScore: 5, achievedScore: 4.7 },
        ],
        strengths: 'Pivotal spatial technology architect for the firm. Delivers unmatched client value in multispectral prospecting.',
        areasOfImprovement: 'Delegate routine vector data ingestion to junior GIS engineers.',
        managerFeedback: 'Cornerstone technical leader of the geospatial division. Top-tier rating awarded.',
        promotionRecommended: true,
        bonusMultiplier: 1.3,
    },
    {
        id: 'appr-004',
        employeeId: 'BGS-017',
        employeeName: 'Karan Mehta',
        department: 'Geology & Mineral Exploration',
        designation: 'Field Exploration Executive',
        avatar: '',
        reviewCycle: 'Mid-Year Review 2026',
        reviewerName: 'Rohan Deshmukh',
        reviewerDesignation: 'Senior Exploration Geologist',
        overallScore: 3.9,
        goalsAchievementPercent: 78,
        rating: 'Meets Expectations',
        status: 'Manager Review',
        reviewDate: '2026-09-10',
        goals: [
            { id: 'g10', title: 'Rock Chip & Soil Sampling Grid', description: 'Collected 450 geo-referenced samples across Udaipur Block', weightage: 50, targetScore: 5, achievedScore: 4.0 },
            { id: 'g11', title: 'Field Ledger Digitization', description: 'Daily data sync to centralized ERP system', weightage: 50, targetScore: 5, achievedScore: 3.8 },
        ],
        strengths: 'Very hardworking, high stamina in remote bush camps, good relations with local field crews.',
        areasOfImprovement: 'Needs to improve QA/QC protocol duplicate insertion frequency in chain-of-custody bags.',
        managerFeedback: 'Solid field contributor progressing well towards independent charge.',
        promotionRecommended: false,
        bonusMultiplier: 1.0,
    },
    {
        id: 'appr-005',
        employeeId: 'BGS-044',
        employeeName: 'Aman Jain',
        department: 'HR & Administration',
        designation: 'Associate Systems Specialist',
        avatar: '',
        reviewCycle: 'Probation Review 2026',
        reviewerName: 'Kritika Gupta',
        reviewerDesignation: 'Head - HR & Administration',
        overallScore: 4.2,
        goalsAchievementPercent: 84,
        rating: 'Exceeds Expectations',
        status: 'Self-Appraisal',
        reviewDate: '2026-09-15',
        goals: [
            { id: 'g12', title: 'HRMS Onboarding Automation', description: 'Reduced employee registration onboarding turnaround by 40%', weightage: 60, targetScore: 5, achievedScore: 4.3 },
            { id: 'g13', title: 'Biometric Machine Sync Reliability', description: 'Configured scheduled API bridges for eSSL devices', weightage: 40, targetScore: 5, achievedScore: 4.1 },
        ],
        strengths: 'Quick learner, proactive system troubleshooting, patient with employee queries.',
        areasOfImprovement: 'Expand knowledge of statutory labour compliance filing deadlines.',
        managerFeedback: 'Excellent performance during 6-month probation. Recommend confirmation of employment.',
        promotionRecommended: false,
        bonusMultiplier: 1.05,
    },
];
export const performanceService = {
    getAppraisals: async () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPRAISALS));
                return INITIAL_APPRAISALS;
            }
            return JSON.parse(data);
        }
        catch {
            return INITIAL_APPRAISALS;
        }
    },
    getAppraisalsByEmployee: async (employeeId) => {
        const list = await performanceService.getAppraisals();
        return list.filter((a) => a.employeeId === employeeId);
    },
    createAppraisal: async (appraisal) => {
        const list = await performanceService.getAppraisals();
        const newRecord = {
            ...appraisal,
            id: `appr-${Date.now()}`,
        };
        list.unshift(newRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return newRecord;
    },
    updateAppraisal: async (id, updates) => {
        const list = await performanceService.getAppraisals();
        const index = list.findIndex((a) => a.id === id);
        if (index === -1)
            throw new Error('Appraisal not found');
        const updated = { ...list[index], ...updates };
        list[index] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return updated;
    },
    getStats: async () => {
        const list = await performanceService.getAppraisals();
        const totalAppraisals = list.length;
        const totalScore = list.reduce((acc, a) => acc + a.overallScore, 0);
        const averageScore = totalAppraisals > 0 ? Number((totalScore / totalAppraisals).toFixed(2)) : 0;
        const completed = list.filter((a) => a.status === 'HR Finalized').length;
        const completedPercent = totalAppraisals > 0 ? Math.round((completed / totalAppraisals) * 100) : 0;
        const topPerformersCount = list.filter((a) => a.rating === 'Outstanding').length;
        const ratingDistribution = {
            'Outstanding': 0,
            'Exceeds Expectations': 0,
            'Meets Expectations': 0,
            'Needs Improvement': 0,
            'Unsatisfactory': 0,
        };
        list.forEach((a) => {
            if (ratingDistribution[a.rating] !== undefined) {
                ratingDistribution[a.rating]++;
            }
        });
        return {
            totalAppraisals,
            averageScore,
            completedPercent,
            topPerformersCount,
            ratingDistribution,
        };
    },
};
