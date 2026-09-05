'use strict';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,64}$/;

const PASSWORD_POLICY_MESSAGE =
  'Password must be 8-64 characters long and include at least one uppercase letter, one lowercase letter, and one number, without spaces';

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_POLICY_MESSAGE,
};