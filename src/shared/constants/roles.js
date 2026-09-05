'use strict';

const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  ALL: ['ADMIN', 'CUSTOMER'],
});

module.exports = { ROLES };