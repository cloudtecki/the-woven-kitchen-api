'use strict';

const { z } = require('zod');

const categoryIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id');

const createCategorySchema = z
  .object({
    name: z
      .string({ error: 'Category name is required' })
      .trim()
      .min(1, 'Category name is required')
      .max(100, 'Category name must be at most 100 characters'),
  })
  .strict();

const idParamSchema = z.object({ id: categoryIdSchema });

module.exports = { createCategorySchema, idParamSchema };