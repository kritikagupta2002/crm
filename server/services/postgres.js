import pg from 'pg';
import { today } from './dates.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';
import { writeContext } from './writeContext.js';

const { Pool, types } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DATE columns come back as 'YYYY-MM-DD' strings. Parsing them into JS Dates shifted every date one day back
// once converted to UTC (India is UTC+5:30).
types.setTypeParser(1082, (value) => value);

/* Collections stored row by row in their own tables. Everything else lives in the `collections` table. */
export const TABLE_COLLECTIONS = ['users', 'employees', 'attendance', 'leaves', 'corrections', 'employee_documents'];

const iso = (value) => (value instanceof Date ? value.toISOString() : value ?? null);
const json = (value) => JSON.stringify(value ?? {});

/*
 * One definition per table collection: how to read a row back into the API's record shape, how to upsert a
 * record, and which column identifies it for deletes.
 */
const TABLES = {
  users: {
    table: 'users',
    key: 'id',
    select: 'SELECT * FROM users ORDER BY id',
    fromRow: (r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      employeeId: r.employee_id,
      // Only bcrypt hashes are treated as passwords; anything else (legacy plain text) cannot be used to sign in.
      passwordHash: typeof r.password_hash === 'string' && r.password_hash.startsWith('$2') ? r.password_hash : null,
      status: r.status || 'Active',
      tokenVersion: r.token_version || 0,
      mustChangePassword: r.must_change_password !== false,
      lastLoginAt: iso(r.last_login_at),
      passwordChangedAt: iso(r.password_changed_at),
      permissions: Array.isArray(r.permissions) ? r.permissions : null,
    }),
    upsert: (u) => [
      `INSERT INTO users (id, name, email, password_hash, role, employee_id, status, token_version, must_change_password, last_login_at, password_changed_at, permissions, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, password_hash=EXCLUDED.password_hash,
         role=EXCLUDED.role, employee_id=EXCLUDED.employee_id, status=EXCLUDED.status, token_version=EXCLUDED.token_version,
         must_change_password=EXCLUDED.must_change_password, last_login_at=EXCLUDED.last_login_at,
         password_changed_at=EXCLUDED.password_changed_at, permissions=EXCLUDED.permissions, updated_at=CURRENT_TIMESTAMP`,
      [u.id, u.name, u.email, u.passwordHash || null, u.role, u.employeeId || null, u.status || 'Active', u.tokenVersion || 0,
        u.mustChangePassword !== false, u.lastLoginAt || null, u.passwordChangedAt || null,
        Array.isArray(u.permissions) ? JSON.stringify(u.permissions) : null],
    ],
  },

  employees: {
    table: 'employees',
    key: 'id',
    select: 'SELECT * FROM employees ORDER BY employee_id',
    fromRow: (r) => (r.data && Object.keys(r.data).length ? r.data : {
      id: r.id,
      employeeId: r.employee_id,
      name: r.name,
      status: r.status,
      avatarUrl: r.avatar_url,
      contact: { workEmail: r.email, phone: r.phone },
      employment: { department: r.department, designation: r.designation, joiningDate: r.joining_date, employmentType: r.employment_type, workLocation: r.work_location },
    }),
    upsert: (e) => [
      `INSERT INTO employees (id, employee_id, name, email, phone, department, designation, role, status, avatar_url, joining_date, employment_type, work_location, data, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET employee_id=EXCLUDED.employee_id, name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone,
         department=EXCLUDED.department, designation=EXCLUDED.designation, role=EXCLUDED.role, status=EXCLUDED.status,
         avatar_url=EXCLUDED.avatar_url, joining_date=EXCLUDED.joining_date, employment_type=EXCLUDED.employment_type,
         work_location=EXCLUDED.work_location, data=EXCLUDED.data, updated_at=CURRENT_TIMESTAMP`,
      [e.id || e.employeeId, e.employeeId || e.id, e.name, e.contact?.workEmail || '', e.contact?.phone || '',
        e.employment?.department || '', e.employment?.designation || '', e.role || 'employee',
        e.employment?.status || e.status || 'Active', e.avatarUrl || '', e.employment?.joiningDate || null,
        e.employment?.employmentType || 'Full-Time', e.employment?.workLocation || '', json(e)],
    ],
  },

  attendance: {
    table: 'attendance',
    key: 'id',
    select: 'SELECT * FROM attendance ORDER BY date DESC, employee_id',
    fromRow: (r) => ({
      ...(r.data || {}),
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      department: r.department,
      date: r.date,
      checkIn: r.check_in,
      checkOut: r.check_out,
      workingHours: r.working_hours,
      lateBy: r.late_by,
      overtime: r.overtime,
      status: r.status,
      punchSource: r.punch_source,
      latitude: r.latitude,
      longitude: r.longitude,
      accuracy: r.accuracy,
      inGeofence: r.in_geofence,
    }),
    upsert: (a) => [
      `INSERT INTO attendance (id, employee_id, employee_name, department, date, check_in, check_out, working_hours, late_by, overtime, status, punch_source, latitude, longitude, accuracy, in_geofence, data, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,CURRENT_TIMESTAMP)
       ON CONFLICT (employee_id, date) DO UPDATE SET id=EXCLUDED.id, check_in=EXCLUDED.check_in, check_out=EXCLUDED.check_out,
         working_hours=EXCLUDED.working_hours, late_by=EXCLUDED.late_by, overtime=EXCLUDED.overtime, status=EXCLUDED.status,
         punch_source=EXCLUDED.punch_source, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
         accuracy=EXCLUDED.accuracy, in_geofence=EXCLUDED.in_geofence, data=EXCLUDED.data, updated_at=CURRENT_TIMESTAMP`,
      [a.id, a.employeeId, a.employeeName || '', a.department || '', a.date, a.checkIn || null, a.checkOut || null,
        a.workingHours || '-', a.lateBy || '-', a.overtime || '-', a.status || 'Present', a.punchSource || '',
        a.latitude ?? null, a.longitude ?? null, a.accuracy ?? null, a.inGeofence !== false, json(a)],
    ],
  },

  leaves: {
    table: 'leaves',
    key: 'id',
    select: 'SELECT * FROM leaves ORDER BY start_date DESC',
    fromRow: (r) => ({
      ...(r.data || {}),
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      department: r.department,
      leaveType: r.leave_type,
      startDate: r.start_date,
      endDate: r.end_date,
      requestedDays: Number(r.requested_days),
      approvedDays: Number(r.approved_days),
      rejectedDays: Number(r.rejected_days),
      days: Number(r.days),
      reason: r.reason,
      status: r.status,
      approverName: r.approver_name,
      approverComment: r.approver_comment,
      reviewedAt: iso(r.reviewed_at),
    }),
    upsert: (l) => [
      `INSERT INTO leaves (id, employee_id, employee_name, department, leave_type, start_date, end_date, requested_days, approved_days, rejected_days, days, reason, status, approver_name, approver_comment, reviewed_at, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO UPDATE SET leave_type=EXCLUDED.leave_type, start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date,
         requested_days=EXCLUDED.requested_days, approved_days=EXCLUDED.approved_days, rejected_days=EXCLUDED.rejected_days,
         days=EXCLUDED.days, reason=EXCLUDED.reason, status=EXCLUDED.status, approver_name=EXCLUDED.approver_name,
         approver_comment=EXCLUDED.approver_comment, reviewed_at=EXCLUDED.reviewed_at, data=EXCLUDED.data`,
      [l.id, l.employeeId, l.employeeName || '', l.department || '', l.leaveType, l.startDate, l.endDate,
        l.requestedDays ?? l.days ?? 1, l.approvedDays || 0, l.rejectedDays || 0, l.days ?? 1, l.reason || '',
        l.status || 'Pending', l.approverName || null, l.approverComment || null, l.reviewedAt || null, json(l)],
    ],
  },

  corrections: {
    table: 'attendance_corrections',
    key: 'id',
    select: 'SELECT * FROM attendance_corrections ORDER BY date DESC',
    fromRow: (r) => ({
      ...(r.data || {}),
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      department: r.department,
      date: r.date,
      currentCheckIn: r.current_check_in,
      currentCheckOut: r.current_check_out,
      requestedCheckIn: r.requested_check_in,
      requestedCheckOut: r.requested_check_out,
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewed_by,
      reviewComment: r.review_comment,
      reviewedAt: iso(r.reviewed_at),
      appliedDate: r.applied_date,
    }),
    upsert: (c) => [
      `INSERT INTO attendance_corrections (id, employee_id, employee_name, department, date, current_check_in, current_check_out, requested_check_in, requested_check_out, reason, status, reviewed_by, review_comment, reviewed_at, applied_date, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, reviewed_by=EXCLUDED.reviewed_by,
         review_comment=EXCLUDED.review_comment, reviewed_at=EXCLUDED.reviewed_at, data=EXCLUDED.data`,
      [c.id, c.employeeId, c.employeeName || '', c.department || '', c.date, c.currentCheckIn || null, c.currentCheckOut || null,
        c.requestedCheckIn || '', c.requestedCheckOut || '', c.reason || '', c.status || 'Pending', c.reviewedBy || null,
        c.reviewComment || null, c.reviewedAt || null, c.appliedDate || today(), json(c)],
    ],
  },

  employee_documents: {
    table: 'documents',
    key: 'id',
    select: 'SELECT * FROM documents ORDER BY created_at DESC',
    fromRow: (r) => ({
      ...(r.data || {}),
      id: r.id,
      employeeId: r.employee_id,
      status: r.status,
      rejectionReason: r.rejection_reason,
      reviewedBy: r.reviewed_by,
      reviewedAt: iso(r.reviewed_at),
    }),
    upsert: (d) => [
      `INSERT INTO documents (id, employee_id, employee_name, department, document_type, file_name, file_url, file_size, uploaded_on, status, rejection_reason, reviewed_by, reviewed_at, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO UPDATE SET document_type=EXCLUDED.document_type, file_name=EXCLUDED.file_name,
         file_url=EXCLUDED.file_url, file_size=EXCLUDED.file_size, status=EXCLUDED.status,
         rejection_reason=EXCLUDED.rejection_reason, reviewed_by=EXCLUDED.reviewed_by, reviewed_at=EXCLUDED.reviewed_at, data=EXCLUDED.data`,
      [d.id, d.employeeId, d.employeeName || '', d.department || '', d.documentType || d.type || '', d.fileName || '',
        d.fileUrl || '', String(d.fileSize || ''), d.uploadedOn || today(),
        d.status || 'Pending Verification', d.rejectionReason || null, d.reviewedBy || null, d.reviewedAt || null, json(d)],
    ],
  },
};

