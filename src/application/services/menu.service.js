'use strict';

const { NotFoundError, ValidationError } = require('../../shared/errors');

function createMenuService(menuItemRepository, categoryRepository) {
  function toCategoryDTO(category) {
    if (!category) return null;
    if (typeof category === 'string') return category;
    return {
      id: category._id.toString(),
      name: category.name,
    };
  }

  function toMenuItemDTO(item) {
    return {
      id: item._id.toString(),
      name: item.name,
      category: toCategoryDTO(item.category),
      foodType: item.foodType || 'Non-Veg',
      description: item.description || null,
      servingSize: item.servingSize || null,
      ingredients: item.ingredients || [],
      variants: (item.variants || []).map((variant) => ({
        label: variant.label,
        price: variant.price,
        ...(variant.offerPrice !== undefined && variant.offerPrice !== null
          ? { offerPrice: variant.offerPrice }
          : {}),
      })),
      status: item.status,
      isDraft: item.isDraft,
      foodImageUrl: item.foodImageUrl || null,
      nutrition: item.nutrition || null,
      nutritionStatus: item.nutritionStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async function requireCategory(categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new ValidationError('Category not found', [{ field: 'category', message: 'Category not found' }]);
    }
    return category;
  }

  async function requireMenuItem(id) {
    const item = await menuItemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Menu item not found');
    }
    return item;
  }

  async function createMenuItem(payload) {
    await requireCategory(payload.category);
    const created = await menuItemRepository.create(payload);
    return toMenuItemDTO(created);
  }

  async function listMenuItems({ page, limit, category, status, isDraft, search }) {
    if (category) {
      await requireCategory(category);
    }
    const result = await menuItemRepository.list({ page, limit, category, status, isDraft, search });
    return {
      items: result.items.map(toMenuItemDTO),
      pagination: result.pagination,
    };
  }

  async function getMenuItemById(id) {
    return toMenuItemDTO(await requireMenuItem(id));
  }

  async function updateMenuItem(id, payload) {
    if (payload.category) {
      await requireCategory(payload.category);
    }
    await requireMenuItem(id);
    const updated = await menuItemRepository.updateById(id, payload);
    if (!updated) {
      throw new NotFoundError('Menu item not found');
    }
    return toMenuItemDTO(updated);
  }

  async function deleteMenuItem(id) {
    const deleted = await menuItemRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Menu item not found');
    }
  }

  async function updateMenuItemImage(id, foodImageUrl) {
    await requireMenuItem(id);
    const updated = await menuItemRepository.updateById(id, { foodImageUrl });
    if (!updated) {
      throw new NotFoundError('Menu item not found');
    }
    return toMenuItemDTO(updated);
  }

  return {
    createMenuItem,
    listMenuItems,
    getMenuItemById,
    updateMenuItem,
    deleteMenuItem,
    updateMenuItemImage,
    toMenuItemDTO,
  };
}

module.exports = { createMenuService };
