'use strict';

const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  DB_NAME: z.string().default('thewovencloudkitchen'),
  API_PREFIX: z.string().default('/api'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  ADMIN_NAME: z.string().optional(),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters').optional(),
  ADMIN_PHONE: z.string().optional(),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  mongoUri: parsed.data.MONGODB_URI,
  dbName: parsed.data.DB_NAME,
  apiPrefix: parsed.data.API_PREFIX,
  logLevel: parsed.data.LOG_LEVEL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  admin: {
    name: parsed.data.ADMIN_NAME ?? '',
    email: parsed.data.ADMIN_EMAIL ?? '',
    password: parsed.data.ADMIN_PASSWORD ?? '',
    phone: parsed.data.ADMIN_PHONE ?? '',
  },
};

const isProd = config.nodeEnv === 'production';

module.exports = { config, isProd };
