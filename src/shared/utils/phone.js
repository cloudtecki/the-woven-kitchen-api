'use strict';

const PHONE_REGEX = /^[6-9]\d{9}$/;

const PHONE_ERROR_MESSAGE =
  'Phone number must be a valid 10-digit Indian mobile number (e.g. 9876543210)';

function normalizePhone(value) {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
}

function isValidPhone(value) {
  return typeof value === 'string' && PHONE_REGEX.test(normalizePhone(value));
}

module.exports = { PHONE_REGEX, PHONE_ERROR_MESSAGE, normalizePhone, isValidPhone };