#!/usr/bin/env node
/**
 * Generates a bcrypt hash for a password so you can set OWNER_PASSWORD_HASH
 * in your .env file with a password of your choice (instead of the default
 * "admin").
 *
 * Usage:
 *   node scripts/generatePasswordHash.js yourNewPassword
 *   npm run create-owner -- yourNewPassword
 */
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node scripts/generatePasswordHash.js <password>');
  console.log('Example: node scripts/generatePasswordHash.js mySecret123');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('\nAdd this line to your .env file:\n');
console.log(`OWNER_PASSWORD_HASH=${hash}\n`);
