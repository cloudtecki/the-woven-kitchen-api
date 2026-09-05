'use strict';

const { createdResponse, successResponse } = require('../../shared/utils/response');

function createAuthController(authService) {
  async function signup(req, res) {
    const result = await authService.signup(req.body);
    createdResponse(res, result.user, 'Signup successful');
  }

  async function login(req, res) {
    const result = await authService.login(req.body);
    successResponse(res, result, 'Login successful');
  }

  async function changePassword(req, res) {
    await authService.changePassword({
      userId: req.user.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    successResponse(res, {}, 'Password changed successfully');
  }

  return { signup, login, changePassword };
}

module.exports = { createAuthController };