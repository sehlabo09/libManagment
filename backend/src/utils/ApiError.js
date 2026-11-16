/**
 * A small custom error class so controllers can throw errors that carry an
 * HTTP status code and optional field level details.
 *
 * Example:  throw new ApiError(400, 'Quantity must be greater than zero');
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = ApiError;
