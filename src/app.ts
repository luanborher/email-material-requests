import express from 'express';
import { gmailAuthRouter } from './routes/gmail-auth.route.js';
import { gmailRouter } from './routes/gmail.route.js';
import { healthRouter } from './routes/health.route.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use('/health', healthRouter);
  app.use('/auth/gmail', gmailAuthRouter);
  app.use('/gmail', gmailRouter);

  return app;
}
