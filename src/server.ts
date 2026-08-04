import { createApp } from './app.js';
import { env } from './config/env.js';
import { isGmailFullyConfigured } from './config/gmail.config.js';
import { closePool } from './database/connection.js';
import { emailWorkerService } from './services/worker/email-worker.instance.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);

  if (env.email.workerEnabled && isGmailFullyConfigured(env.email.gmail)) {
    emailWorkerService.start();
    console.log(
      `[worker] ativo — intervalo ${env.email.pollIntervalMs}ms, máx ${env.email.workerMaxMessagesPerPoll} e-mails/ciclo`,
    );
  } else if (!env.email.workerEnabled) {
    console.log('[worker] desativado (WORKER_ENABLED=false)');
  } else {
    console.log('[worker] desativado — configure Gmail OAuth no .env');
  }
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  emailWorkerService.stop();

  const forceExitTimer = setTimeout(() => {
    console.error('Shutdown timeout — forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  server.close(async () => {
    clearTimeout(forceExitTimer);
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
