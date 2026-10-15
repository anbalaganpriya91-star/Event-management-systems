/**
 * routes/bookingRoutes.js
 */
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireLogin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(requireLogin);

router.get('/', asyncHandler(bookingController.list));
router.get('/:id', asyncHandler(bookingController.getOne));
router.post('/', asyncHandler(bookingController.create));
router.put('/:id/status', asyncHandler(bookingController.updateStatus));
router.delete('/:id', asyncHandler(bookingController.remove));

module.exports = router;
