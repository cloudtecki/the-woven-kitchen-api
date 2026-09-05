'use strict';

const { paginatedResponse } = require('../../shared/utils/response');
const { NotFoundError, NotImplementedError } = require('../../shared/errors');

async function listOrders(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  paginatedResponse(res, [], { page, limit, total: 0, pages: 0 });
}

async function getOrderById() {
  throw new NotFoundError('Order not found');
}

async function placeOrder() {
  throw new NotImplementedError('Order placement will be available in a later sprint');
}

async function updateOrder() {
  throw new NotImplementedError('Order management will be available in a later sprint');
}

module.exports = { listOrders, getOrderById, placeOrder, updateOrder };