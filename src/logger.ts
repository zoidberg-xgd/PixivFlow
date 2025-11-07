export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static levelOrder: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };

  private threshold: LogLevel = 'info';

  public setLevel(level: LogLevel) {
    this.threshold = level;
  }

  public debug(message: string, meta?: any) {
    this.write('debug', message, meta);
  }

  public info(message: string, meta?: any) {
    this.write('info', message, meta);
  }

  public warn(message: string, meta?: any) {
    this.write('warn', message, meta);
  }

  public error(message: string, meta?: any) {
    this.write('error', message, meta);
  }

  private write(level: LogLevel, message: string, meta?: any) {
    if (Logger.levelOrder[level] < Logger.levelOrder[this.threshold]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;

    switch (level) {
      case 'debug':
        console.debug(`[${timestamp}] [DEBUG] ${payload}`);
        break;
      case 'info':
        console.info(`[${timestamp}] [INFO] ${payload}`);
        break;
      case 'warn':
        console.warn(`[${timestamp}] [WARN] ${payload}`);
        break;
      case 'error':
        console.error(`[${timestamp}] [ERROR] ${payload}`);
        break;
      default:
        console.log(`[${timestamp}] ${payload}`);
    }
  }
}

export const logger = new Logger();

