const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievance.controller');

// Route to submit a new grievance
router.post('/', grievanceController.createGrievance);

// Route to fetch all grievances for the dashboard
router.get('/', grievanceController.getAllGrievances);

// Route to fetch a single grievance by ID (Fixes the ticket detail view)
router.get('/:id', grievanceController.getGrievanceById);

// Route to update a grievance's status
router.patch('/:id/status', grievanceController.updateStatus);

module.exports = router;