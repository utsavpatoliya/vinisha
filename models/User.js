const mongoose = require('mongoose');

// NOTE: The current version of this app authenticates the single shop
// owner using OWNER_USERNAME / OWNER_PASSWORD_HASH from the .env file
// (see middleware/auth.js and controllers/authController.js). This model
// is provided as requested by the spec and is ready to be used if you
// later want to move credentials into the database or support multiple
// users/staff logins.
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
