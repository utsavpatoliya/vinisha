/**
 * Wraps an async Express route handler so that any thrown error or
 * rejected promise is automatically forwarded to next(err) instead of
 * crashing the process or requiring a try/catch in every controller.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
