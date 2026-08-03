import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Initialize PostgreSQL Pool
export const dbPool = new Pool(
  config.db.connectionString
    ? {
        connectionString: config.db.connectionString,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
        max: config.db.maxPoolSize,
        idleTimeoutMillis: config.db.idleTimeoutMillis,
        connectionTimeoutMillis: config.db.connectionTimeoutMillis,
      }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.password,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
        max: config.db.maxPoolSize,
        idleTimeoutMillis: config.db.idleTimeoutMillis,
        connectionTimeoutMillis: config.db.connectionTimeoutMillis,
      }
);

dbPool.on('connect', () => {
  logger.debug('PostgreSQL database client connected to pool');
});

dbPool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute a query with parameters
 */
export const query = async <T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await dbPool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query: ${text.substring(0, 80)}... (${duration}ms, ${res.rowCount} rows)`);
    return res;
  } catch (err: any) {
    logger.error(`Query error on: ${text}`, err);
    throw err;
  }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async (): Promise<pg.PoolClient> => {
  return await dbPool.connect();
};

/**
 * Run operations within a transaction block
 */
export const withTransaction = async <T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
