import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import { logger } from '../logger';

// Routes
import authRoutes from './routes/auth';
import configRoutes from './routes/config';
import downloadRoutes from './routes/download';
import statsRoutes from './routes/stats';
import logsRoutes from './routes/logs';
import filesRoutes from './routes/files';

// WebSocket handlers
import { setupLogStream } from './websocket/LogStream';

export interface WebUIServerOptions {
  port?: number;
  host?: string;
  enableCors?: boolean;
  corsOrigin?: string | string[];
  staticPath?: string;
}

export class WebUIServer {
  private app: Express;
  private server: ReturnType<typeof createServer>;
  private io: SocketServer;
  private port: number;
  private host: string;

  constructor(options: WebUIServerOptions = {}) {
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';

    // Initialize Express app
    this.app = express();

    // Middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS configuration
    if (options.enableCors !== false) {
      this.app.use(
        cors({
          origin: options.corsOrigin || '*',
          credentials: true,
        })
      );
    }

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });

    // API routes
    this.setupRoutes();

    // Error handler
    this.app.use(this.errorHandler);

    // Serve static files (frontend build)
    if (options.staticPath) {
      this.app.use(express.static(options.staticPath));
      // SPA fallback
      this.app.get('*', (req: Request, res: Response) => {
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(options.staticPath!, 'index.html'));
        }
      });
    }

    // Create HTTP server
    this.server = createServer(this.app);

    // Initialize Socket.IO
    this.io = new SocketServer(this.server, {
      cors: {
        origin: options.corsOrigin || '*',
        credentials: true,
      },
    });

    // Setup WebSocket handlers
    setupLogStream(this.io);
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/config', configRoutes);
    this.app.use('/api/download', downloadRoutes);
    this.app.use('/api/stats', statsRoutes);
    this.app.use('/api/logs', logsRoutes);
    this.app.use('/api/files', filesRoutes);
  }

  private errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    logger.error('API Error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        logger.info(`WebUI server started on http://${this.host}:${this.port}`);
        resolve();
      });

      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`Port ${this.port} is already in use`);
        } else {
          logger.error('Server error', { error: err.message });
        }
        reject(err);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        this.server.close(() => {
          logger.info('WebUI server stopped');
          resolve();
        });
      });
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public getIO(): SocketServer {
    return this.io;
  }
}

/**
 * Start WebUI server
 */
export async function startWebUI(options?: WebUIServerOptions): Promise<void> {
  // Set up log file path
  const logPath = path.join(process.cwd(), 'data', 'pixiv-downloader.log');
  logger.setLogPath(logPath);

  const server = new WebUIServer(options);
  await server.start();

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down WebUI server...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

