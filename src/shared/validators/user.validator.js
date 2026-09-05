'use strict';

const { z } = require('zod');
const { ROLES } = require('../constants/roles');
const { phoneSchema } = require('./auth.validator');

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource id'),
});

const updateMeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100).optional(),
  phone: phoneSchema.optional(),
  bio: z.string().trim().max(500, 'Bio must be at most 500 characters').optional(),
}).strict('Role, email and password cannot be updated via the profile API');

const adminUpdateUserSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100).optional(),
    phone: phoneSchema.optional(),
    bio: z.string().trim().max(500, 'Bio must be at most 500 characters').optional(),
    role: z.enum(ROLES.ALL).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  role: z.enum(ROLES.ALL).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

module.exports = {
  idParamSchema,
  updateMeSchema,
  adminUpdateUserSchema,
  listUsersQuerySchema,
};