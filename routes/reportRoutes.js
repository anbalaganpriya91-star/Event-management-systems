/**
 * routes/reportRoutes.js
 */
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireLogin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(requireLogin);
router.get('/bookings', asyncHandler(reportController.bookingReport));
router.get('/export', asyncHandler(reportController.exportCsv));

module.exports = router;
