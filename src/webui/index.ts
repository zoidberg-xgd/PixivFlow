#!/usr/bin/env node

import { startWebUI } from './server';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST || 'localhost';
const staticPath = process.env.STATIC_PATH || undefined;

startWebUI({
  port,
  host,
  enableCors: true,
  staticPath,
}).catch((error) => {
  console.error('Failed to start WebUI server:', error);
  process.exit(1);
});

