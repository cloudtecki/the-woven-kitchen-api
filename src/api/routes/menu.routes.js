'use strict';

const express = require('express');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { ROLES } = require('../../shared/constants/roles');
const { authenticate, authorizeRoles, validate } = require('../middlewares');
const { idParamSchema } = require('../../shared/validators/user.validator');
const {
  getTomorrowMenu,
  createMenu,
  updateMenu,
  deleteMenu,
} = require('../controllers/menu.controller');

const router = express.Router();

router.get(
  '/tomorrow',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  asyncHandler(getTomorrowMenu)
);

router.post('/', authenticate, authorizeRoles(ROLES.ADMIN), asyncHandler(createMenu));
router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(updateMenu)
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(deleteMenu)
);

module.exports = router;