"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class Database {
    databasePath;
    db;
    constructor(databasePath) {
        this.databasePath = databasePath;
        (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(this.databasePath), { recursive: true });
        this.db = new better_sqlite3_1.default(this.databasePath);
    }
    migrate() {
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
        const transaction = this.db.transaction((stmts) => {
            for (const sql of stmts) {
                this.db.prepare(sql).run();
            }
        });
        transaction(migrations);
    }
    getToken(key) {
        const stmt = this.db.prepare(`SELECT value FROM tokens WHERE key = ?`);
        const row = stmt.get(key);
        if (!row) {
            return null;
        }
        return JSON.parse(row.value);
    }
    setToken(key, value) {
        const stmt = this.db.prepare(`INSERT INTO tokens (key, value, updated_at)
       VALUES (@key, @value, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`);
        stmt.run({ key, value: JSON.stringify(value) });
    }
    hasDownloaded(pixivId, type) {
        const stmt = this.db.prepare(`SELECT 1 FROM downloads WHERE pixiv_id = ? AND type = ? LIMIT 1`);
        const row = stmt.get(pixivId, type);
        return !!row;
    }
    insertDownload(record) {
        const stmt = this.db.prepare(`INSERT OR IGNORE INTO downloads (pixiv_id, type, tag, title, file_path, author, user_id)
       VALUES (@pixiv_id, @type, @tag, @title, @file_path, @author, @user_id)`);
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
    logExecution(tag, type, status, message) {
        const stmt = this.db.prepare(`INSERT INTO execution_log (tag, type, status, message)
       VALUES (@tag, @type, @status, @message)`);
        stmt.run({
            tag,
            type,
            status,
            message: message ?? null,
        });
    }
    close() {
        this.db.close();
    }
}
exports.Database = Database;
//# sourceMappingURL=Database.js.map