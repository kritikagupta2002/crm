import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';
import { postgres, TABLE_COLLECTIONS } from './postgres.js';
import { SEED_DATA } from '../db/seed.js';

/*
 * The API's data store. Reads are served from an in-memory cache; every write goes straight to PostgreSQL:
 *   - users, employees, attendance, leaves, corrections and documents have their own tables (row by row);
 *   - every other collection is saved as one JSON document in the `collections` table.
 * Without PostgreSQL (local development only) the same collections are kept as JSON files in server/data.
 */
const keyOf = (item) => item?.id ?? item?.employeeId;

class DataStore {
  constructor() {
    this.cache = new Map();
    // What was last saved for each row of a table collection, so writes only touch rows that really changed
    // (controllers often edit a cached record in place before calling set()).
    this.saved = new Map();
    this.ready = this.init();
  }

  async init() {
    await postgres.initPromise;
    if (postgres.isConnected()) {
      await this.loadFromPostgres();
    } else {
      this.loadFromFiles();
    }
  }

  /*
   * Picks up changes made outside this process (maintenance scripts, another server instance) by re-reading the
   * database every minute, but only when this process has no writes in flight, so nothing it saved is lost.
   */
  startRefresh(intervalMs = 60000) {
    if (this.refreshTimer || !postgres.isConnected()) return;
    this.refreshTimer = setInterval(async () => {
      if (postgres.pending > 0 || Date.now() - postgres.lastWriteAt < 5000) return;
      try {
        await this.reload(Object.keys(SEED_DATA));
      } catch (err) {
        console.warn('[db] Periodic refresh skipped:', err.message);
      }
    }, intervalMs);
    this.refreshTimer.unref?.();
  }

  async loadFromPostgres() {
    for (const [collection, seed] of Object.entries(SEED_DATA)) {
      if (TABLE_COLLECTIONS.includes(collection)) {
        let rows = await postgres.loadTable(collection);
        if (rows.length === 0 && Array.isArray(seed) && seed.length > 0) {
          for (const item of seed) await postgres.persistItem(collection, item);
          rows = await postgres.loadTable(collection);
        }
        this.cache.set(collection, rows);
        this.saved.set(collection, new Map(rows.map((item) => [keyOf(item), JSON.stringify(item)])));
      } else {
        let data = await postgres.loadCollection(collection);
        if (data === null) {
          data = structuredClone(seed);
          await postgres.saveCollection(collection, data);
        }
        this.cache.set(collection, data);
      }
    }
    console.log('[db] Data loaded from PostgreSQL.');
  }

  loadFromFiles() {
    fs.mkdirSync(config.dataDir, { recursive: true });
    for (const [collection, seed] of Object.entries(SEED_DATA)) {
      const file = this.filePath(collection);
      if (fs.existsSync(file)) {
        try {
          this.cache.set(collection, JSON.parse(fs.readFileSync(file, 'utf8')));
          continue;
        } catch (err) {
          console.error(`[db] ${file} is unreadable (${err.message}); starting it from the seed.`);
        }
      }
      this.cache.set(collection, structuredClone(seed));
      this.writeFile(collection);
    }
  }

  filePath(collection) {
    return path.join(config.dataDir, `${collection}.json`);
  }

  writeFile(collection) {
    const file = this.filePath(collection);
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(this.cache.get(collection), null, 2), 'utf8');
    fs.renameSync(`${file}.tmp`, file);
  }

  /* Saves the change: per-row for table collections (only what changed), whole document otherwise. */
  persist(collection, next) {
    if (!postgres.isConnected()) {
      this.writeFile(collection);
      return;
    }
    if (!TABLE_COLLECTIONS.includes(collection)) {
      postgres.saveCollection(collection, next);
      return;
    }
    const before = this.saved.get(collection) || new Map();
    const after = new Map();
    for (const item of next) {
      const key = keyOf(item);
      const snapshot = JSON.stringify(item);
      after.set(key, snapshot);
      if (before.get(key) !== snapshot) postgres.persistItem(collection, item);
    }
    for (const key of before.keys()) {
      if (!after.has(key)) postgres.deleteItem(collection, key);
    }
    this.saved.set(collection, after);
  }

  /* Re-reads collections from PostgreSQL, replacing the in-memory copy (after a failed write, or periodically). */
  async reload(collections) {
    if (!postgres.isConnected()) return;
    for (const collection of collections) {
      if (TABLE_COLLECTIONS.includes(collection)) {
        const rows = await postgres.loadTable(collection);
        this.cache.set(collection, rows);
        this.saved.set(collection, new Map(rows.map((item) => [keyOf(item), JSON.stringify(item)])));
      } else {
        const data = await postgres.loadCollection(collection);
        if (data !== null) this.cache.set(collection, data);
      }
    }
  }

  get(collection) {
    if (!this.cache.has(collection)) this.cache.set(collection, []);
    return this.cache.get(collection);
  }

  set(collection, data) {
    this.cache.set(collection, data);
    this.persist(collection, data);
    return data;
  }

  find(collection, filterFn) {
    const all = this.get(collection);
    return Array.isArray(all) ? all.filter(filterFn) : [];
  }

  findOne(collection, filterFn) {
    const all = this.get(collection);
    return Array.isArray(all) ? all.find(filterFn) ?? null : null;
  }

  findById(collection, id) {
    return this.findOne(collection, (item) => item.id === id || item.employeeId === id);
  }

  insert(collection, item) {
    this.set(collection, [item, ...this.get(collection)]);
    return item;
  }

  update(collection, id, updates) {
    let found = null;
    const next = this.get(collection).map((item) => {
      if (item.id === id || item.employeeId === id) {
        found = { ...item, ...updates, updatedAt: new Date().toISOString() };
        return found;
      }
      return item;
    });
    if (found) this.set(collection, next);
    return found;
  }

  remove(collection, id) {
    const all = this.get(collection);
    const next = all.filter((item) => item.id !== id && item.employeeId !== id);
    if (next.length === all.length) return false;
    this.set(collection, next);
    return true;
  }
}

export const db = new DataStore();
