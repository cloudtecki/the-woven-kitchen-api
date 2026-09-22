'use strict';

const { successResponse, createdResponse } = require('../../shared/utils/response');

function createCategoryController(categoryService) {
  async function listCategories(req, res) {
    const items = await categoryService.listCategories(req.query);
    successResponse(res, items);
  }

  async function getCategoryById(req, res) {
    const category = await categoryService.getCategoryById(req.params.id);
    successResponse(res, category);
  }

  async function createCategory(req, res) {
    const category = await categoryService.createCategory(req.body);
    createdResponse(res, category, 'Category created successfully');
  }

  return { listCategories, getCategoryById, createCategory };
}

module.exports = { createCategoryController };