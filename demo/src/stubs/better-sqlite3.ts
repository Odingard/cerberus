/**
 * Browser stub for better-sqlite3.
 * L4 memory tracking is disabled in the demo (memoryTracking: false),
 * so this constructor is never actually called.
 */
export default class Database {
  constructor() {
    throw new Error('SQLite is not available in the browser. L4 memory tracking requires Node.js.');
  }
}
