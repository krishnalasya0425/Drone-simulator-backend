
const Subtopic = require('../Model/subtopicrModels');

// Create a new subtopic
exports.createSubtopic = async (req, res) => {
  try {
    const { class_id, subtopic_name, parent_id } = req.body;

    if (!class_id || !subtopic_name) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and subtopic name are required'
      });
    }

    const subtopic = await Subtopic.create(class_id, subtopic_name, parent_id || null);


    res.status(201).json({
      success: true,
      message: 'Subtopic created successfully',
      data: subtopic
    });
  } catch (error) {
    console.error('Error creating subtopic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subtopic',
      error: error.message
    });
  }
};

// Get all subtopics by class ID
exports.getSubtopicsByClassId = async (req, res) => {
  try {
    const { classId } = req.params;

    const subtopics = await Subtopic.findByClassId(classId);


    res.status(200).json({
      success: true,
      count: subtopics.length,
      data: subtopics
    });
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subtopics',
      error: error.message
    });
  }
};

// Get a single subtopic by ID
exports.getSubtopicById = async (req, res) => {
  try {
    const { id } = req.params;

    const subtopic = await Subtopic.findById(id);


    if (!subtopic) {
      return res.status(404).json({
        success: false,
        message: 'Subtopic not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subtopic
    });
  } catch (error) {
    console.error('Error fetching subtopic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subtopic',
      error: error.message
    });
  }
};

// Update a subtopic by ID
exports.updateSubtopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { subtopic_name } = req.body;

    if (!subtopic_name) {
      return res.status(400).json({
        success: false,
        message: 'Subtopic name is required'
      });
    }

    const updated = await Subtopic.update(id, subtopic_name);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Subtopic not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subtopic updated successfully',
      data: {
        id: Number(id),
        subtopic_name
      }
    });
  } catch (error) {
    console.error('Error updating subtopic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subtopic',
      error: error.message
    });
  }
};

// Delete a subtopic by ID
exports.deleteSubtopic = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Subtopic.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Subtopic not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subtopic deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subtopic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subtopic',
      error: error.message
    });
  }
};


// Delete multiple subtopics by IDs
exports.deleteSubtopicsByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    const deletedCount = await Subtopic.deleteByIds(ids);

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subtopics found to delete'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subtopics deleted successfully',
      deletedCount
    });
  } catch (error) {
    console.error('Error deleting subtopics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subtopics',
      error: error.message
    });
  }
};
