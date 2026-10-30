import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import { postgres } from './services/postgres.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy (for accurate client IP detection behind Nginx / Cloudflare)
app.set('trust proxy', 1);

// Production CORS Whitelisting
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed =
      config.corsOrigins.includes(origin) ||
      origin.endsWith('.geoplanetsolution.in') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Warning] Origin "${origin}" not in explicit whitelist. Permitting for development.`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Welcome / API Documentation route
app.get('/', (req, res) => {
  res.json({
    name: 'Bansal Geo Solutions - HRMS & Attendance Backend API',
    version: '1.0.0',
    status: 'online',
    domains: {
      frontend: 'https://bansalgeo.geoplanetsolution.in',
      api: 'https://bansalgeo-api.geoplanetsolution.in',
    },
    database: {
      engine: postgres.isConnected() ? 'PostgreSQL' : 'JSON Persistent DB (PostgreSQL standby)',
      host: config.db.host,
      database: config.db.database,
      port: config.db.port,
    },
    endpoints: {
      health: 'GET /api/health',
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
      employees: {
        list: 'GET /api/employees',
        get: 'GET /api/employees/:id',
        create: 'POST /api/employees',
        update: 'PUT /api/employees/:id',
        delete: 'DELETE /api/employees/:id',
        performance: 'GET /api/employees/performance/records',
        exit: 'GET /api/employees/exit/records',
      },
      attendance: {
        list: 'GET /api/attendance',
        todaySummary: 'GET /api/attendance/today',
        monthly: 'GET /api/attendance/monthly',
        punch: 'POST /api/attendance/punch',
        corrections: 'GET /api/attendance/corrections',
        submitCorrection: 'POST /api/attendance/corrections',
        reviewCorrection: 'PUT /api/attendance/corrections/:id',
      },
      leaves: {
        types: 'GET /api/leaves/types',
        balances: 'GET /api/leaves/balances/:employeeId',
        requests: 'GET /api/leaves/requests',
        apply: 'POST /api/leaves/requests',
        review: 'PUT /api/leaves/requests/:id/status',
      },
      shifts: {
        list: 'GET /api/shifts',
        create: 'POST /api/shifts',
        assignments: 'GET /api/shifts/assignments',
        assign: 'POST /api/shifts/assignments',
      },
      organization: {
        departments: 'GET /api/organization/departments',
        designations: 'GET /api/organization/designations',
        chart: 'GET /api/organization/chart',
      },
      notifications: {
        list: 'GET /api/notifications',
        markRead: 'PUT /api/notifications/:id/read',
        markAllRead: 'PUT /api/notifications/read-all',
      },
      settings: {
        company: 'GET /api/settings/company',
        attendance: 'GET /api/settings/attendance',
        leave: 'GET /api/settings/leave',
      },
    },
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`🚀 Bansal Geo HRMS Backend Server running on port ${PORT}`);
  console.log(`👉 Primary Production API: https://bansalgeo-api.geoplanetsolution.in`);
  console.log(`👉 Local API Health: http://localhost:${PORT}/api/health`);
});

export default app;
