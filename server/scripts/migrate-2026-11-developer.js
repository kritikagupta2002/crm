/*
 * One-off migration (safe to run more than once):
 *   1. Kritika Gupta's records become Akshat Sharma, Software Developer (role: Developer, full access).
 *      A new temporary password is issued, because the old one was handed to a different person.
 *   2. The Information Technology department and Software Developer designation are added.
 *   3. Accounts with the retired role "Super Admin" are renamed to "HR Admin".
 *
 *   node server/scripts/migrate-2026-11-developer.js
 *
 * Akshat's temporary password is written to server/credentials.local.csv (git-ignored).
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { db } from '../services/db.js';
import { postgres } from '../services/postgres.js';
import { config } from '../config/config.js';
import { SEED_DATA } from '../db/seed.js';
import { generateTempPassword } from '../controllers/employeeController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLD_ID = 'BGS/ADM-01';
const NEW_ID = 'BGS/DEV-01';
const NEW_EMAIL = 'akshat.sharma@bansalgeo.com';

async function main() {
  await db.ready;
  const seedEmployee = SEED_DATA.employees.find((e) => e.employeeId === NEW_ID);
  const log = [];

  // Employee record
  const oldEmp = db.get('employees').find((e) => e.employeeId === OLD_ID);
  if (oldEmp) {
    db.set('employees', db.get('employees').map((e) => (e.employeeId === OLD_ID ? { ...seedEmployee, id: oldEmp.id } : e)));
    log.push('Employee record BGS/ADM-01 replaced by Akshat Sharma (BGS/DEV-01).');
  } else if (!db.get('employees').some((e) => e.employeeId === NEW_ID)) {
    db.insert('employees', seedEmployee);
    log.push('Employee record for Akshat Sharma created.');
  }

  // Login account
  let account = db.get('users').find((u) => u.employeeId === OLD_ID || u.email === 'kritika.gupta@bansalgeo.com');
  let temporaryPassword = null;
  if (account) {
    temporaryPassword = generateTempPassword();
    db.update('users', account.id, {
      name: 'Akshat Sharma',
      email: NEW_EMAIL,
      employeeId: NEW_ID,
      role: 'Developer',
      permissions: null,
      status: 'Active',
      passwordHash: await bcrypt.hash(temporaryPassword, config.bcryptRounds),
      mustChangePassword: true,
      tokenVersion: (account.tokenVersion || 0) + 1,
    });
    log.push('Login account converted to Akshat Sharma (Developer); new temporary password issued.');
  } else if (!db.get('users').some((u) => u.email === NEW_EMAIL)) {
    temporaryPassword = generateTempPassword();
    account = db.insert('users', {
      id: 'usr-developer',
      name: 'Akshat Sharma',
      email: NEW_EMAIL,
      role: 'Developer',
      employeeId: NEW_ID,
      passwordHash: await bcrypt.hash(temporaryPassword, config.bcryptRounds),
      status: 'Active',
      tokenVersion: 0,
      mustChangePassword: true,
    });
    log.push('Login account for Akshat Sharma created.');
  }

  // References to the old employee ID
  const relink = (collection) => {
    const list = db.get(collection);
    if (list.some((r) => r.employeeId === OLD_ID)) {
      db.set(collection, list.map((r) => (r.employeeId === OLD_ID ? { ...r, employeeId: NEW_ID, employeeName: 'Akshat Sharma', department: 'Information Technology' } : r)));
      log.push(`${collection}: references updated.`);
    }
  };
  ['shift_assignments', 'salary_structures'].forEach(relink);
  const depts = db.get('departments').map((d) => (d.headEmployeeId === OLD_ID ? { ...d, headEmployeeId: 'BGS/DIR-03', headName: 'Dharmendra Goyal' } : d));
  db.set('departments', depts);

  // Master data
  if (!db.get('departments').some((d) => d.name === 'Information Technology')) {
    db.insert('departments', SEED_DATA.departments.find((d) => d.name === 'Information Technology'));
    log.push('Department "Information Technology" added.');
  }
  if (!db.get('designations').some((d) => d.title === 'Software Developer')) {
    db.insert('designations', SEED_DATA.designations.find((d) => d.title === 'Software Developer'));
    log.push('Designation "Software Developer" added.');
  }

  // Retired role name
  for (const u of db.get('users').filter((x) => x.role === 'Super Admin')) {
    db.update('users', u.id, { role: 'HR Admin' });
    log.push(`${u.name}: role Super Admin renamed to HR Admin.`);
  }

  await postgres.flush();
  if (temporaryPassword) {
    const file = process.env.CREDENTIALS_FILE || path.join(__dirname, '..', 'credentials.local.csv');
    const line = `"Akshat Sharma","${NEW_EMAIL}","Developer","${NEW_ID}","${temporaryPassword}"\n`;
    const header = fs.existsSync(file) ? '' : '"name","email","role","employee_id","temporary_password"\n';
    fs.appendFileSync(file, header + line, { mode: 0o600 });
    log.push(`Temporary password for ${NEW_EMAIL} appended to ${file}`);
  }
  console.log(log.length ? log.join('\n') : 'Nothing to change; migration already applied.');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => postgres.close());
