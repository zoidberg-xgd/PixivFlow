import { Server as SocketServer } from 'socket.io';
interface LogStreamOptions {
    logPath?: string;
    maxLines?: number;
}
export declare function setupLogStream(io: SocketServer, options?: LogStreamOptions): void;
export {};
//# sourceMappingURL=LogStream.d.ts.map