/*
 * Issues a new random temporary password to every active account (or to the e-mails given) and stores only the
 * bcrypt hash. People must change it at their first sign-in. Existing sessions are signed out.
 *
 *   node server/scripts/issue-temp-passwords.js                       # everyone
 *   node server/scripts/issue-temp-passwords.js a@x.com b@x.com       # selected accounts
 *
 * The plain passwords are written once to server/credentials.local.csv (git-ignored, owner-only). Hand them
 * out privately, then delete the file.
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { db } from '../services/db.js';
import { postgres } from '../services/postgres.js';
import { config } from '../config/config.js';
import { SEED_USERS } from '../db/seed.js';
import { generateTempPassword } from '../controllers/employeeController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv.slice(2).map((e) => e.toLowerCase());

async function main() {
  await db.ready;

  // Accounts for real employees that have none yet (e.g. a fresh database) are created from the seed.
  for (const seed of SEED_USERS) {
    if (!db.findOne('users', (u) => u.email === seed.email || u.employeeId === seed.employeeId)) db.insert('users', seed);
  }

  const targets = db.get('users').filter((u) => u.status !== 'Disabled' && (!only.length || only.includes(u.email)));
  if (!targets.length) throw new Error('No matching accounts.');

  const rows = [['name', 'email', 'role', 'employee_id', 'temporary_password']];
  for (const account of targets) {
    const password = generateTempPassword();
    db.update('users', account.id, {
      email: account.email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, config.bcryptRounds),
      mustChangePassword: true,
      tokenVersion: (account.tokenVersion || 0) + 1,
    });
    rows.push([account.name, account.email, account.role, account.employeeId || '', password]);
  }
  await postgres.flush();

  const file = process.env.CREDENTIALS_FILE || path.join(__dirname, '..', 'credentials.local.csv');
  fs.writeFileSync(file, `${rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')}\n`, { mode: 0o600 });
  console.log(`Issued ${targets.length} temporary password(s). Saved to ${file}`);
}

main()
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => postgres.close());
