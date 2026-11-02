import { AsyncLocalStorage } from 'async_hooks';

/*
 * Per-request record of database writes. The API keeps an in-memory copy of the data and writes to PostgreSQL in
 * order; this lets each request wait for its own writes to be confirmed before it reports success.
 */
export const writeContext = new AsyncLocalStorage();
