'use strict';

const express = require('express');
const { asyncHandler } = require('../../shared/utils/async-handler');

const router = express.Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    res.status(200).json({ status: 'OK' });
  })
);

module.exports = router;
