'use strict';

const { successResponse, createdResponse, paginatedResponse } = require('../../shared/utils/response');
const { ValidationError } = require('../../shared/errors');

function createMenuController(menuService) {
  async function createMenu(req, res) {
    const item = await menuService.createMenuItem(req.body);
    createdResponse(res, item, 'Menu item created successfully');
  }

  async function listMenus(req, res) {
    const { items, pagination } = await menuService.listMenuItems(req.query);
    paginatedResponse(res, items, pagination);
  }

  async function getMenuById(req, res) {
    const item = await menuService.getMenuItemById(req.params.id);
    successResponse(res, item);
  }

  async function updateMenu(req, res) {
    const item = await menuService.updateMenuItem(req.params.id, req.body);
    successResponse(res, item, 'Menu item updated successfully');
  }

  async function deleteMenu(req, res) {
    await menuService.deleteMenuItem(req.params.id);
    successResponse(res, {}, 'Menu item deleted successfully');
  }

  async function uploadImage(req, res) {
    if (!req.file) {
      throw new ValidationError('Image file is required', [{ field: 'image', message: 'Image file is required' }]);
    }
    const foodImageUrl = `/uploads/menu/${req.file.filename}`;
    const item = await menuService.updateMenuItemImage(req.params.id, foodImageUrl);
    successResponse(res, item, 'Food image uploaded successfully');
  }

  async function getTomorrowMenu(req, res) {
    successResponse(res, [], "Tomorrow's menu will be available in a later sprint");
  }

  return { createMenu, listMenus, getMenuById, updateMenu, deleteMenu, uploadImage, getTomorrowMenu };
}

module.exports = { createMenuController };
