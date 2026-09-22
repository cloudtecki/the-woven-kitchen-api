'use strict';

const express = require('express');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { ROLES } = require('../../shared/constants/roles');
const { authenticate, authorizeRoles, validate } = require('../middlewares');
const { idParamSchema } = require('../../shared/validators/user.validator');
const {
  createMenuItemSchema,
  updateMenuItemSchema,
  listMenuQuerySchema,
} = require('../../shared/validators/menu.validator');
const { createMenuController } = require('../controllers/menu.controller');
const {
  createMenuService,
} = require('../../application/services/menu.service');
const {
  createMenuItemRepository,
} = require('../../infrastructure/repositories/menu-item.repository');
const {
  createCategoryRepository,
} = require('../../infrastructure/repositories/category.repository');
const {
  MenuItem,
} = require('../../infrastructure/database/models/menu-item.model');
const {
  Category,
} = require('../../infrastructure/database/models/category.model');
const { uploadMenuImage } = require('../../config/upload');
const { ValidationError } = require('../../shared/errors');

const menuItemRepository = createMenuItemRepository(MenuItem);
const categoryRepository = createCategoryRepository(Category);
const menuService = createMenuService(menuItemRepository, categoryRepository);
const menuController = createMenuController(menuService);

const router = express.Router();

function uploadSingle(req, res, next) {
  uploadMenuImage.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(
          new ValidationError('Image must be at most 5MB', [
            { field: 'image', message: 'Image must be at most 5MB' },
          ]),
        );
        return;
      }
      next(err);
      return;
    }
    next();
  });
}

router.get(
  '/tomorrow',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  asyncHandler(menuController.getTomorrowMenu),
);

router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ body: createMenuItemSchema }),
  asyncHandler(menuController.createMenu),
);

router.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  validate({ query: listMenuQuerySchema }),
  asyncHandler(menuController.listMenus),
);

router.get(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  validate({ params: idParamSchema }),
  asyncHandler(menuController.getMenuById),
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema, body: updateMenuItemSchema }),
  asyncHandler(menuController.updateMenu),
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(menuController.deleteMenu),
);

router.post(
  '/:id/image',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  uploadSingle,
  asyncHandler(menuController.uploadImage),
);

module.exports = router;
