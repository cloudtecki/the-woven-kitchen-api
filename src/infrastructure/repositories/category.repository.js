'use strict';

const mongoose = require('mongoose');

function createCategoryRepository(Category) {
  const byId = (id) => (mongoose.isValidObjectId(id) ? Category : null);

  async function findById(id) {
    const Model = byId(id);
    if (!Model) return null;
    return Model.findById(id).lean();
  }

  async function findByName(name) {
    return Category.findOne({ name: String(name).trim() }).lean();
  }

  async function create(payload) {
    const category = await Category.create(payload);
    return category.toObject();
  }

  async function list({ page, limit, isActive } = {}) {
    const filter = {};
    if (typeof isActive === 'boolean') filter.isActive = isActive;
    if (!page || !limit) {
      const items = await Category.find(filter).sort({ name: 1 }).lean();
      return { items, pagination: { page: 1, limit: items.length, total: items.length, pages: 1 } };
    }
    const [items, total] = await Promise.all([
      Category.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  return { findById, findByName, create, list };
}

module.exports = { createCategoryRepository };
