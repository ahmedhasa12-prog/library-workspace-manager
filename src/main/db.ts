import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';

let db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS customer_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_debt INTEGER DEFAULT 0,
  debt_amount REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weekly','biweekly','monthly')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  price REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS room_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  room_type_id INTEGER NOT NULL REFERENCES room_types(id),
  check_in_time TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  check_out_time TEXT,
  duration_minutes INTEGER,
  hourly_rate REAL NOT NULL,
  is_subscriber INTEGER DEFAULT 0,
  time_charge REAL,
  products_charge REAL,
  total_amount REAL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'drink',
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS session_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subs_customer ON subscriptions(customer_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notes_customer ON customer_notes(customer_id);
`;

const SEED_ROOMS: [string, string, number][] = [
  ['hall', 'Main Hall (Quiet Study)', 5],
  ['group', 'Group Study / Discussion', 6],
  ['room', 'Private Room (No AC)', 10],
  ['room_ac', 'Private Room (AC)', 15],
];

const SEED_PRODUCTS: [string, string, number, number][] = [
  ['Coffee', 'hot', 5, 100],
  ['Tea', 'hot', 3, 100],
  ['Instant Noodles', 'food', 8, 50],
  ['Water', 'cold', 2, 100],
  ['Soft Drink', 'cold', 4, 60],
  ['Juice', 'cold', 5, 40],
];

const SEED_SETTINGS: [string, string][] = [
  ['currency', 'EGP'],
  ['library_name', 'Library Workspace'],
  ['sub_weekly_price', '100'],
  ['sub_biweekly_price', '180'],
  ['sub_monthly_price', '300'],
];

export function initDb(): Database.Database {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'library.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);

  const roomCount = (db.prepare('SELECT COUNT(*) c FROM room_types').get() as { c: number }).c;
  if (roomCount === 0) {
    const ins = db.prepare('INSERT INTO room_types (key, name, hourly_rate) VALUES (?,?,?)');
    for (const r of SEED_ROOMS) ins.run(...r);
  }
  const prodCount = (db.prepare('SELECT COUNT(*) c FROM products').get() as { c: number }).c;
  if (prodCount === 0) {
    const ins = db.prepare('INSERT INTO products (name, category, price, stock) VALUES (?,?,?,?)');
    for (const p of SEED_PRODUCTS) ins.run(...p);
  }
  const setIns = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?,?)');
  for (const s of SEED_SETTINGS) setIns.run(...s);

  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function getDbPath(): string {
  return path.join(app.getPath('userData'), 'library.db');
}
