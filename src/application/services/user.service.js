'use strict';

const { ROLES } = require('../../shared/constants/roles');
const { NotFoundError, ForbiddenError } = require('../../shared/errors');
const { normalizePhone } = require('../../shared/utils/phone');

function createUserService(userRepository) {
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

  async function requireUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async function getProfile(userId) {
    return toUserDTO(await requireUser(userId));
  }

  async function updateProfile(userId, { name, phone, bio }) {
    const existing = await requireUser(userId);

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (bio !== undefined) patch.bio = bio;
    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (await userRepository.phoneExists(normalizedPhone, { excludeId: userId })) {
        throw new ForbiddenError('Phone number is already in use');
      }
      patch.phone = normalizedPhone;
    }

    const updated = await userRepository.updateById(existing._id, patch);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return toUserDTO(updated);
  }

  async function listUsers({ page, limit, role, isActive }) {
    const result = await userRepository.list({ page, limit, role, isActive });
    return {
      items: result.items.map(toUserDTO),
      pagination: result.pagination,
    };
  }

  async function getUserById(id) {
    return toUserDTO(await requireUser(id));
  }

  async function updateUser(actor, id, { name, phone, bio, role, isActive }) {
    const target = await requireUser(id);

    if (actor.userId === target._id.toString()) {
      if (isActive === false) {
        throw new ForbiddenError('You cannot deactivate your own account');
      }
      if (role && role !== target.role) {
        throw new ForbiddenError('You cannot change your own role');
      }
    }

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (bio !== undefined) patch.bio = bio;
    if (role !== undefined) patch.role = role;
    if (isActive !== undefined) patch.isActive = isActive;
    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (await userRepository.phoneExists(normalizedPhone, { excludeId: id })) {
        throw new ForbiddenError('Phone number is already in use');
      }
      patch.phone = normalizedPhone;
    }

    const updated = await userRepository.updateById(target._id, patch);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return toUserDTO(updated);
  }

  async function deleteUser(actor, id) {
    if (actor.userId === id) {
      throw new ForbiddenError('You cannot delete your own account');
    }
    const deleted = await userRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('User not found');
    }
  }

  return {
    getProfile,
    updateProfile,
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
    toUserDTO,
    ROLES,
  };
}

module.exports = { createUserService };