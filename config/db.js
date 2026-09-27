const mongoose = require('mongoose');
const { ensureDefaultUser } = require('../utils/initUser');

/**
 * Connects to MongoDB using the URI provided in environment variables.
 * Exits the process if the connection cannot be established, since the
 * application cannot function without a database connection.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not defined in your .env file.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    await ensureDefaultUser();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}

module.exports = connectDB;
