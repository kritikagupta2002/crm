/*
 * End-to-end API tests. Each run starts a throwaway API on a free port with its own temporary data folder (no
 * PostgreSQL, never your real database), issues fresh passwords, and checks the rules that matter most:
 * sign-in, permissions, data scoping, office-only punching, leave working days and payroll.
 *
 *   npm test
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hrms-test-'));
const creds = path.join(tmp, 'credentials.csv');
const OFFICE = [26.8538188, 75.7670733];
let base;
let server;

const freePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, () => {
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});

const env = (port) => ({
  ...process.env,
  NODE_ENV: 'development',
  APP_ENV: 'development',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DATA_DIR: path.join(tmp, 'data'),
  CREDENTIALS_FILE: creds,
  PORT: String(port),
  OFFICE_IPS: '203.0.113.7', // localhost must NOT count as the office in these tests
  JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
});

const passwords = {};
const tokens = {};

async function call(method, url, who, body) {
  const res = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json', ...(who ? { authorization: `Bearer ${tokens[who]}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

before(async () => {
  const port = await freePort();
  execFileSync('node', ['server/scripts/issue-temp-passwords.js'], { cwd: root, env: env(port), stdio: 'ignore' });
  for (const line of fs.readFileSync(creds, 'utf8').trim().split('\n').slice(1)) {
    const cols = line.split('","').map((c) => c.replace(/"/g, ''));
    passwords[cols[1]] = cols[4];
  }
  server = spawn('node', ['server/server.js'], { cwd: root, env: env(port), stdio: 'ignore' });
  base = `http://127.0.0.1:${port}/api`;
  for (let i = 0; i < 50; i += 1) {
    try {
      if ((await fetch(`${base}/health`)).ok) break;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  for (const [who, email] of [['md', 'amit.bansal@bansalgeo.com'], ['director', 'dharmendra.goyal@bansalgeo.com'], ['emp', 'vikas.verma@bansalgeo.com'], ['dev', 'akshat.sharma@bansalgeo.com']]) {
    const r = await call('POST', '/auth/login', null, { email, password: passwords[email] });
    assert.equal(r.status, 200, `login ${email}`);
    tokens[who] = r.body.token;
  }
});

after(() => {
  server?.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('sign-in rejects wrong and old demo passwords, and requests without a token', async () => {
  assert.equal((await call('POST', '/auth/login', null, { email: 'amit.bansal@bansalgeo.com', password: 'demo1234' })).status, 401);
  assert.equal((await call('GET', '/employees')).status, 401);
});

test('roles: developer and MD see the audit log, the director does not', async () => {
  assert.equal((await call('GET', '/audit', 'md')).status, 200);
  assert.equal((await call('GET', '/audit', 'dev')).status, 200);
  assert.equal((await call('GET', '/audit', 'director')).status, 403);
  assert.equal((await call('GET', '/users/permissions', 'director')).status, 403);
});

test('an employee sees only their own records', async () => {
  const list = await call('GET', '/employees', 'emp');
  assert.deepEqual(list.body.data.map((e) => e.employeeId), ['BGS/04']);
  assert.equal((await call('GET', '/employees/BGS%2F05', 'emp')).status, 404);
  const all = await call('GET', '/employees', 'director');
  assert.ok(all.body.data.length >= 10);
});

test('punching works only inside the office, with a usable GPS fix', async () => {
  const far = await call('POST', '/attendance/punch', 'md', { punchType: 'checkIn', latitude: 26.8628, longitude: 75.7668, accuracy: 10 });
  assert.equal(far.status, 403);
  assert.match(far.body.error, /from the office/);
  const weak = await call('POST', '/attendance/punch', 'md', { punchType: 'checkIn', latitude: OFFICE[0], longitude: OFFICE[1], accuracy: 250 });
  assert.equal(weak.status, 403);
  const noGps = await call('POST', '/attendance/punch', 'md', { punchType: 'checkIn' });
  assert.equal(noGps.status, 403);
  const ok = await call('POST', '/attendance/punch', 'md', { punchType: 'checkIn', latitude: OFFICE[0], longitude: OFFICE[1], accuracy: 10 });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.employeeId, 'BGS/DIR-01');
});

test('custom access: attendance-only account cannot apply for leave', async () => {
  const users = (await call('GET', '/users', 'md')).body.data;
  const vikas = users.find((u) => u.email.startsWith('vikas'));
  const r = await call('PUT', `/users/${vikas.id}/access`, 'md', { role: 'Employee', permissions: ['attendance.mark', 'attendance.view_own'] });
  assert.equal(r.status, 200);
  const relogin = await call('POST', '/auth/login', null, { email: 'vikas.verma@bansalgeo.com', password: passwords['vikas.verma@bansalgeo.com'] });
  tokens.emp = relogin.body.token;
  const leave = await call('POST', '/leaves/requests', 'emp', { leaveType: 'Casual Leave (CL)', startDate: '2026-12-01', endDate: '2026-12-01', reason: 'Family function at home' });
  assert.equal(leave.status, 403);
  await call('PUT', `/users/${vikas.id}/access`, 'md', { role: 'Employee', permissions: null });
  tokens.emp = (await call('POST', '/auth/login', null, { email: 'vikas.verma@bansalgeo.com', password: passwords['vikas.verma@bansalgeo.com'] })).body.token;
});

test('leave counts only working days and approval skips the weekly off', async () => {
  // Vikas works a Sunday-off shift: Fri 13 to Mon 16 Nov 2026 is 3 working days.
  const applied = await call('POST', '/leaves/requests', 'emp', { leaveType: 'Casual Leave (CL)', startDate: '2026-11-13', endDate: '2026-11-16', requestedDays: 99, reason: 'Family function at home' });
  assert.equal(applied.status, 201, JSON.stringify(applied.body));
  assert.equal(applied.body.data.requestedDays, 3);
  const review = await call('PUT', `/leaves/requests/${applied.body.data.id}/status`, 'md', { status: 'Approved' });
  assert.equal(review.status, 200);
  const att = (await call('GET', '/attendance?employeeId=BGS%2F04', 'md')).body.data.filter((a) => a.status === 'On Leave').map((a) => a.date).sort();
  assert.deepEqual(att, ['2026-11-13', '2026-11-14', '2026-11-16']);
});

test('payroll: salary structure, run, and payslips visible only to the employee', async () => {
  const s = await call('PUT', '/payroll/structures/BGS%2F04', 'md', { basic: 10000, hra: 4000, conveyance: 1600, specialAllowance: 4400 });
  assert.equal(s.body.data.monthlyGross, 20000);
  assert.equal((await call('POST', '/payroll/runs', 'emp', { month: '2026-10' })).status, 403);
  const run = await call('POST', '/payroll/runs', 'md', { month: '2026-10' });
  assert.equal(run.status, 201, JSON.stringify(run.body));
  const slips = (await call('GET', '/payroll/payslips', 'emp')).body.data;
  assert.equal(slips.length, 1);
  // Gross 20,000 is within the ESIC ceiling, so employee ESI at 0.75% applies.
  assert.equal(slips[0].esi, 150);
  assert.equal(slips[0].employeeId, 'BGS/04');
});
