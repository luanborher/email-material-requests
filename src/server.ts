import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './database/connection.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    await closePool();
    console.log('Server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
