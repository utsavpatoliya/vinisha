/**
 * Ensures the request comes from a logged-in owner. If not, redirects to
 * the login page (for normal page requests) or returns a 401 JSON error
 * (for AJAX/API requests).
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }

  if (req.xhr || req.headers.accept === 'application/json') {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
}

/**
 * If the owner is already logged in, skip the login page and send them
 * straight to the dashboard.
 */
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/dashboard');
  }
  return next();
}

module.exports = { requireAuth, redirectIfAuthenticated };
