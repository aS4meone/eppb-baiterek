import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

/**
 * Хранилище MVP: встроенный SQLite (node:sqlite), JSON-поля как TEXT.
 * Слой доступа изолирован в repo.ts — при переходе в прод заменяется на
 * PostgreSQL без изменения остального кода.
 */

const DB_DIR = process.env.EPPB_DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "eppb.db");

declare global {
  var __eppbDb: DatabaseSync | undefined;
}

function init(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      direction TEXT NOT NULL DEFAULT '',
      organization TEXT NOT NULL DEFAULT '',
      organization_logo TEXT,
      audience TEXT NOT NULL DEFAULT '[]',
      conditions TEXT NOT NULL DEFAULT '[]',
      schema TEXT NOT NULL DEFAULT '{"stages":[]}',
      status TEXT NOT NULL DEFAULT 'draft',
      version INTEGER NOT NULL DEFAULT 1,
      is_popular INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT UNIQUE NOT NULL,
      service_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      stage_index INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      data TEXT NOT NULL DEFAULT '{}',
      documents TEXT NOT NULL DEFAULT '[]',
      history TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      iin TEXT NOT NULL,
      company TEXT,
      bin TEXT,
      oked TEXT,
      region TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      application_id INTEGER,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      read_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      organization TEXT NOT NULL,
      region TEXT NOT NULL,
      locality TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      industry TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      url TEXT,
      category TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL,
      period TEXT NOT NULL,
      source_url TEXT,
      embed_url TEXT
    );

    CREATE TABLE IF NOT EXISTS references_ (
      code TEXT NOT NULL,
      value TEXT NOT NULL,
      label TEXT NOT NULL,
      PRIMARY KEY (code, value)
    );
  `);
}

export function getDb(): DatabaseSync {
  if (!globalThis.__eppbDb) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    init(db);
    globalThis.__eppbDb = db;
  }
  return globalThis.__eppbDb;
}
