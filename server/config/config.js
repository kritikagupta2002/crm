import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'bgspl_hrms_jwt_secret_key_2026_secure',
  jwtExpiresIn: '7d',
  dataDir: path.join(__dirname, '..', 'data'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

