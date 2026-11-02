import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/.env wins over the repo-root .env (dotenv never overwrites a value already set).
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const env = process.env;

// Business dates (attendance days, leave, payroll months) are India time, whatever the host's clock is set to.
process.env.TZ = env.TZ || 'Asia/Kolkata';
const isProduction = (env.NODE_ENV || env.APP_ENV) === 'production';

const list = (value) => (value || '').split(',').map((s) => s.trim()).filter(Boolean);

function requireSecret() {
  const secret = env.JWT_SECRET || '';
  if (secret.length >= 32) return secret;
  if (isProduction) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
  }
  console.warn('[config] JWT_SECRET is missing or short. Using a development-only secret; never deploy like this.');
  return 'development-only-secret-do-not-use-in-production-000';
}

/*
 * Office network addresses that count as "inside the office" for PCs without GPS. In production only public
 * addresses are honoured: loopback and private ranges would match every request if the proxy were misconfigured.
 */
function officeIps() {
  const all = list(env.OFFICE_IPS || (isProduction ? '' : '127.0.0.1,::1'));
  if (!isProduction) return all;
  const isPrivate = (ip) => /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i.test(ip);
  const ignored = all.filter(isPrivate);
  if (ignored.length) console.warn(`[config] Ignoring private/loopback OFFICE_IPS in production: ${ignored.join(', ')}`);
  return all.filter((ip) => !isPrivate(ip));
}

const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'];

export const config = {
  isProduction,
  port: parseInt(env.PORT || '5050', 10),
  jwtSecret: requireSecret(),
  jwtExpiresIn: env.JWT_EXPIRES_IN || '12h',
  bcryptRounds: 12,
  dataDir: env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(__dirname, '..', 'data'),
  corsOrigins: Array.from(new Set([...list(env.FRONTEND_URL), ...(isProduction ? [] : devOrigins)])),
  db: {
    host: env.DB_HOST || 'localhost',
    port: parseInt(env.DB_PORT || '5432', 10),
    database: env.DB_NAME || 'bansalgeo_hrms',
    user: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || '',
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  },
  // In production the API refuses to start without PostgreSQL instead of silently writing to local JSON files.
  requireDatabase: isProduction || env.REQUIRE_DATABASE === 'true',
  officeIps: officeIps(),
};
