'use strict';

const mongoose = require('mongoose');

function createMenuItemRepository(MenuItem) {
  const byId = (id) => (mongoose.isValidObjectId(id) ? MenuItem : null);

  async function findById(id) {
    const Model = byId(id);
    if (!Model) return null;
    return Model.findById(id).populate('category').lean();
  }

  async function create(payload) {
    const item = await MenuItem.create(payload);
    await item.populate('category');
    return item.toObject();
  }

  async function updateById(id, payload) {
    if (!byId(id)) return null;
    const item = await MenuItem.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .populate('category')
      .lean();
    return item;
  }

  async function deleteById(id) {
    if (!byId(id)) return null;
    return MenuItem.findByIdAndDelete(id).lean();
  }

  async function list({ page, limit, category, status, isDraft, search } = {}) {
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (typeof isDraft === 'boolean') filter.isDraft = isDraft;
    if (search) filter.name = { $regex: String(search).trim(), $options: 'i' };

    const [items, total] = await Promise.all([
      MenuItem.find(filter)
        .populate('category')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MenuItem.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  return { findById, create, updateById, deleteById, list };
}

module.exports = { createMenuItemRepository };
