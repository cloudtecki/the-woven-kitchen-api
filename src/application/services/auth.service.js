'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../../config');
const { ROLES } = require('../../shared/constants/roles');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../../shared/errors');
const { hashPassword, comparePassword } = require('../../shared/utils/password');
const { normalizePhone } = require('../../shared/utils/phone');

function createAuthService(userRepository) {
  function toUserDTO(user) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      bio: user.bio || null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async function signup({ name, email, phone, password, bio }) {
    if (await userRepository.emailExists(email)) {
      throw new ConflictError('Email already registered');
    }

    const normalizedPhone = normalizePhone(phone);
    if (await userRepository.phoneExists(normalizedPhone)) {
      throw new ConflictError('Phone number is already registered');
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({
      name,
      email,
      phone: normalizedPhone,
      password: passwordHash,
      role: ROLES.CUSTOMER,
      bio,
    });

    return { user: toUserDTO(user) };
  }

  async function login({ email, password }) {
    const user = await userRepository.findByEmail(email, { withPassword: true });
    if (!user || !(await comparePassword(password, user.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated');
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return { token, user: toUserDTO(user) };
  }

  async function changePassword({ userId, currentPassword, newPassword }) {
    const user = await userRepository.findById(userId, { withPassword: true });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (!(await comparePassword(currentPassword, user.password))) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updateById(userId, { password: passwordHash });
  }

  return {
    signup,
    login,
    changePassword,
    toUserDTO,
  };
}

module.exports = { createAuthService };