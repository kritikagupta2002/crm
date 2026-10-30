import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';
import {
  INITIAL_EMPLOYEES,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_ATTENDANCE,
  INITIAL_CORRECTIONS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_LEAVE_TYPES,
  INITIAL_LEAVE_BALANCES,
  INITIAL_SHIFTS,
  INITIAL_SHIFT_ASSIGNMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_ATTENDANCE_SETTINGS,
  INITIAL_LEAVE_SETTINGS,
  INITIAL_ROLES,
} from '../../src/hrms/data/index.js';

const SEED_DATA = {
  users: [
    {
      id: 'usr-1',
      name: 'Kritika Gupta',
      email: 'kritika.gupta@bansalgeo.com',
      password: 'demo', // Plain demo password; will match any demo login or 'demo'
      role: 'Super Admin',
      employeeId: 'BGS-002',
    },
    {
      id: 'usr-2',
      name: 'Dr. Sunita Meena',
      email: 'sunita.meena@bansalgeo.com',
      password: 'demo',
      role: 'Director',
      employeeId: 'BGS-003',
    },
    {
      id: 'usr-3',
      name: 'Kavita Rawat',
      email: 'kavita.rawat@bansalgeo.com',
      password: 'demo',
      role: 'Manager',
      employeeId: 'BGS-005',
    },
    {
      id: 'usr-4',
      name: 'Ravi Gurjar',
      email: 'ravi.gurjar@bansalgeo.com',
      password: 'demo',
      role: 'Employee',
      employeeId: 'BGS-008',
    },
  ],
  employees: INITIAL_EMPLOYEES,
  departments: INITIAL_DEPARTMENTS,
  designations: INITIAL_DESIGNATIONS,
  attendance: INITIAL_ATTENDANCE,
  corrections: INITIAL_CORRECTIONS,
  leaves: INITIAL_LEAVE_REQUESTS,
  leave_types: INITIAL_LEAVE_TYPES,
  leave_balances: INITIAL_LEAVE_BALANCES,
  shifts: INITIAL_SHIFTS,
  shift_assignments: INITIAL_SHIFT_ASSIGNMENTS,
  notifications: INITIAL_NOTIFICATIONS,
  company_settings: INITIAL_COMPANY_SETTINGS,
  attendance_settings: INITIAL_ATTENDANCE_SETTINGS,
  leave_settings: INITIAL_LEAVE_SETTINGS,
  performance_records: [
    {
      id: 'perf-1',
      employeeId: 'BGS-003',
      employeeName: 'Dr. Sunita Meena',
      department: 'Geology & Mineral Exploration',
      designation: 'Senior Geologist & Exploration Lead',
      reviewPeriod: 'FY 2025-26 Q3',
      reviewerName: 'Dr. Amit Kumar Bansal',
      rating: 4.8,
      goalsAchieved: 'Led Bhilwara base metal exploration ahead of schedule with 100% core recovery.',
      strengths: 'Exceptional geological field mapping, proactive team leadership.',
      areasForImprovement: 'Further exploration of automated GIS workflows.',
      status: 'Completed',
      date: '2026-01-15',
    },
    {
      id: 'perf-2',
      employeeId: 'BGS-008',
      employeeName: 'Ravi Gurjar',
      department: 'Remote Sensing & GIS',
      designation: 'Drone Operator & GIS Technician',
      reviewPeriod: 'FY 2025-26 Q3',
      reviewerName: 'Kavita Rawat',
      rating: 4.5,
      goalsAchieved: 'Successfully mapped 45 sq km terrain with high resolution orthomosaics.',
      strengths: 'Fast flight planning, meticulous equipment care.',
      areasForImprovement: 'Expand skills in 3D point cloud classification.',
      status: 'Completed',
      date: '2026-01-20',
    },
  ],
  exit_records: [
    {
      id: 'exit-1',
      employeeId: 'BGS-019',
      employeeName: 'Rajesh Sen',
      department: 'Administration & Field Support',
      designation: 'Field Assistant',
      resignationDate: '2026-01-10',
      lastWorkingDay: '2026-02-10',
      noticePeriodDays: 30,
      reason: 'Relocation to hometown for family personal reasons.',
      status: 'In Progress',
      exitInterviewStatus: 'Scheduled',
      clearance: {
        admin: 'Pending',
        it: 'Approved',
        accounts: 'Pending',
        hr: 'Pending',
      },
      fnfStatus: 'Pending',
    },
  ],
};

class JsonDb {
  constructor() {
    this.dir = config.dataDir;
    this.cache = new Map();
    this.ensureDir();
    this.initSeed();
  }

  ensureDir() {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  filePath(collection) {
    return path.join(this.dir, `${collection}.json`);
  }

  initSeed() {
    for (const [collection, data] of Object.entries(SEED_DATA)) {
      const file = this.filePath(collection);
      if (!fs.existsSync(file)) {
        this.writeSync(collection, data);
      } else {
        // Read into memory cache
        this.readSync(collection);
      }
    }
  }

  readSync(collection) {
    const file = this.filePath(collection);
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(raw);
        this.cache.set(collection, data);
        return data;
      }
    } catch (e) {
      console.error(`Error reading ${collection}:`, e);
    }
    const fallback = SEED_DATA[collection] || [];
    this.cache.set(collection, fallback);
    return fallback;
  }

  writeSync(collection, data) {
    const file = this.filePath(collection);
    this.cache.set(collection, data);
    const tempFile = `${file}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, file);
  }

  get(collection) {
    if (this.cache.has(collection)) {
      return this.cache.get(collection);
    }
    return this.readSync(collection);
  }

  set(collection, data) {
    this.writeSync(collection, data);
    return data;
  }

  find(collection, filterFn) {
    const all = this.get(collection);
    return Array.isArray(all) ? all.filter(filterFn) : [];
  }

  findOne(collection, filterFn) {
    const all = this.get(collection);
    return Array.isArray(all) ? all.find(filterFn) : null;
  }

  findById(collection, id) {
    const all = this.get(collection);
    if (!Array.isArray(all)) return null;
    return all.find((item) => item.id === id || item.employeeId === id) || null;
  }

  insert(collection, item) {
    const all = this.get(collection);
    if (Array.isArray(all)) {
      const updated = [item, ...all];
      this.set(collection, updated);
      return item;
    }
    return item;
  }

  update(collection, id, updates) {
    const all = this.get(collection);
    if (!Array.isArray(all)) return null;
    let found = null;
    const updated = all.map((item) => {
      if (item.id === id || item.employeeId === id) {
        found = { ...item, ...updates, updatedAt: new Date().toISOString() };
        return found;
      }
      return item;
    });
    if (found) {
      this.set(collection, updated);
    }
    return found;
  }

  remove(collection, id) {
    const all = this.get(collection);
    if (!Array.isArray(all)) return false;
    const filtered = all.filter((item) => item.id !== id && item.employeeId !== id);
    if (filtered.length !== all.length) {
      this.set(collection, filtered);
      return true;
    }
    return false;
  }
}

export const db = new JsonDb();
