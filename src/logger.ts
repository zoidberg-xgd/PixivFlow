import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

class Logger {
  private static readonly levelOrder: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };

  private threshold: LogLevel = 'info';
  private logPath: string | null = null;

  public setLevel(level: LogLevel): void {
    this.threshold = level;
  }

  public setLogPath(path: string): void {
    this.logPath = path;
    // Ensure log directory exists
    const logDir = join(path, '..');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  public debug(message: string, meta?: LogMeta): void {
    this.write('debug', message, meta);
  }

  public info(message: string, meta?: LogMeta): void {
    this.write('info', message, meta);
  }

  public warn(message: string, meta?: LogMeta): void {
    this.write('warn', message, meta);
  }

  public error(message: string, meta?: LogMeta): void {
    this.write('error', message, meta);
  }

  private write(level: LogLevel, message: string, meta?: LogMeta): void {
    if (Logger.levelOrder[level] < Logger.levelOrder[this.threshold]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${payload}`;

    // Output to console
    switch (level) {
      case 'debug':
        console.debug(logLine);
        break;
      case 'info':
        console.info(logLine);
        break;
      case 'warn':
        console.warn(logLine);
        break;
      case 'error':
        console.error(logLine);
        break;
      default:
        console.log(logLine);
    }

    // Write to file if log path is set
    if (this.logPath) {
      try {
        appendFileSync(this.logPath, logLine + '\n', 'utf-8');
      } catch (error) {
        // Silently fail if file write fails to avoid breaking the application
        console.error('Failed to write to log file', error);
      }
    }
  }
}

export const logger = new Logger();

