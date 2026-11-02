/*
 * Removes the demo/seed records from the database and keeps only real people and configuration.
 *
 *   node server/scripts/purge-demo-data.js            # dry run: shows what would be removed
 *   node server/scripts/purge-demo-data.js --apply    # backs everything up to server/backups/, then purges
 *
 * Kept: login accounts (users), employees (refreshed from the cleaned employee master), organisation settings.
 * Removed: attendance, leave requests, corrections, documents, notifications, balances and every
 * document-style collection holding demo records (performance, exits, payroll ...).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { postgres } from '../services/postgres.js';
import { SEED_DATA } from '../db/seed.js';

const apply = process.argv.includes('--apply');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PURGE_TABLES = ['attendance', 'leaves', 'attendance_corrections', 'documents', 'notifications', 'leave_balances', 'shift_assignments', 'shifts', 'departments', 'designations'];
const BACKUP_TABLES = ['users', 'employees', ...PURGE_TABLES, 'settings', 'audit_logs', 'collections'];

async function main() {
  await postgres.initPromise;
  if (!postgres.isConnected()) throw new Error('PostgreSQL is not reachable; check DB_* settings.');

  console.log(apply ? 'Mode: APPLY' : 'Mode: dry run (add --apply to purge)');
  for (const table of [...PURGE_TABLES, 'collections', 'settings']) {
    const { rows } = await postgres.query(`SELECT count(*)::int AS n FROM ${table}`);
    console.log(`  ${table.padEnd(24)} ${rows[0].n} row(s) to remove`);
  }
  if (!apply) return;

  const backup = {};
  for (const table of BACKUP_TABLES) backup[table] = (await postgres.query(`SELECT * FROM ${table}`)).rows;
  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 2), { mode: 0o600 });
  console.log(`Backup written to ${file}`);

  await postgres.query('BEGIN');
  try {
    for (const table of PURGE_TABLES) await postgres.query(`DELETE FROM ${table}`);
    // Old JSON-document collections and the unused legacy settings rows; the API re-creates them from the seed.
    await postgres.query('DELETE FROM collections');
    await postgres.query('DELETE FROM settings');
    await postgres.query('COMMIT');
  } catch (err) {
    await postgres.query('ROLLBACK');
    throw err;
  }

  // Refresh employee records from the cleaned master (placeholder bank / PAN / UAN details removed).
  for (const employee of SEED_DATA.employees) await postgres.persistItem('employees', employee);
  await postgres.flush();
  console.log('Demo data removed. Employees refreshed from the employee master.');
}

main()
  .catch((err) => {
    console.error('Purge failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => postgres.close());
