const express = require('express');
const router = express.Router();
const studentProgressController = require('../Controller/studentProgressController');

// Update document progress
router.post('/document', studentProgressController.updateDocumentProgress);

// Get document progress
router.get('/document/:studentId/:docId', studentProgressController.getDocumentProgress);

// Get class progress for a student
router.get('/class/:studentId/:classId', studentProgressController.getClassProgress);

// Get all students' progress in a class (for instructor/admin)
router.get('/class/:classId/students', studentProgressController.getAllStudentsProgress);

// Get student's progress across all classes
router.get('/student/:studentId', studentProgressController.getStudentAllClassesProgress);

// Get detailed document-level progress for a student in a class
router.get('/class/:studentId/:classId/documents', studentProgressController.getStudentClassDocuments);

module.exports = router;
