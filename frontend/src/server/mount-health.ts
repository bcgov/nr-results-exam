import type { Express } from 'express';
import healthRouter from './health';

/**
 * Mount health router into an Express app
 */
export default function mountHealth(app: Express) {
  app.use('/', healthRouter);
}
