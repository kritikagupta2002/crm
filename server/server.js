import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config.js';
import { postgres } from './services/postgres.js';
import { db } from './services/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { writeContext } from './services/writeContext.js';
import { SEED_DATA } from './db/seed.js';

const app = express();

// Behind one reverse proxy (Nginx / Cloudflare): needed for correct client IPs in rate limiting and geofence IP checks.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, server-to-server) carry no browser credentials.
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      if (!config.isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
      return callback(Object.assign(new Error('Origin not allowed.'), { status: 403 }));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }),
);

// Documents are uploaded as data URLs, so the limit is sized for a few-MB file.
app.use(express.json({ limit: '8mb' }));

app.use(
  '/api',
  rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }),
);

/*
 * A response is sent only after the request's database writes are confirmed. If any write failed, the in-memory
 * copy of the affected data is reloaded from PostgreSQL (undoing the change) and the client is told to retry.
 */
app.use((req, res, next) => {
  const ctx = { writes: [], collections: new Set() };
  writeContext.run(ctx, () => {
    const send = res.json.bind(res);
    res.json = (body) => {
      if (!ctx.writes.length) return send(body);
      Promise.allSettled(ctx.writes).then(async (results) => {
        const failed = results.some((r) => r.status === 'rejected');
        if (!failed || res.statusCode >= 400) return send(body);
        try {
          await db.reload([...ctx.collections]);
        } catch (err) {
          console.error('[db] Reload after failed write also failed:', err.message);
        }
        res.status(503);
        return send({ success: false, error: 'Your change could not be saved. Please try again in a moment.' });
      });
      return res;
    };
    next();
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path === '/api/health') return;
    console.log(`[${req.method}] ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/', (req, res) => res.json({ name: 'Bansal Geo HRMS API', status: 'online' }));
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  await db.ready;
  if (config.requireDatabase && !postgres.isConnected()) {
    console.error('[startup] PostgreSQL is required but not reachable. Check DB_* settings. Exiting.');
    process.exit(1);
  }
  db.startRefresh();
  // `kill -HUP <pid>` reloads everything from the database immediately (e.g. right after running a script).
  process.on('SIGHUP', () => db.reload(Object.keys(SEED_DATA)).then(() => console.log('[db] Reloaded from PostgreSQL.')));
  app.listen(config.port, () => {
    console.log(`Bansal Geo HRMS API listening on port ${config.port} (${config.isProduction ? 'production' : 'development'})`);
    console.log(`Storage: ${postgres.isConnected() ? 'PostgreSQL' : 'local JSON files (development only)'}`);
  });
}

start();

export default app;
