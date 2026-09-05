'use strict';

const express = require('express');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { ROLES } = require('../../shared/constants/roles');
const { User } = require('../../infrastructure/database/models/user.model');
const { createUserRepository } = require('../../infrastructure/repositories/user.repository');
const { createUserService } = require('../../application/services/user.service');
const { createUserController } = require('../controllers/user.controller');
const { authenticate, authorizeRoles, validate } = require('../middlewares');
const {
  idParamSchema,
  updateMeSchema,
  adminUpdateUserSchema,
  listUsersQuerySchema,
} = require('../../shared/validators/user.validator');

const router = express.Router();

const userRepository = createUserRepository(User);
const userService = createUserService(userRepository);
const userController = createUserController(userService);

router.get('/me', authenticate, asyncHandler(userController.getMe));
router.patch(
  '/me',
  authenticate,
  validate({ body: updateMeSchema }),
  asyncHandler(userController.updateMe)
);

router.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ query: listUsersQuerySchema }),
  asyncHandler(userController.listUsers)
);
router.get(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(userController.getUserById)
);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema, body: adminUpdateUserSchema }),
  asyncHandler(userController.updateUser)
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(userController.deleteUser)
);

module.exports = router;