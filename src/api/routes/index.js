'use strict';

const express = require('express');

const router = express.Router();

router.use(require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/orders', require('./order.routes'));

module.exports = router;