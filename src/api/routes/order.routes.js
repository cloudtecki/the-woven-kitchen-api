'use strict';

const express = require('express');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { ROLES } = require('../../shared/constants/roles');
const { authenticate, authorizeRoles, validate } = require('../middlewares');
const { idParamSchema } = require('../../shared/validators/user.validator');
const { listOrders, getOrderById, placeOrder, updateOrder } = require('../controllers/order.controller');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  asyncHandler(placeOrder)
);

router.get(
  '/',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  asyncHandler(listOrders)
);

router.get(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN, ROLES.CUSTOMER),
  validate({ params: idParamSchema }),
  asyncHandler(getOrderById)
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(updateOrder)
);

module.exports = router;