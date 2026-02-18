
const express = require('express');
const router = express.Router();
const DroneTrainingController = require('../Controller/droneTrainingController');
const { authenticateToken } = require('../Middleware/authMiddleware');
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

// Record progress (no authentication required - Unity/VR apps will call this endpoint)
router.post(
    '/progress',
    uploadScreenshot.single('screenshot'),   // 👈 THIS IS THE KEY UNITY MUST USE
    DroneTrainingController.recordProgress
);

// ============================================
// INITIALIZATION
// ============================================
// Initialize default module structure for a class
router.post('/initialize/:classId', authenticateToken, DroneTrainingController.initializeStructure);

module.exports = router;

