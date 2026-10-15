/**
 * routes/paymentRoutes.js
 */
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireLogin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(requireLogin);

router.get('/', asyncHandler(paymentController.list));
router.get('/:id', asyncHandler(paymentController.getOne));
router.post('/:id/process', asyncHandler(paymentController.process));
router.post('/:id/refund', asyncHandler(paymentController.refund));
router.post('/:id/fail', asyncHandler(paymentController.markFailed));

module.exports = router;
