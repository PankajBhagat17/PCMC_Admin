const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievance.controller');

// Route to submit a new grievance
router.post('/', grievanceController.createGrievance);

// Route to fetch all grievances for the dashboard
router.get('/', grievanceController.getAllGrievances);

// Route to update a grievance's status
router.patch('/:id/status', grievanceController.updateStatus);

module.exports = router;