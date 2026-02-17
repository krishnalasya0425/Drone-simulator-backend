const CompletionProgress = require('../Model/completionprogressModel');
const Subtopic = require('../Model/subtopicrModels');

/**
 * Create or update progress
 */
exports.createOrUpdateProgress = async (req, res) => {

  try {
    const { user_id, class_id, subtopic_name } = req.body;
    if (!user_id || !class_id || !subtopic_name) {
      return res.status(400).json({ success: false, message: 'user_id, class_id, subtopic_name required' });
    }


    // Find subtopic ID
    let subtopic = await Subtopic.findByClassAndName(class_id, subtopic_name);
    if (!subtopic) {
      // If not exists, create subtopic
      subtopic = await Subtopic.create(class_id, subtopic_name);
    }


    const subtopic_id = subtopic.id;

    // Find existing progress
    let progress = await CompletionProgress.findByUserAndClass(user_id, class_id);

    if (!progress) {
      // Create new
      progress = await CompletionProgress.create(user_id, class_id, [subtopic_id]);
    } else {
      // Update completed_subtopics if not already present
      let completed = progress.completed_subtopics || [];
      if (!completed.includes(subtopic_id)) completed.push(subtopic_id);

      progress = await CompletionProgress.updateCompletedSubtopics(user_id, class_id, completed);
    }

    res.status(200).json({ success: true, message: 'Progress updated', data: progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create/update progress', error: err.message });
  }
};

/**
 * Get progress + percentage completion
 */
exports.getProgressWithPercentage = async (req, res) => {
  try {
    const { studentId, classId } = req.params;



    // Fetch progress
    const progress = await CompletionProgress.findByUserAndClass(studentId, classId);
    const completedSubtopics = progress ? progress.completed_subtopics || [] : [];


    // Fetch total subtopics in class
    const totalSubtopics = await Subtopic.countByClass(classId);

    const percentage = totalSubtopics > 0 ? (completedSubtopics.length / totalSubtopics) * 100 : 0;


    res.status(200).json({
      success: true,
      data: {
        user_id: parseInt(studentId),
        class_id: parseInt(classId),
        completed_subtopics: completedSubtopics,
        total_subtopics: totalSubtopics,
        completion_percentage: parseFloat(percentage.toFixed(2))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch progress', error: err.message });
  }
};
