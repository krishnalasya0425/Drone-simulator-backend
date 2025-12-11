const express = require('express');
const router = express.Router();
const multer = require("multer");
const {classController,docsController} = require('../Controller/classController');

const storage = multer.memoryStorage();
const upload = multer({ storage });



// Class Routes
router.get('/', classController.getClassesByInstructorId);
router.get('/assigned', classController.getByStudentId);
router.get('/:id', classController.getClassInfo);
router.post('/', classController.addClass);
router.put('/:classId', classController.updateClass);
router.delete('/:classId', classController.delelteClass);


// Syllabus Routes
// router.get('/syllabus', syllabusController.getAllSyllabus);
// router.post('/syllabus', syllabusController.addSyllabus);
// router.delete('/syllabus/:id', syllabusController.deleteSyllabus);
// router.put('/syllabus/:id', syllabusController.updateSyllabus);

// //sub Syllabus Routes

// router.post('/subsyllabus', subSyllabusController.addSubSyllabus);
// router.delete('/subsyllabus/:id', subSyllabusController.deleteSubSyllabus);
// router.put('/subsyllabus/:id', subSyllabusController.updateSubSyllabus);

// Docs Routes

// Upload file
router.post("/docs", upload.single("file"), docsController.uploadDocs);

// List docs for a class (no file_data)
router.get("/docs/:class_id", docsController.getDocsByClass);

// Stream file
router.get("/docs/file/:id", docsController.streamDoc);

// Delete doc
router.delete("/docs/:id", docsController.deleteDoc);

router.put('/docs/:id', docsController.updateDocs);


module.exports = router;