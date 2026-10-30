import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PostgresService {
  constructor() {
    this.pool = null;
    this.connected = false;
    this.init();
  }

  async init() {
    // Only attempt if DB credentials are provided or localhost is specified
    try {
      this.pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        connectionTimeoutMillis: 3000,
      });

      // Handle pool errors without crashing process
      this.pool.on('error', (err) => {
        console.warn('[PostgreSQL Pool Warning]', err.message);
      });

      // Test client
      const client = await this.pool.connect();
      this.connected = true;
      console.log(`✅ [PostgreSQL] Connected successfully to database: "${config.db.database}" on ${config.db.host}:${config.db.port}`);

      // Run Schema Migration if available
      try {
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(sql);
          console.log('✅ [PostgreSQL] Database tables & schema verified successfully.');
        }
      } catch (schemaErr) {
        console.warn('⚠️ [PostgreSQL Schema Init Error]:', schemaErr.message);
      } finally {
        client.release();
      }
    } catch (err) {
      this.connected = false;
      console.log(`ℹ️ [PostgreSQL] Database not active or credentials pending (${err.message}).`);
      console.log('👉 [Storage Engine] Running on robust persistent JSON Database fallback.');
      console.log('👉 Set valid DB_HOST, DB_USER, DB_PASSWORD in .env when ready to connect your live PostgreSQL database.');
    }
  }

  isConnected() {
    return this.connected;
  }

  async query(text, params) {
    if (!this.connected || !this.pool) {
      throw new Error('PostgreSQL is not connected.');
    }
    return this.pool.query(text, params);
  }
}

export const postgres = new PostgresService();

