import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "scam_detector.sqlite");

const db = new Database(dbPath);
console.log("Connected to SQLite database at:", dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

function initializeTables() {
  // 1. Create Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Create Scans Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      risk TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      reasons TEXT NOT NULL, -- JSON stringified array
      recommendation TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
    )
  `);
}

initializeTables();

// Promisified DB helpers (kept async-shaped so existing callers don't change)
export const queryAll = async (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

export const queryGet = async (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

export const queryRun = async (sql, params = []) => {
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return { id: info.lastInsertRowid, changes: info.changes };
};

export default db;
