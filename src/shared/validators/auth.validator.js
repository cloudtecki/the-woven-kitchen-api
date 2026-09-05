'use strict';

const { z } = require('zod');
const { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } = require('../constants/password-policy');
const { PHONE_REGEX, PHONE_ERROR_MESSAGE, normalizePhone } = require('../utils/phone');

const emailSchema = z
  .email({ message: 'Email format is invalid' })
  .transform((value) => String(value).trim().toLowerCase());

const phoneSchema = z
  .string({ error: 'Phone number is required' })
  .trim()
  .min(1, 'Phone number is required')
  .superRefine((value, ctx) => {
    if (!PHONE_REGEX.test(normalizePhone(value))) {
      ctx.addIssue({ code: 'custom', message: PHONE_ERROR_MESSAGE });
    }
  })
  .transform(normalizePhone);

const passwordSchema = z
  .string({ error: 'Password is required' })
  .regex(PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE);

const signupSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  bio: z.string().trim().max(500, 'Bio must be at most 500 characters').optional(),
});

const loginSchema = z.object({
  email: z.email({ message: 'Email format is invalid' }).transform((value) => String(value).trim().toLowerCase()),
  password: z.string({ error: 'Password is required' }).trim().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

module.exports = {
  emailSchema,
  phoneSchema,
  passwordSchema,
  signupSchema,
  loginSchema,
  changePasswordSchema,
};