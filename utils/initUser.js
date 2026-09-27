const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Ensures at least one admin user exists in the MongoDB database.
 * Uses OWNER_USERNAME (defaults to 'vinisha') and OWNER_PASSWORD_HASH
 * (or bcrypt hash of 'admin' if not set).
 */
async function ensureDefaultUser() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const defaultUsername = (process.env.OWNER_USERNAME || 'vinisha').trim();
      const defaultHash = process.env.OWNER_PASSWORD_HASH || bcrypt.hashSync('vinisha', 10);
      
      await User.create({
        username: defaultUsername,
        passwordHash: defaultHash
      });
      console.log(`[Auth] Default admin user "${defaultUsername}" initialized in MongoDB.`);
    }
  } catch (err) {
    console.error('[Auth] Error initializing default user:', err.message);
  }
}

module.exports = { ensureDefaultUser };
