'use strict';

const app = require('./app');
const { config, isProd } = require('./config');
const { connectDB, disconnectDB } = require('./infrastructure/database/mongoose/connection');
const { Category } = require('./infrastructure/database/models/category.model');
const { createCategoryRepository } = require('./infrastructure/repositories/category.repository');
const { createCategoryService } = require('./application/services/category.service');
const { DEFAULT_CATEGORIES } = require('./shared/constants/categories');
const { logger } = require('./shared/utils/logger');

const categoryRepository = createCategoryRepository(Category);
const categoryService = createCategoryService(categoryRepository);

let server;

async function start() {
  try {
    await connectDB();
    if (!isProd) {
      const created = await categoryService.ensureDefaultCategories(DEFAULT_CATEGORIES);
      if (created.length > 0) {
        logger.info(`Default categories created: ${created.map((c) => c.name).join(', ')}`);
      }
    }
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
