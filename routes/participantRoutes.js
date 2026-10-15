/**
 * routes/participantRoutes.js
 */
const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const { requireLogin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(requireLogin);

router.get('/all', asyncHandler(participantController.all));
router.get('/', asyncHandler(participantController.list));
router.get('/:id', asyncHandler(participantController.getOne));
router.post('/', asyncHandler(participantController.create));
router.put('/:id', asyncHandler(participantController.update));
router.delete('/:id', asyncHandler(participantController.remove));

module.exports = router;
