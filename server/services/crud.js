import crypto from 'crypto';
import { Router } from 'express';
import { db } from './db.js';
import { audit } from './audit.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

/* Strips the fields a client may never set and trims strings. */
function clean(body, forbidden = []) {
  const out = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', ...forbidden].includes(key)) continue;
    out[key] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

/*
 * Standard REST endpoints for a collection:
 *   GET /           list (optionally filtered per user by `scope`)
 *   GET /:id        one record
 *   POST /          create        (writePermission)
 *   PUT /:id        update        (writePermission)
 *   DELETE /:id     delete        (writePermission)
 * `validate(record, { existing, req })` throws ValidationError or returns the record to save.
 */
export function collectionRouter({ collection, label, idPrefix, writePermission, scope, validate = (r) => r, sort, onChange }) {
  const router = Router();
  const canWrite = requirePermission(writePermission);
  const canDelete = canWrite;
  const visible = (req) => {
    const all = db.get(collection);
    const list = scope ? all.filter((item) => scope(item, req)) : all;
    return sort ? [...list].sort(sort) : list;
  };
  const find = (id) => db.get(collection).find((item) => item.id === id);
  const nameOf = (r) => r.name || r.title || r.employeeName || r.id;

  router.get('/', authenticate, (req, res) => {
    const list = visible(req);
    res.json({ success: true, count: list.length, data: list });
  });

  router.get('/:id', authenticate, (req, res) => {
    const item = find(req.params.id);
    if (!item || (scope && !scope(item, req))) return res.status(404).json({ success: false, error: `${label} not found.` });
    res.json({ success: true, data: item });
  });

  router.post('/', authenticate, canWrite, (req, res, next) => {
    try {
      const now = new Date().toISOString();
      const record = validate(
        { ...clean(req.body), id: `${idPrefix}-${crypto.randomUUID().slice(0, 8)}`, createdAt: now, createdBy: req.user.name },
        { existing: null, req },
      );
      db.insert(collection, record);
      audit(req, 'create', collection, record.id, `${label} "${nameOf(record)}" created`);
      onChange?.();
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', authenticate, canWrite, (req, res, next) => {
    try {
      const existing = find(req.params.id);
      if (!existing) return res.status(404).json({ success: false, error: `${label} not found.` });
      const record = validate(
        { ...existing, ...clean(req.body), id: existing.id, updatedAt: new Date().toISOString(), updatedBy: req.user.name },
        { existing, req },
      );
      db.set(collection, db.get(collection).map((item) => (item.id === existing.id ? record : item)));
      audit(req, 'update', collection, record.id, `${label} "${nameOf(record)}" updated`);
      onChange?.();
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', authenticate, canDelete, (req, res) => {
    const existing = find(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: `${label} not found.` });
    db.remove(collection, existing.id);
    audit(req, 'delete', collection, existing.id, `${label} "${nameOf(existing)}" deleted`);
    onChange?.();
    res.json({ success: true });
  });

  return router;
}

/* Small validation helpers shared by the collection definitions. */
export const required = (record, fields) => {
  for (const [field, name] of Object.entries(fields)) {
    if (record[field] === undefined || record[field] === null || String(record[field]).trim() === '') {
      throw new ValidationError(`${name} is required.`);
    }
  }
};

export const unique = (collection, record, field, name) => {
  const value = String(record[field] || '').toLowerCase();
  if (value && db.get(collection).some((item) => item.id !== record.id && String(item[field] || '').toLowerCase() === value)) {
    throw new ValidationError(`A ${name} with this ${field} already exists.`);
  }
};

export const TIME = /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i;
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
