import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PostgresService {
  constructor() {
    this.pool = null;
    this.connected = false;
    this.initPromise = this.init();
  }

  async init() {
    try {
      this.pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        connectionTimeoutMillis: 4000,
      });

      this.pool.on('error', (err) => {
        console.warn('[PostgreSQL Pool Warning]', err.message);
      });

      const client = await this.pool.connect();
      this.connected = true;
      console.log(`✅ [PostgreSQL] Connected successfully to database: "${config.db.database}" on ${config.db.host}:${config.db.port}`);

      // Ensure all schema tables exist
      try {
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(sql);
          console.log('✅ [PostgreSQL] Database tables & schema verified successfully.');
        }
      } catch (schemaErr) {
        console.warn('⚠️ [PostgreSQL Schema Init Error]:', schemaErr.message);
      } finally {
        client.release();
      }
      return true;
    } catch (err) {
      this.connected = false;
      console.log(`ℹ️ [PostgreSQL] Database connection notice (${err.message}).`);
      console.log('👉 [Storage Engine] Running on local JSON cache fallback.');
      return false;
    }
  }

  isConnected() {
    return this.connected;
  }

  async query(text, params) {
    if (!this.connected || !this.pool) {
      throw new Error('PostgreSQL is not connected.');
    }
    return this.pool.query(text, params);
  }

  // Seed PostgreSQL tables if employees table is empty
  async seedIfEmpty(seedData) {
    if (!this.connected) return false;
    try {
      const check = await this.query('SELECT count(*) FROM employees');
      const count = parseInt(check.rows[0].count, 10);
      if (count > 0) {
        console.log(`ℹ️ [PostgreSQL] Database already populated with ${count} employee records.`);
        return false;
      }

      console.log('🌱 [PostgreSQL] Seeding real Bansal Geo Solutions database tables...');

      // 1. Seed Users
      if (Array.isArray(seedData.users)) {
        for (const u of seedData.users) {
          await this.query(
            `INSERT INTO users (id, name, email, password_hash, role, employee_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, employee_id = EXCLUDED.employee_id`,
            [u.id, u.name, u.email, u.password || 'demo', u.role, u.employeeId || null]
          );
        }
      }

      // 2. Seed Employees
      if (Array.isArray(seedData.employees)) {
        for (const e of seedData.employees) {
          const empId = e.employeeId || e.id;
          const email = e.contact?.workEmail || e.email || '';
          const phone = e.contact?.phone || e.phone || '';
          const dept = e.employment?.department || e.department || 'Operations';
          const desig = e.employment?.designation || e.designation || 'Staff';
          const role = e.role || 'Employee';
          const status = e.status || 'Active';
          const avatar = e.avatarUrl || '';
          const joining = e.employment?.joiningDate || e.joiningDate || '2025-01-01';
          const empType = e.employment?.employmentType || 'Full-time';
          const loc = e.employment?.workLocation || 'Jaipur Office';

          await this.query(
            `INSERT INTO employees (id, employee_id, name, email, phone, department, designation, role, status, avatar_url, joining_date, employment_type, work_location, data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (employee_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, department = EXCLUDED.department, designation = EXCLUDED.designation, data = EXCLUDED.data`,
            [e.id, empId, e.name, email, phone, dept, desig, role, status, avatar, joining, empType, loc, JSON.stringify(e)]
          );
        }
      }

      // 3. Seed Attendance
      if (Array.isArray(seedData.attendance)) {
        for (const a of seedData.attendance) {
          await this.query(
            `INSERT INTO attendance (id, employee_id, employee_name, department, date, check_in, check_out, working_hours, late_by, overtime, status, punch_source, latitude, longitude, accuracy, in_geofence)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT (employee_id, date) DO UPDATE SET check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, status = EXCLUDED.status`,
            [
              a.id,
              a.employeeId,
              a.employeeName,
              a.department,
              a.date,
              a.checkIn || null,
              a.checkOut || null,
              a.workingHours || '-',
              a.lateBy || '-',
              a.overtime || '-',
              a.status || 'Present',
              a.punchSource || 'Office Geofenced GPS',
              a.latitude || 26.853858,
              a.longitude || 75.766749,
              a.accuracy || 12,
              a.inGeofence !== false,
            ]
          );
        }
      }

      // 4. Seed Leaves
      if (Array.isArray(seedData.leaves)) {
        for (const l of seedData.leaves) {
          await this.query(
            `INSERT INTO leaves (id, employee_id, employee_name, department, leave_type, start_date, end_date, requested_days, approved_days, rejected_days, days, reason, status, approver_name, approver_comment, reviewed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT (id) DO NOTHING`,
            [
              l.id,
              l.employeeId,
              l.employeeName,
              l.department || 'Operations',
              l.leaveType,
              l.startDate,
              l.endDate,
              l.requestedDays || l.days || 1,
              l.approvedDays || 0,
              l.rejectedDays || 0,
              l.days || 1,
              l.reason || 'Personal leave',
              l.status || 'Pending',
              l.approverName || null,
              l.approverComment || null,
              l.reviewedAt || null,
            ]
          );
        }
      }

      // 5. Seed Departments
      if (Array.isArray(seedData.departments)) {
        for (const d of seedData.departments) {
          await this.query(
            `INSERT INTO departments (id, name, code, head)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (name) DO NOTHING`,
            [d.id, d.name, d.code || '', d.head || '']
          );
        }
      }

      // 6. Seed Designations
      if (Array.isArray(seedData.designations)) {
        for (const dg of seedData.designations) {
          await this.query(
            `INSERT INTO designations (id, title, department, grade)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (title) DO NOTHING`,
            [dg.id, dg.title, dg.department || '', dg.grade || '']
          );
        }
      }

      // 7. Seed Shifts
      if (Array.isArray(seedData.shifts)) {
        for (const s of seedData.shifts) {
          await this.query(
            `INSERT INTO shifts (id, name, code, start_time, end_time, grace_minutes, half_day_hours, is_night_shift, is_active, data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (code) DO NOTHING`,
            [
              s.id,
              s.name,
              s.code,
              s.startTime || '09:30',
              s.endTime || '18:00',
              s.graceMinutes || 15,
              s.halfDayHours || 4.5,
              Boolean(s.isNightShift),
              s.status !== 'Inactive',
              JSON.stringify(s),
            ]
          );
        }
      }

      // 8. Seed Settings
      const settingsMap = {
        company_settings: seedData.company_settings,
        attendance_settings: seedData.attendance_settings,
        leave_settings: seedData.leave_settings,
      };
      for (const [key, val] of Object.entries(settingsMap)) {
        if (val) {
          await this.query(
            `INSERT INTO settings (key, value)
             VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
            [key, JSON.stringify(val)]
          );
        }
      }

      console.log('✅ [PostgreSQL] All tables seeded with real Bansal Geo Solutions data successfully.');
      return true;
    } catch (err) {
      console.error('❌ [PostgreSQL Seed Error]:', err.message);
      return false;
    }
  }

  // Load a collection from PostgreSQL
  async loadFromDb(collection) {
    if (!this.connected) return null;
    try {
      if (collection === 'employees') {
        const res = await this.query('SELECT data, id, employee_id, name, email, phone, department, designation, role, status, avatar_url, joining_date FROM employees ORDER BY employee_id ASC');
        return res.rows.map((r) => (r.data && Object.keys(r.data).length ? r.data : {
          id: r.id,
          employeeId: r.employee_id,
          name: r.name,
          contact: { workEmail: r.email, phone: r.phone },
          employment: { department: r.department, designation: r.designation, joiningDate: r.joining_date },
          role: r.role,
          status: r.status,
          avatarUrl: r.avatar_url,
        }));
      }

      if (collection === 'attendance') {
        const res = await this.query('SELECT * FROM attendance ORDER BY date DESC, employee_id ASC');
        return res.rows.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          department: r.department,
          date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
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
        }));
      }

      if (collection === 'leaves') {
        const res = await this.query('SELECT * FROM leaves ORDER BY start_date DESC');
        return res.rows.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          department: r.department,
          leaveType: r.leave_type,
          startDate: r.start_date instanceof Date ? r.start_date.toISOString().slice(0, 10) : String(r.start_date).slice(0, 10),
          endDate: r.end_date instanceof Date ? r.end_date.toISOString().slice(0, 10) : String(r.end_date).slice(0, 10),
          requestedDays: Number(r.requested_days),
          approvedDays: Number(r.approved_days),
          rejectedDays: Number(r.rejected_days),
          days: Number(r.days),
          reason: r.reason,
          status: r.status,
          approverName: r.approver_name,
          approverComment: r.approver_comment,
          reviewedAt: r.reviewed_at,
        }));
      }

      if (collection === 'attendance_corrections' || collection === 'corrections') {
        const res = await this.query('SELECT * FROM attendance_corrections ORDER BY date DESC');
        return res.rows.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          department: r.department,
          date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
          currentCheckIn: r.current_check_in,
          currentCheckOut: r.current_check_out,
          requestedCheckIn: r.requested_check_in,
          requestedCheckOut: r.requested_check_out,
          reason: r.reason,
          status: r.status,
          reviewedBy: r.reviewed_by,
          reviewComment: r.review_comment,
          reviewedAt: r.reviewed_at,
          appliedDate: r.applied_date,
        }));
      }

      if (collection === 'documents' || collection === 'employee_documents') {
        const res = await this.query('SELECT * FROM documents ORDER BY created_at DESC');
        return res.rows.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          department: r.department,
          documentType: r.document_type,
          fileName: r.file_name,
          fileUrl: r.file_url,
          fileSize: r.file_size,
          uploadedOn: r.uploaded_on instanceof Date ? r.uploaded_on.toISOString().slice(0, 10) : String(r.uploaded_on || '').slice(0, 10),
          status: r.status,
          rejectionReason: r.rejection_reason,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at,
          ...(r.data || {}),
        }));
      }

      if (collection === 'users') {
        const res = await this.query('SELECT id, name, email, role, employee_id, password_hash FROM users');
        return res.rows.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          employeeId: r.employee_id,
          password: r.password_hash,
        }));
      }

      return null;
    } catch (err) {
      console.warn(`[PostgreSQL] Error loading ${collection}:`, err.message);
      return null;
    }
  }

  // Persist a single item to PostgreSQL asynchronously
  async persistItem(collection, item) {
    if (!this.connected || !item) return;
    try {
      if (collection === 'employees') {
        const empId = item.employeeId || item.id;
        const email = item.contact?.workEmail || item.email || '';
        const phone = item.contact?.phone || item.phone || '';
        const dept = item.employment?.department || item.department || '';
        const desig = item.employment?.designation || item.designation || '';
        const role = item.role || 'Employee';
        const status = item.status || 'Active';
        const avatar = item.avatarUrl || '';
        const joining = item.employment?.joiningDate || item.joiningDate || '2025-01-01';
        const empType = item.employment?.employmentType || 'Full-time';
        const loc = item.employment?.workLocation || 'Jaipur Office';

        await this.query(
          `INSERT INTO employees (id, employee_id, name, email, phone, department, designation, role, status, avatar_url, joining_date, employment_type, work_location, data, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
           ON CONFLICT (employee_id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             department = EXCLUDED.department,
             designation = EXCLUDED.designation,
             role = EXCLUDED.role,
             status = EXCLUDED.status,
             avatar_url = EXCLUDED.avatar_url,
             joining_date = EXCLUDED.joining_date,
             data = EXCLUDED.data,
             updated_at = CURRENT_TIMESTAMP`,
          [item.id, empId, item.name, email, phone, dept, desig, role, status, avatar, joining, empType, loc, JSON.stringify(item)]
        );
      } else if (collection === 'attendance') {
        await this.query(
          `INSERT INTO attendance (id, employee_id, employee_name, department, date, check_in, check_out, working_hours, late_by, overtime, status, punch_source, latitude, longitude, accuracy, in_geofence, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
           ON CONFLICT (employee_id, date) DO UPDATE SET
             check_in = COALESCE(EXCLUDED.check_in, attendance.check_in),
             check_out = COALESCE(EXCLUDED.check_out, attendance.check_out),
             working_hours = EXCLUDED.working_hours,
             late_by = EXCLUDED.late_by,
             overtime = EXCLUDED.overtime,
             status = EXCLUDED.status,
             punch_source = EXCLUDED.punch_source,
             latitude = EXCLUDED.latitude,
             longitude = EXCLUDED.longitude,
             accuracy = EXCLUDED.accuracy,
             in_geofence = EXCLUDED.in_geofence,
             updated_at = CURRENT_TIMESTAMP`,
          [
            item.id,
            item.employeeId,
            item.employeeName,
            item.department,
            item.date,
            item.checkIn || null,
            item.checkOut || null,
            item.workingHours || '-',
            item.lateBy || '-',
            item.overtime || '-',
            item.status || 'Present',
            item.punchSource || 'Office Geofenced GPS',
            item.latitude || 26.853858,
            item.longitude || 75.766749,
            item.accuracy || 12,
            item.inGeofence !== false,
          ]
        );
      } else if (collection === 'leaves') {
        await this.query(
          `INSERT INTO leaves (id, employee_id, employee_name, department, leave_type, start_date, end_date, requested_days, approved_days, rejected_days, days, reason, status, approver_name, approver_comment, reviewed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             approved_days = EXCLUDED.approved_days,
             rejected_days = EXCLUDED.rejected_days,
             approver_name = EXCLUDED.approver_name,
             approver_comment = EXCLUDED.approver_comment,
             reviewed_at = EXCLUDED.reviewed_at`,
          [
            item.id,
            item.employeeId,
            item.employeeName,
            item.department || 'Operations',
            item.leaveType,
            item.startDate,
            item.endDate,
            item.requestedDays || item.days || 1,
            item.approvedDays || 0,
            item.rejectedDays || 0,
            item.days || 1,
            item.reason || '',
            item.status || 'Pending',
            item.approverName || null,
            item.approverComment || null,
            item.reviewedAt || null,
          ]
        );
      } else if (collection === 'attendance_corrections' || collection === 'corrections') {
        await this.query(
          `INSERT INTO attendance_corrections (id, employee_id, employee_name, department, date, current_check_in, current_check_out, requested_check_in, requested_check_out, reason, status, reviewed_by, review_comment, reviewed_at, applied_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             reviewed_by = EXCLUDED.reviewed_by,
             review_comment = EXCLUDED.review_comment,
             reviewed_at = EXCLUDED.reviewed_at`,
          [
            item.id,
            item.employeeId,
            item.employeeName,
            item.department,
            item.date,
            item.currentCheckIn,
            item.currentCheckOut,
            item.requestedCheckIn,
            item.requestedCheckOut,
            item.reason,
            item.status,
            item.reviewedBy,
            item.reviewComment,
            item.reviewedAt,
            item.appliedDate || new Date().toISOString().slice(0, 10),
          ]
        );
      } else if (collection === 'documents' || collection === 'employee_documents') {
        await this.query(
          `INSERT INTO documents (id, employee_id, employee_name, department, document_type, file_name, file_url, file_size, uploaded_on, status, rejection_reason, reviewed_by, reviewed_at, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             rejection_reason = EXCLUDED.rejection_reason,
             reviewed_by = EXCLUDED.reviewed_by,
             reviewed_at = EXCLUDED.reviewed_at,
             data = EXCLUDED.data`,
          [
            item.id,
            item.employeeId,
            item.employeeName || '',
            item.department || '',
            item.documentType,
            item.fileName,
            item.fileUrl || '',
            item.fileSize || '1.8 MB',
            item.uploadedOn || new Date().toISOString().slice(0, 10),
            item.status || 'Pending Verification',
            item.rejectionReason || null,
            item.reviewedBy || null,
            item.reviewedAt || null,
            JSON.stringify(item),
          ]
        );
      }
    } catch (err) {
      console.warn(`[PostgreSQL] Persist failed for ${collection}:`, err.message);
    }
  }
}

export const postgres = new PostgresService();


