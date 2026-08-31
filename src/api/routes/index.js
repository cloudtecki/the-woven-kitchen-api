'use strict';

const express = require('express');
const { config } = require('../../config');

const router = express.Router();

router.use(require('./health.routes'));

module.exports = router;
