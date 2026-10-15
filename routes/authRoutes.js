/**
 * routes/authRoutes.js
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', authController.logout);
router.get('/me', authController.me);

module.exports = router;
