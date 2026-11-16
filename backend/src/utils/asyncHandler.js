/**
 * Wraps an async route handler so any rejected promise is forwarded to
 * Express' error handler instead of crashing the server.
 *
 * Usage:  router.get('/', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(handler) {
  return function (req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
