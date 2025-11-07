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

export interface SchedulerExecutionRecord {
  id: number;
  executionNumber: number;
  status: 'success' | 'failed' | 'timeout' | 'skipped';
  startTime: string;
  endTime: string | null;
  duration: number | null;
  errorMessage: string | null;
  itemsDownloaded: number;
}

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
      `CREATE TABLE IF NOT EXISTS scheduler_executions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          execution_number INTEGER NOT NULL,
          status TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME,
          duration_ms INTEGER,
          error_message TEXT,
          items_downloaded INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  /**
   * Get the next execution number for the scheduler
   */
  public getNextExecutionNumber(): number {
    const stmt = this.db.prepare(
      `SELECT COALESCE(MAX(execution_number), 0) + 1 as next FROM scheduler_executions`
    );
    const row = stmt.get() as { next: number };
    return row.next;
  }

  /**
   * Log a scheduler execution
   */
  public logSchedulerExecution(
    executionNumber: number,
    status: 'success' | 'failed' | 'timeout' | 'skipped',
    startTime: Date,
    endTime: Date | null,
    durationMs: number | null,
    errorMessage: string | null,
    itemsDownloaded: number = 0
  ) {
    const stmt = this.db.prepare(
      `INSERT INTO scheduler_executions 
       (execution_number, status, start_time, end_time, duration_ms, error_message, items_downloaded)
       VALUES (@execution_number, @status, @start_time, @end_time, @duration_ms, @error_message, @items_downloaded)`
    );

    stmt.run({
      execution_number: executionNumber,
      status,
      start_time: startTime.toISOString(),
      end_time: endTime?.toISOString() ?? null,
      duration_ms: durationMs ?? null,
      error_message: errorMessage ?? null,
      items_downloaded: itemsDownloaded,
    });
  }

  /**
   * Get scheduler execution statistics
   */
  public getSchedulerStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecutionTime: string | null;
    averageDuration: number | null;
    totalItemsDownloaded: number;
  } {
    const statsStmt = this.db.prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' OR status = 'timeout' THEN 1 ELSE 0 END) as failed,
        MAX(start_time) as last_execution,
        AVG(duration_ms) as avg_duration,
        SUM(items_downloaded) as total_items
       FROM scheduler_executions`
    );

    const row = statsStmt.get() as {
      total: number;
      successful: number;
      failed: number;
      last_execution: string | null;
      avg_duration: number | null;
      total_items: number;
    };

    return {
      totalExecutions: row.total ?? 0,
      successfulExecutions: row.successful ?? 0,
      failedExecutions: row.failed ?? 0,
      lastExecutionTime: row.last_execution,
      averageDuration: row.avg_duration ? Math.round(row.avg_duration) : null,
      totalItemsDownloaded: row.total_items ?? 0,
    };
  }

  /**
   * Get recent scheduler executions
   */
  public getRecentSchedulerExecutions(limit: number = 10): SchedulerExecutionRecord[] {
    const stmt = this.db.prepare(
      `SELECT 
        id,
        execution_number,
        status,
        start_time,
        end_time,
        duration_ms,
        error_message,
        items_downloaded
       FROM scheduler_executions
       ORDER BY execution_number DESC
       LIMIT ?`
    );

    const rows = stmt.all(limit) as Array<{
      id: number;
      execution_number: number;
      status: string;
      start_time: string;
      end_time: string | null;
      duration_ms: number | null;
      error_message: string | null;
      items_downloaded: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      executionNumber: row.execution_number,
      status: row.status as 'success' | 'failed' | 'timeout' | 'skipped',
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration_ms,
      errorMessage: row.error_message,
      itemsDownloaded: row.items_downloaded,
    }));
  }

  /**
   * Get consecutive failure count
   */
  public getConsecutiveFailures(): number {
    const stmt = this.db.prepare(
      `SELECT status FROM scheduler_executions 
       ORDER BY execution_number DESC 
       LIMIT 100`
    );

    const rows = stmt.all() as Array<{ status: string }>;
    let count = 0;

    for (const row of rows) {
      if (row.status === 'failed' || row.status === 'timeout') {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  public close() {
    this.db.close();
  }
}

