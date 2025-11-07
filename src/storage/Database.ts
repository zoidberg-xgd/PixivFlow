import DatabaseDriver from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface AccessTokenStore {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  tokenType: string;
}

export interface DownloadRecordInput {
  pixivId: string;
  type: 'illustration' | 'novel';
  tag: string;
  title: string;
  filePath: string;
  userId?: string;
  author?: string;
}

export type ExecutionStatus = 'success' | 'partial' | 'failed';

export class Database {
  private db: DatabaseDriver.Database;

  constructor(private readonly databasePath: string) {
    mkdirSync(dirname(this.databasePath), { recursive: true });
    this.db = new DatabaseDriver(this.databasePath);
  }

  public migrate() {
    const migrations = [
      `CREATE TABLE IF NOT EXISTS tokens (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      `CREATE TABLE IF NOT EXISTS downloads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pixiv_id TEXT NOT NULL,
          type TEXT NOT NULL,
          tag TEXT NOT NULL,
          title TEXT NOT NULL,
          file_path TEXT NOT NULL,
          author TEXT,
          user_id TEXT,
          downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(pixiv_id, type, file_path)
        )`,
      `CREATE TABLE IF NOT EXISTS execution_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tag TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
    ];

    const transaction = this.db.transaction((stmts: string[]) => {
      for (const sql of stmts) {
        this.db.prepare(sql).run();
      }
    });

    transaction(migrations);
  }

  public getToken(key: string): AccessTokenStore | null {
    const stmt = this.db.prepare(`SELECT value FROM tokens WHERE key = ?`);
    const row = stmt.get(key) as { value: string } | undefined;
    if (!row) {
      return null;
    }
    return JSON.parse(row.value) as AccessTokenStore;
  }

  public setToken(key: string, value: AccessTokenStore) {
    const stmt = this.db.prepare(
      `INSERT INTO tokens (key, value, updated_at)
       VALUES (@key, @value, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
    );

    stmt.run({ key, value: JSON.stringify(value) });
  }

  public hasDownloaded(pixivId: string, type: 'illustration' | 'novel'): boolean {
    const stmt = this.db.prepare(
      `SELECT 1 FROM downloads WHERE pixiv_id = ? AND type = ? LIMIT 1`
    );
    const row = stmt.get(pixivId, type);
    return !!row;
  }

  public insertDownload(record: DownloadRecordInput) {
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO downloads (pixiv_id, type, tag, title, file_path, author, user_id)
       VALUES (@pixiv_id, @type, @tag, @title, @file_path, @author, @user_id)`
    );

    stmt.run({
      pixiv_id: record.pixivId,
      type: record.type,
      tag: record.tag,
      title: record.title,
      file_path: record.filePath,
      author: record.author ?? null,
      user_id: record.userId ?? null,
    });
  }

  public logExecution(tag: string, type: 'illustration' | 'novel', status: ExecutionStatus, message?: string) {
    const stmt = this.db.prepare(
      `INSERT INTO execution_log (tag, type, status, message)
       VALUES (@tag, @type, @status, @message)`
    );

    stmt.run({
      tag,
      type,
      status,
      message: message ?? null,
    });
  }

  public close() {
    this.db.close();
  }
}

