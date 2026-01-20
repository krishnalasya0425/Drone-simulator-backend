
// const express = require('express');
// const router = express.Router();
// const testSubController = require('../Controller/testSetController');

// router.post('/:testId', testSubController.createSubTest);
// router.get('/download/:id', testSubController.downloadPdf);
// router.get('/download-results/:id', testSubController.downloadSetResults);
// router.get('/:testId', testSubController.getSubTest);
// router.delete('/:id', testSubController.deleteSubTest);
// // router.get('/downloadscore/:id', testSubController.downloadScorePdf);


// module.exports = router;



const express = require('express');
const router = express.Router();
const testSubController = require('../Controller/testSetController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for PDF uploads
const uploadDir = 'uploads/temp-questions/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Keep original name but add timestamp to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

router.post('/:testId', testSubController.createSubTest);
// New route for PDF-based set generation
// Expects form-data with 'pdfs' field containing multiple files
router.post('/generate-from-pdf/:testId', upload.array('pdfs'), testSubController.createSetsFromPdf);

router.get('/download/:id', testSubController.downloadPdf);
router.get('/download-results/:id', testSubController.downloadSetResults);
router.get('/:testId', testSubController.getSubTest);
router.delete('/:id', testSubController.deleteSubTest);
// router.get('/downloadscore/:id', testSubController.downloadScorePdf);


module.exports = router;