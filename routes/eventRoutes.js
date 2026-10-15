/**
 * routes/eventRoutes.js
 */
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { requireLogin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(requireLogin);

router.get('/upcoming', asyncHandler(eventController.upcoming));
router.get('/', asyncHandler(eventController.list));
router.get('/:id', asyncHandler(eventController.getOne));
router.post('/', asyncHandler(eventController.create));
router.put('/:id', asyncHandler(eventController.update));
router.delete('/:id', asyncHandler(eventController.remove));

module.exports = router;
