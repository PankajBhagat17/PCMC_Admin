const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievance.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/submit', authMiddleware, grievanceController.submitGrievance);
router.get('/all', grievanceController.getAllGrievances);

// MUST BE BEFORE /:id
router.get('/stats', grievanceController.getStats);

router.get('/:id', grievanceController.getGrievanceById);
router.post('/:id/feedback', authMiddleware, grievanceController.submitFeedback);
router.patch('/:id/status', authMiddleware, grievanceController.updateStatus);

module.exports = router;