/**
 * routes/venueRoutes.js
 */
const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { requireLogin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(requireLogin);

router.get('/available', asyncHandler(venueController.available));
router.get('/', asyncHandler(venueController.list));
router.get('/:id', asyncHandler(venueController.getOne));
router.post('/', asyncHandler(venueController.create));
router.put('/:id', asyncHandler(venueController.update));
router.delete('/:id', asyncHandler(venueController.remove));

module.exports = router;
