/**
 * Catches 404s for any route that wasn't matched.
 */
function notFoundHandler(req, res, next) {
  res.status(404);
  if (req.xhr || req.headers.accept === 'application/json') {
    return res.json({ success: false, message: 'Not found' });
  }
  res.render('errors/404', { title: 'Page Not Found' });
}

/**
 * Centralized error handler. Logs the error and renders a friendly page
 * (or JSON response for AJAX calls) instead of leaking stack traces.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Something went wrong. Please try again.';

  if (req.xhr || req.headers.accept === 'application/json') {
    return res.status(status).json({ success: false, message });
  }

  res.status(status).render('errors/500', {
    title: 'Something Went Wrong',
    message
  });
}

module.exports = { notFoundHandler, errorHandler };
