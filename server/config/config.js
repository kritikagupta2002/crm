import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or server
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const allowedOrigins = [
  'https://bansalgeo.geoplanetsolution.in',
  'https://www.bansalgeo.geoplanetsolution.in',
  'https://bansalgeo-api.geoplanetsolution.in',
  'https://www.bansalgeo-api.geoplanetsolution.in',
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()) : []),
];

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'bgspl_hrms_jwt_secret_key_2026_secure',
  jwtExpiresIn: '7d',
  dataDir: path.join(__dirname, '..', 'data'),
  corsOrigins: Array.from(new Set(allowedOrigins.filter(Boolean))),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'bansalgeo_hrms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  officeIps: (process.env.OFFICE_IPS || '127.0.0.1,::1').split(',').map((s) => s.trim()).filter(Boolean),
};
