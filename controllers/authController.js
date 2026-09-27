const bcrypt = require('bcryptjs');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// GET /login
function showLoginPage(req, res) {
  res.render('login', { title: 'Login', error: null });
}

// POST /login
const login = asyncHandler(async (req, res) => {
  const inputUsername = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();

  if (!inputUsername || !password) {
    return res.status(400).render('login', {
      title: 'Login',
      error: 'Please enter both username and password.'
    });
  }

  // Find user in MongoDB database
  let user = await User.findOne({
    username: { $regex: new RegExp('^' + inputUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') }
  });

  if (!user) {
    user = await User.findOne({});
  }

  // Allow 'vinisha' or matching user in DB
  const configuredUsername = (process.env.OWNER_USERNAME || 'vinisha').trim().toLowerCase();
  const isUsernameValid =
    inputUsername.toLowerCase() === configuredUsername ||
    (user && user.username.toLowerCase() === inputUsername.toLowerCase());

  let isMatch = false;

  if (user && user.passwordHash) {
    isMatch = await bcrypt.compare(password, user.passwordHash);
  }

  // Fallback check against env hash
  if (!isMatch && process.env.OWNER_PASSWORD_HASH) {
    isMatch = await bcrypt.compare(password, process.env.OWNER_PASSWORD_HASH);
  }

  if (!isUsernameValid || !isMatch) {
    return res.status(401).render('login', {
      title: 'Login',
      error: 'Invalid username or password.'
    });
  }

  const activeUsername = user ? user.username : 'vinisha';

  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regenerate error:', err);
      return res.status(500).render('login', {
        title: 'Login',
        error: 'Something went wrong. Please try again.'
      });
    }

    req.session.isAuthenticated = true;
    req.session.username = activeUsername;
    req.session.userId = user ? user._id : null;

    const returnTo = req.session.returnTo;
    delete req.session.returnTo;

    res.redirect(returnTo || '/dashboard');
  });
});

// GET /change-password
function showChangePasswordPage(req, res) {
  res.render('change-password', { title: 'Change Password', error: null, success: null });
}

// POST /change-password
const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = (req.body.currentPassword || '').trim();
  const newPassword = (req.body.newPassword || '').trim();
  const confirmPassword = (req.body.confirmPassword || '').trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).render('change-password', {
      title: 'Change Password',
      error: 'Please fill in all required fields.',
      success: null
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).render('change-password', {
      title: 'Change Password',
      error: 'New password and confirm password do not match.',
      success: null
    });
  }

  if (newPassword.length < 4) {
    return res.status(400).render('change-password', {
      title: 'Change Password',
      error: 'New password must be at least 4 characters long.',
      success: null
    });
  }

  // Find user in database
  let user = null;
  if (req.session.userId) {
    user = await User.findById(req.session.userId);
  }
  if (!user && req.session.username) {
    user = await User.findOne({ username: req.session.username });
  }
  if (!user) {
    user = await User.findOne({});
  }

  if (!user) {
    // If no user exists, create one with username vinisha
    const defaultHash = await bcrypt.hash(newPassword, 10);
    user = await User.create({
      username: 'vinisha',
      passwordHash: defaultHash
    });
    req.session.username = user.username;
    req.session.userId = user._id;
    return res.render('change-password', {
      title: 'Change Password',
      error: null,
      success: 'Password set successfully! Next time you sign in, use your new password.'
    });
  }

  // Verify current password with bcrypt
  let isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch && process.env.OWNER_PASSWORD_HASH) {
    isMatch = await bcrypt.compare(currentPassword, process.env.OWNER_PASSWORD_HASH);
  }

  if (!isMatch) {
    return res.status(400).render('change-password', {
      title: 'Change Password',
      error: 'Current password is incorrect.',
      success: null
    });
  }

  // Hash new password using bcrypt
  const newHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newHash;
  user.username = 'vinisha';
  await user.save();

  req.session.username = user.username;
  req.session.userId = user._id;

  res.render('change-password', {
    title: 'Change Password',
    error: null,
    success: 'Password changed successfully! Next time you sign in, use your new password.'
  });
});

// POST /logout
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
}

module.exports = { showLoginPage, login, showChangePasswordPage, changePassword, logout };
