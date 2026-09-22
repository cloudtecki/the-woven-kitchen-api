'use strict';

const { logger } = require('../../shared/utils/logger');
const { connectDB, disconnectDB } = require('../../infrastructure/database/mongoose/connection');
const { Category } = require('../../infrastructure/database/models/category.model');
const { createCategoryRepository } = require('../../infrastructure/repositories/category.repository');
const { createCategoryService } = require('../../application/services/category.service');
const { DEFAULT_CATEGORIES } = require('../../shared/constants/categories');

const categoryRepository = createCategoryRepository(Category);
const categoryService = createCategoryService(categoryRepository);

async function seedCategories() {
  await connectDB();

  const created = await categoryService.ensureDefaultCategories(DEFAULT_CATEGORIES);

  if (created.length === 0) {
    logger.info('Default categories already exist. Skipping.');
    return;
  }
  logger.info(`Default categories created: ${created.map((c) => c.name).join(', ')}`);
}

async function run() {
  try {
    await seedCategories();
  } catch (error) {
    logger.error('Failed to seed categories', { error: error.message });
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();