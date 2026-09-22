'use strict';

const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id');

const variantSchema = z.object({
  label: z.string().trim().min(1, 'Variant label is required').max(100),
  price: z.coerce.number({ error: 'Variant price is required' }).min(0, 'Price must be a non-negative number'),
  offerPrice: z.coerce.number().min(0, 'Offer price must be a non-negative number').optional(),
});

const nutritionSchema = z
  .object({
    calories: z.coerce.number().min(0).optional(),
    protein: z.coerce.number().min(0).optional(),
    carbs: z.coerce.number().min(0).optional(),
    fat: z.coerce.number().min(0).optional(),
  })
  .nullable()
  .optional();

const foodTypeSchema = z.enum(['Veg', 'Non-Veg'], 'Food type must be Veg or Non-Veg');

const createMenuItemSchema = z
  .object({
    name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(100),
    category: objectIdSchema,
    foodType: foodTypeSchema,
    description: z.string().trim().max(1000).optional(),
    servingSize: z.string().trim().max(100).optional(),
    ingredients: z.array(z.string().trim()).default([]),
    variants: z.array(variantSchema).min(1, 'At least one variant with a price is required'),
    status: z.enum(['Active', 'Inactive']).default('Active'),
    isDraft: z.boolean().default(false),
    foodImageUrl: z.string().trim().max(2048).optional(),
    nutrition: nutritionSchema,
    nutritionStatus: z.enum(['Approved', 'Pending']).default('Pending'),
  })
  .strict();

const updateMenuItemSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100).optional(),
    category: objectIdSchema.optional(),
    foodType: foodTypeSchema.optional(),
    description: z.string().trim().max(1000).optional(),
    servingSize: z.string().trim().max(100).optional(),
    ingredients: z.array(z.string().trim()).optional(),
    variants: z.array(variantSchema).min(1, 'At least one variant with a price is required').optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
    isDraft: z.boolean().optional(),
    foodImageUrl: z.string().trim().max(2048).optional(),
    nutrition: nutritionSchema,
    nutritionStatus: z.enum(['Approved', 'Pending']).optional(),
  })
  .strict();

const listMenuQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: objectIdSchema.optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  isDraft: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: z.string().trim().min(1).optional(),
});

module.exports = {
  createMenuItemSchema,
  updateMenuItemSchema,
  listMenuQuerySchema,
};
