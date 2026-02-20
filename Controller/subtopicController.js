
const Subtopic = require('../Model/subtopicrModels');
const pool = require('../config/db');

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

// ============================================================
// Sync subtopics from drone training hierarchy
// Reads training_modules → training_submodules → training_subsubmodules
// and inserts them into the subtopics table for the given classId
// ============================================================
exports.syncFromTraining = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class ID is required' });
    }

    // 1. Get Class Name to determine which category to sync
    const [classRows] = await pool.query('SELECT class_name FROM classes WHERE id = ?', [classId]);
    if (classRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    const className = classRows[0].class_name;

    // 2. Fetch all categories to find a match
    const [categories] = await pool.query('SELECT id, category_name FROM drone_categories');

    // Find matching category (e.g. if class is "Surveillance Drone", match "Surveillance Drone" category)
    const matchingCategory = categories.find(cat =>
      className.toLowerCase().includes(cat.category_name.toLowerCase()) ||
      cat.category_name.toLowerCase().includes(className.toLowerCase())
    );

    if (!matchingCategory) {
      return res.status(400).json({
        success: false,
        message: `Could not determine drone category for class "${className}". Please ensures class name matches a drone category (FPV, Surveillance, or Payload).`
      });
    }

    console.log(`🎯 Syncing category "${matchingCategory.category_name}" for class "${className}" (ID: ${classId})`);

    // 3. Clean up: Remove subtopics from OTHER categories for this class
    // We identify them by checking if the name starts with other category names followed by " — "
    for (const cat of categories) {
      if (cat.id !== matchingCategory.id) {
        const prefix = `${cat.category_name} — %`;
        await pool.query(
          'DELETE FROM subtopics WHERE class_id = ? AND subtopic_name LIKE ?',
          [classId, prefix]
        );
      }
    }

    // 4. Fetch training modules only for the MATCHING category
    const [modules] = await pool.query(
      `SELECT tm.id, tm.module_name, tm.display_order, tm.drone_category_id,
              dc.category_name
       FROM training_modules tm
       JOIN drone_categories dc ON tm.drone_category_id = dc.id
       WHERE tm.class_id = ? AND tm.drone_category_id = ?
       ORDER BY tm.display_order, tm.id`,
      [classId, matchingCategory.id]
    );

    if (modules.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${matchingCategory.category_name} modules found for this class. Please initialize the training structure for this class first.`
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const module of modules) {
      // Top-level name: "Category Name — Module Name"
      const rootName = `${module.category_name} — ${module.module_name}`;

      // Check if this root node already exists
      let existing = await Subtopic.findByClassAndName(classId, rootName, null);
      let moduleSubtopicId;

      if (!existing) {
        const created = await Subtopic.create(classId, rootName, null);
        moduleSubtopicId = created.id;
        insertedCount++;
      } else {
        moduleSubtopicId = existing.id;
        skippedCount++;
      }

      // Fetch submodules for this module
      const [submodules] = await pool.query(
        `SELECT id, submodule_name, display_order
         FROM training_submodules
         WHERE module_id = ?
         ORDER BY display_order, id`,
        [module.id]
      );

      for (const submodule of submodules) {
        let existingSub = await Subtopic.findByClassAndName(classId, submodule.submodule_name, moduleSubtopicId);
        let submoduleSubtopicId;

        if (!existingSub) {
          const created = await Subtopic.create(classId, submodule.submodule_name, moduleSubtopicId);
          submoduleSubtopicId = created.id;
          insertedCount++;
        } else {
          submoduleSubtopicId = existingSub.id;
          skippedCount++;
        }

        // Fetch sub-submodules for this submodule
        const [subsubmodules] = await pool.query(
          `SELECT id, subsubmodule_name, display_order
           FROM training_subsubmodules
           WHERE submodule_id = ?
           ORDER BY display_order, id`,
          [submodule.id]
        );

        for (const subsub of subsubmodules) {
          let existingSubSub = await Subtopic.findByClassAndName(classId, subsub.subsubmodule_name, submoduleSubtopicId);

          if (!existingSubSub) {
            await Subtopic.create(classId, subsub.subsubmodule_name, submoduleSubtopicId);
            insertedCount++;
          } else {
            skippedCount++;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Sync complete for ${matchingCategory.category_name}. ${insertedCount} nodes inserted, ${skippedCount} already existed. Non-matching categories removed.`,
      insertedCount,
      skippedCount
    });

  } catch (error) {
    console.error('Error syncing from training hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync from training hierarchy',
      error: error.message
    });
  }
};
