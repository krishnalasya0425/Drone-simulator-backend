
const express = require('express');
const router = express.Router();
const scoreController = require('../Controller/scoreController');

// Route to record a new score
router.post('/', scoreController.postScore);

// Route to get test review for a student
router.get('/review/:student_id/:test_set_id', scoreController.getTestReview);

// Route to get all results for a test set
router.get('/test-set/:test_set_id/results', scoreController.getTestSetResults);

// Route to download single result PDF
router.get('/download/:test_set_id/:student_id', scoreController.downloadResultPdf);

// Route to get scores by user ID
router.get('/user/:userId', scoreController.getScoresByUserId);

// Route to get scores by test ID
router.get('/test/:testId', scoreController.getScoresByTestId);

module.exports = router;