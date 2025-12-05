const express = require('express');
const router = express.Router();
const testController = require('../Controller/testController');

// Route to create a new test
router.post('/', testController.createTest);
router.post('/questions',testController.addQuestions);
router.get('/:testId/questions', testController.getTestQuestions);
router.get('/:testId/answers', testController.getTestAnsweers);


module.exports = router;