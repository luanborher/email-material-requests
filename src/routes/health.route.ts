import { Router } from 'express';
import { getHealthStatus } from '../services/health.service.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const response = await getHealthStatus();
  const statusCode = response.status === 'ok' ? 200 : 503;

  res.status(statusCode).json(response);
});
