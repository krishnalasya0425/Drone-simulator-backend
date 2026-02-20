const express = require('express');
const router = express.Router();
const subtopicController = require('../Controller/subtopicController');

// Create a new subtopic
router.post('/', subtopicController.createSubtopic);

// Get all subtopics by class ID
router.get('/class/:classId', subtopicController.getSubtopicsByClassId);

// Sync subtopics from drone training modules/submodules hierarchy
router.post('/sync-from-training/:classId', subtopicController.syncFromTraining);

// Get a single subtopic by ID
router.get('/:id', subtopicController.getSubtopicById);

// Update a subtopic by ID
router.put('/:id', subtopicController.updateSubtopic);

// Bulk delete must come BEFORE /:id to avoid "bulk-delete" being treated as an ID param
router.delete('/bulk-delete', subtopicController.deleteSubtopicsByIds);

// Delete a subtopic by ID
router.delete('/:id', subtopicController.deleteSubtopic);



module.exports = router;
