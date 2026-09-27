const session = require('express-session');
const MongoStore = require('connect-mongo');

/**
 * Builds the express-session middleware configuration.
 * Sessions are persisted in MongoDB via connect-mongo so that
 * logins survive server restarts.
 */
function buildSessionMiddleware() {
  return session({
    secret: process.env.SESSION_SECRET || 'insecure_default_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 7 // 7 days
    }),
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true'
    }
  });
}

module.exports = buildSessionMiddleware;
