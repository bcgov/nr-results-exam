/**
 * Health server bootstrap
 * 
 * This module creates and starts a lightweight Express server dedicated to health checks.
 * It runs separately from the main Caddy static file server.
 * 
 * Usage:
 *   In production (Docker): node dist/server/mount-health.js
 *   The server listens on HEALTH_PORT (default: 3001)
 * 
 * Integration notes:
 * - This server is intentionally isolated from the main application
 * - It should be started as a separate process in the container
 * - The Dockerfile should run both this health server and Caddy
 */

import express from 'express';
import healthRouter from './health.js';

const app = express();

// Mount health routes at /health
app.use('/health', healthRouter);

// Default handler for other paths
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.HEALTH_PORT || 3001;

app.listen(PORT, () => {
  console.log(`[Health Server] Listening on port ${PORT}`);
  console.log(`[Health Server] Endpoints: /health/ready, /health/live`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[Health Server] Received ${signal}, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
