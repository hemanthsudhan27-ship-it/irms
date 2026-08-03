import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { dbPool } from './database/index.js';
import { seedDatabase } from './database/seed.js';

const app = createApp();

const server = app.listen(config.port, async () => {
  logger.info(`=======================================================`);
  logger.info(`  IRMS Enterprise Backend Server Running`);
  logger.info(`  Environment: ${config.env}`);
  logger.info(`  Port       : ${config.port}`);
  logger.info(`  API Prefix : ${config.apiPrefix}`);
  logger.info(`  Health Check: http://localhost:${config.port}/health`);
  logger.info(`=======================================================`);

  // Seed default admin users
  await seedDatabase();
});

// Graceful Shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await dbPool.end();
      logger.info('PostgreSQL connection pool closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing PostgreSQL pool:', err);
      process.exit(1);
    }
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
