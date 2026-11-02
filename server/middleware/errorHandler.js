import { config } from '../config/config.js';

/* Client errors keep their message; unexpected server errors are logged in full but reported generically. */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);
  res.status(status).json({
    success: false,
    error: status >= 500 && config.isProduction ? 'Something went wrong. Please try again.' : err.message || 'Request failed',
  });
}

export function notFound(req, res) {
  res.status(404).json({ success: false, error: 'Not found.' });
}
