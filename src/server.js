'use strict';

const app = require('./app');
const { config } = require('./config');
const { connectDB, disconnectDB } = require('./infrastructure/database/mongoose/connection');
const { logger } = require('./shared/utils/logger');

let server;

async function start() {
  try {
    await connectDB();
    server = app.listen(config.port, () => {
      logger.info(`API running on port ${config.port} (${config.nodeEnv})`);
      logger.info(`Swagger docs: http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      await disconnectDB();
      logger.info('Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