class PostgresService {
  constructor() {
    this.pool = null;
    this.connected = false;
    // Writes run one after another so two quick updates to the same record land in order.
    this.queue = Promise.resolve();
    this.pending = 0;
    this.lastWriteAt = 0;
    this.initPromise = this.init();
  }

  async init() {
    this.pool = new Pool({ ...config.db, connectionTimeoutMillis: 6000, max: 10 });
    this.pool.on('error', (err) => console.error('[PostgreSQL] Pool error:', err.message));
    try {
      const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
      await this.pool.query(sql);
      this.connected = true;
      console.log(`[PostgreSQL] Connected to "${config.db.database}" and schema verified.`);
    } catch (err) {
      this.connected = false;
      console.warn(`[PostgreSQL] Not available (${err.message}).`);
    }
    return this.connected;
  }

  isConnected() {
    return this.connected;
  }

  query(text, params) {
    if (!this.connected) throw new Error('PostgreSQL is not connected.');
    return this.pool.query(text, params);
  }

  /*
   * Runs a write after all earlier ones. The request that caused it (if any) is told about the outcome, so it can
   * answer with an error instead of a false success.
   */
  enqueue(label, task, collection) {
    this.pending += 1;
    this.lastWriteAt = Date.now();
    const run = this.queue.then(task);
    this.queue = run
      .catch((err) => console.error(`[PostgreSQL] ${label} failed:`, err.message))
      .finally(() => {
        this.pending -= 1;
      });
    const ctx = writeContext.getStore();
    if (ctx) {
      ctx.writes.push(run);
      if (collection) ctx.collections.add(collection);
    }
    return this.queue;
  }

