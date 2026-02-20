const express = require('express');
const router = express.Router();
const DroneTrainingController = require('../Controller/droneTrainingController');
const { authenticateToken } = require('../Middleware/authMiddleware');

// ✅ ADDED from Code–1 (nothing removed from Code–2)
const uploadScreenshot = require('../Middleware/uploadScreenshot');


// ============================================
// CATEGORIES
// ============================================
// Public access - Unity/VR apps need this
router.get('/categories', DroneTrainingController.getAllCategories);


// ============================================
// HIERARCHY
// ============================================
// Public access - Unity/VR apps need this
router.get('/hierarchy/:classId/:categoryId', DroneTrainingController.getHierarchy);


// ============================================
// STUDENT PROGRESS
// ============================================
// Get student progress with hierarchy for all categories (Public access for Unity/VR)
router.get('/progress/:studentId/:classId', DroneTrainingController.getStudentProgress);

// Get progress summary for all categories (Public access for Unity/VR)
router.get('/progress-summary/:studentId/:classId', DroneTrainingController.getProgressSummary);


// ============================================
// RECORD PROGRESS
// ============================================
// ✅ Updated to support screenshot upload (from Code–1)
// (No authentication required - Unity/VR apps will call this endpoint)
router.post(
    '/progress',
    uploadScreenshot.single('screenshot'),   // 👈 Unity must use field name: screenshot
    DroneTrainingController.recordProgress
);


// ============================================
// INITIALIZATION
// ============================================
// Initialize default module structure for a class
router.post('/initialize/:classId', authenticateToken, DroneTrainingController.initializeStructure);


// ============================================
// SCREENSHOTS
// ============================================
// ⚠️ IMPORTANT: Specific route MUST come before the wildcard route
// Serve a screenshot image by ID (binary stream)
router.get('/screenshots/image/:id', DroneTrainingController.serveScreenshot);

// Get screenshot metadata list for a student in a class (Public - Unity/VR/Frontend)
router.get('/screenshots/:studentId/:classId', DroneTrainingController.getScreenshots);


module.exports = router;