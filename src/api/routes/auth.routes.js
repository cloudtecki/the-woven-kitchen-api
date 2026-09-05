'use strict';

const express = require('express');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { User } = require('../../infrastructure/database/models/user.model');
const { createUserRepository } = require('../../infrastructure/repositories/user.repository');
const { createAuthService } = require('../../application/services/auth.service');
const { createAuthController } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/authenticate');
const { validate } = require('../middlewares/validate');
const { signupSchema, loginSchema, changePasswordSchema } = require('../../shared/validators/auth.validator');

const router = express.Router();

const userRepository = createUserRepository(User);
const authService = createAuthService(userRepository);
const authController = createAuthController(authService);

router.post('/signup', validate({ body: signupSchema }), asyncHandler(authController.signup));
router.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login));
router.patch(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword)
);

module.exports = router;