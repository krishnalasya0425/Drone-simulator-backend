
const express = require('express');
const router = express.Router();
const retestController = require('../Controller/retestController');

router.post('/request', retestController.createRequest);
router.get('/instructor/:instructorId', retestController.getInstructorRequests);
router.get('/student/:studentId', retestController.getStudentRequests);
router.get('/history', retestController.getRetestHistory);
router.put('/:requestId/status', retestController.updateStatus);

module.exports = router;
