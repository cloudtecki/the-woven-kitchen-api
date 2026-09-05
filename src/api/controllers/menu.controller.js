'use strict';

const { successResponse } = require('../../shared/utils/response');
const { NotImplementedError } = require('../../shared/errors');

async function getTomorrowMenu(req, res) {
  successResponse(res, [], 'Tomorrow\'s menu will be available in a later sprint');
}

async function createMenu() {
  throw new NotImplementedError('Menu management will be available in a later sprint');
}

async function updateMenu() {
  throw new NotImplementedError('Menu management will be available in a later sprint');
}

async function deleteMenu() {
  throw new NotImplementedError('Menu management will be available in a later sprint');
}

module.exports = { getTomorrowMenu, createMenu, updateMenu, deleteMenu };