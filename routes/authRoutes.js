const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated, requireAuth } = require('../middleware/auth');

router.get('/login', redirectIfAuthenticated, authController.showLoginPage);
router.post('/login', redirectIfAuthenticated, authController.login);
router.post('/logout', authController.logout);

// Support all URL variations: /change-password, /change_password, /changePassword, /change%20password
const changePasswordPaths = [
  '/change-password',
  '/change_password',
  '/changePassword',
  '/change%20password',
  '/change password'
];

changePasswordPaths.forEach(pathStr => {
  router.get(pathStr, requireAuth, authController.showChangePasswordPage);
  router.post(pathStr, requireAuth, authController.changePassword);
});

module.exports = router;
