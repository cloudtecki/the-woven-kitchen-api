'use strict';

const express = require('express');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { ROLES } = require('../../shared/constants/roles');
const { authenticate, authorizeRoles, validate } = require('../middlewares');
const {
  createCategorySchema,
  idParamSchema,
} = require('../../shared/validators/category.validator');
const {
  createCategoryController,
} = require('../controllers/category.controller');
const {
  createCategoryService,
} = require('../../application/services/category.service');
const {
  createCategoryRepository,
} = require('../../infrastructure/repositories/category.repository');
const {
  Category,
} = require('../../infrastructure/database/models/category.model');

const categoryRepository = createCategoryRepository(Category);
const categoryService = createCategoryService(categoryRepository);
const categoryController = createCategoryController(categoryService);

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  asyncHandler(categoryController.listCategories),
);

router.get(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  validate({ params: idParamSchema }),
  asyncHandler(categoryController.getCategoryById),
);

router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ body: createCategorySchema }),
  asyncHandler(categoryController.createCategory),
);

module.exports = router;