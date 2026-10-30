import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';
import { postgres } from './postgres.js';
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
      name: 'Dr. Amit Kumar Bansal',
      email: 'amit.bansal@bansalgeo.com',
      password: 'demo',
      role: 'Managing Director',
      employeeId: 'BGS/DIR-01',
    },
    {
      id: 'usr-2',
      name: 'Dharmendra Goyal',
      email: 'dharmendra.goyal@bansalgeo.com',
      password: 'demo',
      role: 'Director',
      employeeId: 'BGS/DIR-03',
    },
    {
      id: 'usr-3',
      name: 'Kritika Gupta',
      email: 'kritika.gupta@bansalgeo.com',
      password: 'demo',
      role: 'Super Admin',
      employeeId: 'BGS/ADM-01',
    },
    {
      id: 'usr-4',
      name: 'Inder Nogiya',
      email: 'inder.nogiya@bansalgeo.com',
      password: 'demo',
      role: 'Manager',
      employeeId: 'BGS/01',
    },
    {
      id: 'usr-5',
      name: 'Vikas Verma',
      email: 'vikas.verma@bansalgeo.com',
      password: 'demo',
      role: 'Employee',
      employeeId: 'BGS/04',
    },
    {
      id: 'usr-6',
      name: 'Kuldip Singh',
      email: 'kuldip.singh@bansalgeo.com',
      password: 'demo',
      role: 'Employee',
      employeeId: 'BGS/05',
    },
    {
      id: 'usr-7',
      name: 'Balveer Singh Yadav',
      email: 'balveer.singh@bansalgeo.com',
      password: 'demo',
      role: 'Employee',
      employeeId: 'BGS/09',
    },
    {
      id: 'usr-8',
      name: 'Vishal Kumawat',
      email: 'vishal.kumawat@bansalgeo.com',
      password: 'demo',
      role: 'Employee',
      employeeId: 'BGS/10',
    },
    {
      id: 'usr-9',
      name: 'Pradeep Chand',
      email: 'pradeep.chand@bansalgeo.com',
      password: 'demo',
      role: 'Employee',
      employeeId: 'BGS/11',
    },
    {
      id: 'usr-10',
      name: 'Madhurika Saini',
      email: 'madhurikasaini@bansalgeo.com',
      password: 'demo',
      role: 'Employee',
      employeeId: 'BGS/12',
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
      employeeId: 'BGS/10',
      employeeName: 'Vishal Kumawat',
      department: 'Mineral Exploration',
      designation: 'Sr. Surveyor',
      reviewPeriod: 'FY 2025-26 Q3',
      reviewerName: 'Inder Nogiya',
      rating: 4.8,
      goalsAchieved: 'Successfully completed high-precision DGPS topo survey of Bhilwara mining belt ahead of schedule.',
      strengths: 'Fast baseline triangulation, Total Station proficiency, high field endurance.',
      areasForImprovement: 'Advanced UAV flight planning certification.',
      status: 'Completed',
      date: '2026-01-15',
    },
    {
      id: 'perf-2',
      employeeId: 'BGS/09',
      employeeName: 'Balveer Singh Yadav',
      department: 'Mineral Exploration',
      designation: 'Jr. Geologist',
      reviewPeriod: 'FY 2025-26 Q3',
      reviewerName: 'Dr. Amit Kumar Bansal',
      rating: 4.6,
      goalsAchieved: 'Mapped 60 sq km mineralized zone with detailed core logging and lithological correlation.',
      strengths: 'Precise lithology identification, rigorous sample custody.',
      areasForImprovement: '3D block modeling in GIS.',
      status: 'Completed',
      date: '2026-01-20',
    },
  ],
  exit_records: [
    {
      id: 'exit-1',
      employeeId: 'BGS/11',
      employeeName: 'Pradeep Chand',
      department: 'Mineral Exploration',
      designation: 'Intern (Surveyor)',
      resignationDate: '2026-03-01',
      lastWorkingDay: '2026-03-31',
      noticePeriodDays: 30,
      reason: 'Completion of 6-month survey & mining field internship curriculum.',
      status: 'In Progress',
      exitInterviewStatus: 'Completed',
      clearance: {
        admin: 'Approved',
        it: 'Approved',
        accounts: 'Pending',
        hr: 'Approved',
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
    this.initPostgres();
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
        this.readSync(collection);
      }
    }
  }

  async initPostgres() {
    try {
      await postgres.initPromise;
      if (postgres.isConnected()) {
        await postgres.seedIfEmpty(SEED_DATA);

        // Preload live tables from PostgreSQL
        const tables = ['employees', 'attendance', 'leaves', 'attendance_corrections', 'documents', 'users'];
        for (const t of tables) {
          const rows = await postgres.loadFromDb(t);
          if (Array.isArray(rows) && rows.length > 0) {
            this.cache.set(t, rows);
            this.writeSync(t, rows);
          }
        }
        console.log('⚡ [PostgreSQL] In-memory cache synchronized with live PostgreSQL database.');
      }
    } catch (e) {
      console.warn('[PostgreSQL Init Sync Notice]:', e.message);
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
      postgres.persistItem(collection, item);
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
      postgres.persistItem(collection, found);
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

