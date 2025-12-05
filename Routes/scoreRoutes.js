const express = require('express');
const router = express.Router();
const scoreController = require('../Controller/scoreController');

// Route to record a new score
router.post('/', scoreController.postScore);

// Route to get scores by user ID
router.get('/:userId', scoreController.getScoresByUserId);

// Route to get scores by test ID
router.get('/:testId', scoreController.getScoresByTestId);

module.exports = router;