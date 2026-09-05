'use strict';

const mongoose = require('mongoose');

function createUserRepository(User) {
  const byId = (id) => (mongoose.isValidObjectId(id) ? User : null);

  async function findByEmail(email, { withPassword = false } = {}) {
    const query = User.findOne({ email: String(email).toLowerCase().trim() });
    if (withPassword) query.select('+password');
    return query.lean();
  }

  async function findById(id, { withPassword = false } = {}) {
    const Model = byId(id);
    if (!Model) return null;
    const query = Model.findById(id);
    if (withPassword) query.select('+password');
    return query.lean();
  }

  async function emailExists(email) {
    const existing = await User.exists({ email: String(email).toLowerCase().trim() });
    return Boolean(existing);
  }

  async function phoneExists(phone, { excludeId } = {}) {
    const filter = { phone };
    if (excludeId && mongoose.isValidObjectId(excludeId)) {
      filter._id = { $ne: excludeId };
    }
    const existing = await User.exists(filter);
    return Boolean(existing);
  }

  async function create(payload) {
    const user = await User.create(payload);
    return user.toObject();
  }

  async function updateById(id, payload) {
    if (!byId(id)) return null;
    const user = await User.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean();
    return user;
  }

  async function deleteById(id) {
    if (!byId(id)) return null;
    return User.findByIdAndDelete(id).lean();
  }

  async function list({ page, limit, role, isActive } = {}) {
    const filter = {};
    if (role) filter.role = role;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  return {
    findByEmail,
    findById,
    emailExists,
    phoneExists,
    create,
    updateById,
    deleteById,
    list,
  };
}

module.exports = { createUserRepository };