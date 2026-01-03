const express = require('express');
const router = express.Router();
const testController = require('../Controller/testController');

// ============= SPECIFIC ROUTES FIRST =============

// Get tests by instructor or student
router.get('/', testController.getTestsByInstructorId);
router.get('/assigned', testController.getByStudentId);

// PDF downloads
router.get('/download/:id', testController.downloadPdf);
router.get('/downloadscore/:id', testController.downloadScorePdf);

// Score info
router.get('/score/:id', testController.getTestScoreInfo);

// Questions management
router.post('/questions', testController.addQuestions);

// ============= PARAMETERIZED ROUTES =============

// Test CRUD operations
router.get('/:id', testController.getTestsInfo);
router.post('/', testController.createTest);
router.put('/:testId', testController.updateTest);
router.delete('/:testId', testController.deleteTest);

// Test questions and answers (by testId/testSetId)
router.get('/:testId/questions', testController.getTestQuestions);
router.get('/:testId/answers', testController.getTestAnsweers);

module.exports = router;