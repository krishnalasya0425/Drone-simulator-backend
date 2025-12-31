const express = require('express');
const router = express.Router();
const testController = require('../Controller/testController');

// Route to create a new test
router.get('/', testController.getTestsByInstructorId);
router.get('/assigned', testController.getByStudentId);
router.get('/:id', testController.getTestsInfo);
router.get('/download/:id', testController.downloadPdf);
router.get('/downloadscore/:id', testController.downloadScorePdf);
router.get('/score/:id', testController.getTestScoreInfo);
router.put('/:testId', testController.updateTest);
router.delete('/:testId', testController.deleteTest);
router.post('/', testController.createTest);
router.post('/questions',testController.addQuestions);
router.get('/:testId/questions', testController.getTestQuestions);
router.get('/:testId/answers', testController.getTestAnsweers);


module.exports = router;