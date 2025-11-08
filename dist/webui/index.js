#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST || 'localhost';
const staticPath = process.env.STATIC_PATH || undefined;
(0, server_1.startWebUI)({
    port,
    host,
    enableCors: true,
    staticPath,
}).catch((error) => {
    console.error('Failed to start WebUI server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map