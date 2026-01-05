


const express = require('express');
const router = express.Router();
const multer = require("multer");
const { classController, docsController } = require('../Controller/classController');

const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });



// Class Routes
router.get('/', classController.getClassesByInstructorId);
router.get('/assigned', classController.getByStudentId);
router.get('/:id', classController.getClassInfo);
router.post('/', upload.none(), classController.adminAddClass);  // Only admin can create classes
router.put('/:classId', classController.updateClass);
router.delete('/:classId', classController.delelteClass);

// Student Management in Class
router.get('/:classId/students', classController.getStudents);
router.post('/:classId/students', classController.addStudents);
router.delete('/:classId/students', classController.removeStudents);


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
router.delete("/:classId/docs/:id", docsController.deleteDoc);  // Alternative path for frontend compatibility

router.put('/docs/:id', docsController.updateDocs);


module.exports = router;