  async loadTable(collection) {
    const def = TABLES[collection];
    const { rows } = await this.query(def.select);
    return rows.map(def.fromRow);
  }

  persistItem(collection, item) {
    const def = TABLES[collection];
    if (!def || !item || !this.connected) return Promise.resolve();
    const [text, params] = def.upsert(item);
    return this.enqueue(`save ${collection}`, () => this.pool.query(text, params), collection);
  }

  deleteItem(collection, key) {
    const def = TABLES[collection];
    if (!def || !this.connected) return Promise.resolve();
    return this.enqueue(`delete ${collection}`, () => this.pool.query(`DELETE FROM ${def.table} WHERE ${def.key} = $1`, [key]), collection);
  }

  async loadCollection(name) {
    const { rows } = await this.query('SELECT data FROM collections WHERE name = $1', [name]);
    return rows.length ? rows[0].data : null;
  }

  saveCollection(name, data) {
    if (!this.connected) return Promise.resolve();
    return this.enqueue(`save ${name}`, () => this.pool.query(
      `INSERT INTO collections (name, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
      [name, json(data)],
    ), name);
  }

  /* Resolves once every queued write has finished (used by maintenance scripts before exiting). */
  async flush() {
    await this.queue;
  }

  async close() {
    await this.flush();
    await this.pool?.end();
  }
}

export const postgres = new PostgresService();
