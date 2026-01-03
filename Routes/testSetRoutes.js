
const express = require('express');
const router = express.Router();
const testSubController = require('../Controller/testSetController');

router.post('/:testId', testSubController.createSubTest);
router.get('/download/:id', testSubController.downloadPdf);
router.get('/download-results/:id', testSubController.downloadSetResults);
router.get('/:testId', testSubController.getSubTest);
router.delete('/:id', testSubController.deleteSubTest);
// router.get('/downloadscore/:id', testSubController.downloadScorePdf);


module.exports = router;