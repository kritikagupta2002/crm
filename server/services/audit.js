import crypto from 'crypto';
import { db } from './db.js';

const MAX_ENTRIES = 5000;

/*
 * Append-only record of who changed what. Kept for HR administration and dispute resolution
 * (leave decisions, payroll runs, account changes). The newest entries are kept first.
 */
export function audit(req, action, entity, entityId, summary = '') {
  const entry = {
    id: `aud-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    actorId: req.user?.id || null,
    actorName: req.user?.name || 'System',
    actorRole: req.user?.role || null,
    action,
    entity,
    entityId: entityId ?? null,
    summary: String(summary).slice(0, 300),
    ip: req.ip,
  };
  db.set('audit_log', [entry, ...db.get('audit_log')].slice(0, MAX_ENTRIES));
  return entry;
}
