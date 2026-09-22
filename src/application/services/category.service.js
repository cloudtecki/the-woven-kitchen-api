'use strict';

const { NotFoundError, ValidationError, ConflictError } = require('../../shared/errors');

function createCategoryService(categoryRepository) {
  function toCategoryDTO(category) {
    return {
      id: category._id.toString(),
      name: category.name,
    };
  }

  async function listCategories({ page, limit } = {}) {
    const result = await categoryRepository.list({ page, limit, isActive: true });
    return result.items.map(toCategoryDTO);
  }

  async function getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return toCategoryDTO(category);
  }

  async function createCategory(payload) {
    const name = String(payload.name).trim();
    if (!name) {
      throw new ValidationError('Category name is required', [
        { field: 'name', message: 'Category name is required' },
      ]);
    }
    const existing = await categoryRepository.findByName(name);
    if (existing) {
      throw new ConflictError('Category already exists');
    }
    const created = await categoryRepository.create({ name });
    return toCategoryDTO(created);
  }

  /**
   * Idempotently creates any missing default categories so menu items can
   * always be created against a category that exists. Returns the created
   * categories (empty when everything already exists).
   */
  async function ensureDefaultCategories(names) {
    const created = [];
    for (const name of names) {
      const trimmed = String(name).trim();
      if (!trimmed) continue;
      const existing = await categoryRepository.findByName(trimmed);
      if (existing) continue;
      created.push(await categoryRepository.create({ name: trimmed }));
    }
    return created.map(toCategoryDTO);
  }

  return { listCategories, getCategoryById, createCategory, ensureDefaultCategories };
}

module.exports = { createCategoryService };