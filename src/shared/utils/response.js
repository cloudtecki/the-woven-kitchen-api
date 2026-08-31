'use strict';

const successResponse = (res, data, message, statusCode = 200) => {
  const body = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
};

const createdResponse = (res, data, message) => successResponse(res, data, message, 201);

const noContentResponse = (res) => res.status(204).send();

const errorResponse = (res, message, statusCode = 500, details) => {
  const body = { success: false, message };
  if (details) body.errors = details;
  res.status(statusCode).json(body);
};

const paginatedResponse = (res, data, pagination) => {
  res.status(200).json({ success: true, data, pagination });
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse,
  errorResponse,
  paginatedResponse,
};
