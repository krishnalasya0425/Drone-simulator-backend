const express = require('express');
const router = express.Router();
const progressController = require('../Controller/completionprogressController');

// Create or update progress (by subtopic name)
router.post('/', progressController.createOrUpdateProgress);

// Get progress + percentage
router.get('/:studentId/:classId', progressController.getProgressWithPercentage);

module.exports = router;
