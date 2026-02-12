const express = require('express');
const router = express.Router();
const subtopicController = require('../Controller/subtopicController');

// Create a new subtopic
router.post('/', subtopicController.createSubtopic);

// Get all subtopics by class ID
router.get('/class/:classId', subtopicController.getSubtopicsByClassId);

// Get a single subtopic by ID
router.get('/:id', subtopicController.getSubtopicById);

// Update a subtopic by ID
router.put('/:id', subtopicController.updateSubtopic);

// Delete a subtopic by ID
router.delete('/bulk-delete', subtopicController.deleteSubtopicsByIds);
router.delete('/:id', subtopicController.deleteSubtopic);



module.exports = router;
