import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
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
  console.log(`👉 API Health check: http://localhost:${PORT}/api/health`);
  console.log(`👉 API Docs: http://localhost:${PORT}/`);
});

export default app;
