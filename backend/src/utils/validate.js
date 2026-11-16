const ApiError = require('./ApiError');

/**
 * Tiny hand written validation helpers. They keep the project dependency free
 * and are easy to read.
 */

// Basic email shape check: something@something.something
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(400, `${fieldName} is required`);
  }
  return value.trim();
}

function requireEmail(value, fieldName = 'Email') {
  const email = requireString(value, fieldName).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, `${fieldName} must be a valid email address`);
  }
  return email;
}

/**
 * Validates an integer quantity and returns it as a number.
 */
function requirePositiveInt(value, fieldName, { min = 1 } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min) {
    throw new ApiError(400, `${fieldName} must be a whole number of at least ${min}`);
  }
  return number;
}

function requireNonNegativeInt(value, fieldName) {
  return requirePositiveInt(value, fieldName, { min: 0 });
}

function requireId(value, fieldName = 'id') {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(400, `A valid ${fieldName} is required`);
  }
  return number;
}

function requireRole(value) {
  const role = String(value || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'USER') {
    throw new ApiError(400, 'Role must be either ADMIN or USER');
  }
  return role;
}

/**
 * Password policy: at least 8 characters, one letter and one number.
 */
function requireStrongPassword(value, fieldName = 'Password') {
  const password = requireString(value, fieldName);
  if (password.length < 8) {
    throw new ApiError(400, `${fieldName} must be at least 8 characters long`);
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new ApiError(400, `${fieldName} must contain at least one letter and one number`);
  }
  return password;
}

module.exports = {
  requireString,
  requireEmail,
  requirePositiveInt,
  requireNonNegativeInt,
  requireId,
  requireRole,
  requireStrongPassword,
};
