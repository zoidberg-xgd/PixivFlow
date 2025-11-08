import { Express } from 'express';
import { Server as SocketServer } from 'socket.io';
export interface WebUIServerOptions {
    port?: number;
    host?: string;
    enableCors?: boolean;
    corsOrigin?: string | string[];
    staticPath?: string;
}
export declare class WebUIServer {
    private app;
    private server;
    private io;
    private port;
    private host;
    constructor(options?: WebUIServerOptions);
    private setupRoutes;
    private errorHandler;
    start(): Promise<void>;
    stop(): Promise<void>;
    getApp(): Express;
    getIO(): SocketServer;
}
/**
 * Start WebUI server
 */
export declare function startWebUI(options?: WebUIServerOptions): Promise<void>;
//# sourceMappingURL=server.d.ts.map