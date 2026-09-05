'use strict';

const { config } = require('../../config');
const { logger } = require('../../shared/utils/logger');
const { connectDB, disconnectDB } = require('../../infrastructure/database/mongoose/connection');
const { User } = require('../../infrastructure/database/models/user.model');
const { ROLES } = require('../../shared/constants/roles');
const { hashPassword } = require('../../shared/utils/password');
const { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } = require('../../shared/constants/password-policy');
const { isValidPhone, normalizePhone } = require('../../shared/utils/phone');

function validateSeed() {
  const { name, email, password, phone } = config.admin;

  if (!name || name.trim().length === 0) {
    throw new Error('ADMIN_NAME is required');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL is required and must be a valid email');
  }
  if (!password) {
    throw new Error('ADMIN_PASSWORD is required');
  }
  if (!PASSWORD_REGEX.test(password)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }
  if (!phone || phone.trim().length === 0) {
    throw new Error('ADMIN_PHONE is required');
  }
  if (!isValidPhone(phone)) {
    throw new Error('ADMIN_PHONE must be a valid 10-digit Indian mobile number');
  }
}

async function seedAdmin() {
  validateSeed();

  const name = config.admin.name.trim();
  const email = config.admin.email.trim().toLowerCase();
  const phone = normalizePhone(config.admin.phone.trim());

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(`Admin with email ${email} already exists. Skipping.`);
    return;
  }

  const passwordHash = await hashPassword(config.admin.password);
  const admin = await User.create({
    name,
    email,
    phone,
    password: passwordHash,
    role: ROLES.ADMIN,
    isActive: true,
  });

  logger.info(`Admin user created: ${admin.email} (${admin.role})`);
}

async function run() {
  try {
    await seedAdmin();
  } catch (error) {
    logger.error('Failed to seed admin user', { error: error.message });
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();