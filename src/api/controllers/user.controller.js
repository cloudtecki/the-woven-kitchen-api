'use strict';

const { successResponse, paginatedResponse } = require('../../shared/utils/response');

function createUserController(userService) {
  async function getMe(req, res) {
    const user = await userService.getProfile(req.user.userId);
    successResponse(res, user);
  }

  async function updateMe(req, res) {
    const user = await userService.updateProfile(req.user.userId, req.body);
    successResponse(res, user, 'Profile updated successfully');
  }

  async function listUsers(req, res) {
    const { items, pagination } = await userService.listUsers(req.query);
    paginatedResponse(res, items, pagination);
  }

  async function getUserById(req, res) {
    const user = await userService.getUserById(req.params.id);
    successResponse(res, user);
  }

  async function updateUser(req, res) {
    const user = await userService.updateUser(req.user, req.params.id, req.body);
    successResponse(res, user, 'User updated successfully');
  }

  async function deleteUser(req, res) {
    await userService.deleteUser(req.user, req.params.id);
    successResponse(res, {}, 'User deleted successfully');
  }

  return { getMe, updateMe, listUsers, getUserById, updateUser, deleteUser };
}

module.exports = { createUserController };