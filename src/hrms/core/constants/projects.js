import { storage } from '../storage/storage.js';

export const PROJECT_METADATA = {
    'Bhilwara Lead-Zinc Core Drilling': {
        code: 'PRJ-BHIL-01',
        client: 'Vedanta Mining Resources Ltd',
        location: 'Bhilwara Site Office, Rajasthan',
        siteType: 'Active Mining & Drilling Site',
        category: 'Mineral Exploration & Core Logging',
        leadName: 'Rajesh Sharma',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
        desc: 'Deep HQ diamond core drilling, mineralized zone intercept logging, and geochemical composite assays.',
    },
    'Jaipur Ring Road Drone Photogrammetry': {
        code: 'PRJ-JPR-02',
        client: 'NHAI & Jaipur Development Authority',
        location: 'Jaipur Corporate HQ, Rajasthan',
        siteType: 'UAV Aerial Flight Base',
        category: 'GIS, Remote Sensing & UAV',
        leadName: 'Vikramaditya Rathore',
        badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
        desc: 'High-resolution orthomosaic mapping, digital surface modeling (DSM), and infrastructure corridor LiDAR analysis.',
    },
    'Khetri Copper Belt Reconnaissance': {
        code: 'PRJ-KHT-03',
        client: 'Hindustan Copper Corp',
        location: 'Remote / Field Exploration Camp',
        siteType: 'Remote Exploration Camp',
        category: 'Geophysical & Structural Survey',
        leadName: 'Harsh Vardhan Jain',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
        desc: 'Subsurface resistivity profiling, outcrop rock chip sampling, and structural geological boundary mapping.',
    },
    'Udaipur Rock Phosphate Assessment': {
        code: 'PRJ-UDP-04',
        client: 'Rajasthan State Mines & Minerals (RSMM)',
        location: 'Udaipur Exploration Base, Rajasthan',
        siteType: 'Field Hydrogeology Site',
        category: 'Hydrogeology & Resource Estimation',
        leadName: 'Dr. Sunita Meena',
        badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
        desc: 'Aquifer pump tests, phosphate seam stratigraphic correlation, and environmental baseline hydro-chemistry.',
    },
    'Corporate Operations & Governance': {
        code: 'PRJ-CORP-00',
        client: 'Bansal Geo Corporate HQ',
        location: 'Jaipur Corporate HQ, Rajasthan',
        siteType: 'Executive Headquarters',
        category: 'Executive Management & Administration',
        leadName: 'Dr. Amit Kumar Bansal',
        badgeClass: 'bg-teal-50 dark:bg-teal-950/40 text-[#1F6F78] dark:text-teal-400 border-teal-200 dark:border-teal-800/40',
        desc: 'Corporate governance, central financial planning, HR onboarding, statutory audits, and client relations.',
    },
};

export const DEPARTMENT_METADATA = {
    'Geology & Mineral Exploration': {
        code: 'GEO-DIV',
        headName: 'Dr. Amit Kumar Bansal',
        base: 'Jaipur HQ / Bhilwara Field',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
        desc: 'Mineral reconnaissance, borehole diamond drilling, geological block modeling, and resource estimation.',
    },
    'Mining & Mine Planning': {
        code: 'MIN-DIV',
        headName: 'Rajesh Sharma',
        base: 'Bhilwara Site Office',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
        desc: 'Open-cast & underground mine planning, pit optimization, slope stability, and statutory mine plans.',
    },
    'GIS, Remote Sensing & UAV': {
        code: 'GIS-DIV',
        headName: 'Vikramaditya Rathore',
        base: 'Jaipur Corporate HQ',
        badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
        desc: 'Drone photogrammetry, satellite multispectral imagery, thematic mapping, and web-GIS database architectures.',
    },
    'Hydrogeology & Groundwater': {
        code: 'HYD-DIV',
        headName: 'Dr. Sunita Meena',
        base: 'Udaipur Exploration Base',
        badgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
        desc: 'Groundwater potential zone mapping, rainwater harvesting structures, pumping tests, and CGWA compliance.',
    },
    'Finance & Mineral Economics': {
        code: 'FIN-DIV',
        headName: 'Chhavi Bansal',
        base: 'Jaipur Corporate HQ',
        badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
        desc: 'Mineral project financial appraisal, client invoicing, cash flow management, taxation, and statutory audits.',
    },
    'Human Resources & Admin': {
        code: 'HRA-DIV',
        headName: 'Kritika Gupta',
        base: 'Jaipur Corporate HQ',
        badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
        desc: 'Talent recruitment, employee lifecycle, site camp logistics, attendance, payroll, and statutory EPF/ESI filing.',
    },
};

// Helper: Ensure 100% reliable project assignment for any employee
export const getEmployeeProject = (emp) => {
    if (!emp) return 'Corporate Operations & Governance';
    if (emp.employment?.project)
        return emp.employment.project;
    const id = emp.employeeId;
    if (id === 'BGS-001' || id === 'BGS-002' || id === 'BGS-004' || id === 'BGS-010') {
        return 'Corporate Operations & Governance';
    }
    if (id === 'BGS-003' || id === 'BGS-006' || id === 'BGS-062') {
        return 'Bhilwara Lead-Zinc Core Drilling';
    }
    if (id === 'BGS-005' || id === 'BGS-007') {
        return 'Jaipur Ring Road Drone Photogrammetry';
    }
    if (id === 'BGS-008') {
        return 'Udaipur Rock Phosphate Assessment';
    }
    if (id === 'BGS-009') {
        return 'Khetri Copper Belt Reconnaissance';
    }
    const loc = emp.employment?.workLocation || '';
    const dept = emp.employment?.department || '';
    if (loc.includes('Bhilwara'))
        return 'Bhilwara Lead-Zinc Core Drilling';
    if (loc.includes('Udaipur'))
        return 'Udaipur Rock Phosphate Assessment';
    if (dept.includes('GIS') || dept.includes('Remote'))
        return 'Jaipur Ring Road Drone Photogrammetry';
    if (dept.includes('Mining'))
        return 'Bhilwara Lead-Zinc Core Drilling';
    if (dept.includes('Hydrogeology'))
        return 'Udaipur Rock Phosphate Assessment';
    if (loc.includes('Field'))
        return 'Khetri Copper Belt Reconnaissance';
    return 'Corporate Operations & Governance';
};

export const STANDARD_PROJECTS = [
    'Bhilwara Lead-Zinc Core Drilling',
    'Jaipur Ring Road Drone Photogrammetry',
    'Khetri Copper Belt Reconnaissance',
    'Udaipur Rock Phosphate Assessment',
    'Corporate Operations & Governance',
];

export const getEmployeeProjectById = (empId) => {
    const employees = storage.getEmployees();
    const emp = employees.find(e => e.employeeId === empId || e.id === empId);
    if (emp)
        return getEmployeeProject(emp);
    if (empId === 'BGS-001' || empId === 'BGS-002' || empId === 'BGS-004' || empId === 'BGS-010') {
        return 'Corporate Operations & Governance';
    }
    if (empId === 'BGS-003' || empId === 'BGS-006' || empId === 'BGS-062') {
        return 'Bhilwara Lead-Zinc Core Drilling';
    }
    if (empId === 'BGS-005' || empId === 'BGS-007') {
        return 'Jaipur Ring Road Drone Photogrammetry';
    }
    if (empId === 'BGS-008') {
        return 'Udaipur Rock Phosphate Assessment';
    }
    if (empId === 'BGS-009') {
        return 'Khetri Copper Belt Reconnaissance';
    }
    return 'Corporate Operations & Governance';
};
