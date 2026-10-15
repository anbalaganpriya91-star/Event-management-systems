/**
 * routes/dashboardRoutes.js
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireLogin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(requireLogin);
router.get('/stats', asyncHandler(dashboardController.stats));

module.exports = router;
