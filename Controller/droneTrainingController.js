

const DroneTrainingModel = require('../Model/droneTrainingModel');

const DroneTrainingController = {
    // ============================================
    // CATEGORIES
    // ============================================
    async getAllCategories(req, res) {
        try {
            const categories = await DroneTrainingModel.getAllCategories();
            res.json({ success: true, categories });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
        }
    },

    // ============================================
    // HIERARCHY
    // ============================================
    async getHierarchy(req, res) {
        try {
            const { classId, categoryId } = req.params;
            const hierarchy = await DroneTrainingModel.getCompleteHierarchy(classId, categoryId);
            res.json({ success: true, hierarchy });
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch hierarchy', error: error.message });
        }
    },

    // ============================================
    // STUDENT PROGRESS
    // ============================================
    async getStudentProgress(req, res) {
        try {
            const { studentId, classId } = req.params;
            const { categoryId } = req.query; // Still support optional query param if needed
            const progressWithHierarchy = await DroneTrainingModel.getStudentProgressWithHierarchy(
                studentId,
                classId,
                categoryId
            );
            res.json({ success: true, data: progressWithHierarchy });
        } catch (error) {
            console.error('Error fetching student progress:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch progress', error: error.message });
        }
    },

    // ============================================
    // RECORD PROGRESS (from Unity/VR)
    // ============================================
    async recordProgress(req, res) {
        try {
            console.log("📦 Body:", req.body);

        console.log("📸 File Object:", req.file);

        if (req.file) {
            console.log("📂 Screenshot Path:", req.file.path);
            console.log("📛 Filename:", req.file.filename);
            console.log("📏 Size:", req.file.size);
        } else {
            console.log("❌ No screenshot received");
        }


            const {
                studentId,
                classId,
                moduleId,
                submoduleId,
                subsubmoduleId,
                completed,
                score
            } = req.body;
            console.log(subsubmoduleId);


            if (!studentId || !classId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: studentId, classId'
                });
            }

            console.log(`✅ Processing: Student ${studentId}, Class ${classId}, Module ${moduleId}, Submodule ${submoduleId}`);

            // Resolve categoryId (default to classId if not provided, but prioritize categoryId if sent)
            const finalCategoryId = req.body.categoryId || classId;

            const progressId = await DroneTrainingModel.recordProgress({
                studentId,
                classId,
                categoryId: finalCategoryId,
                moduleId: moduleId || null,
                submoduleId: submoduleId || null,
                subsubmoduleId: subsubmoduleId || null,
               completed: completed === true || completed === 'true' ? 1 : 0,
                score: score || null,
                completionData: {}
            });

            res.json({
                success: true,
                message: 'Progress recorded successfully',
                progressId
            });

        } catch (error) {
            console.error('Error recording progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to record progress',
                error: error.message
            });
        }
    },

    // ============================================
    // INITIALIZE DEFAULT STRUCTURE
    // ============================================
    async initializeStructure(req, res) {
        try {
            const { classId } = req.params;

            if (!classId) {
                return res.status(400).json({ success: false, message: 'Class ID is required' });
            }

            const result = await DroneTrainingModel.initializeDefaultStructure(classId);
            res.json(result);
        } catch (error) {
            console.error('Error initializing structure:', error);
            res.status(500).json({ success: false, message: 'Failed to initialize structure', error: error.message });
        }
    },

    // ============================================
    // GET PROGRESS SUMMARY
    // ============================================
    async getProgressSummary(req, res) {
        try {
            const { studentId, classId } = req.params;

            const categories = await DroneTrainingModel.getAllCategories();
            const summary = [];

            for (const category of categories) {
                const progress = await DroneTrainingModel.getStudentProgress(studentId, classId, category.id);

                const totalItems = progress.length;
                const completedItems = progress.filter(p => p.completed).length;
                const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                summary.push({
                    category: category.category_name,
                    categoryId: category.id,
                    totalItems,
                    completedItems,
                    completionPercentage: Math.round(completionPercentage * 100) / 100,
                    recentProgress: progress.slice(0, 5) // Last 5 items
                });
            }

            res.json({ success: true, summary });
        } catch (error) {
            console.error('Error fetching progress summary:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch summary', error: error.message });
        }
    }
};

module.exports = DroneTrainingController;
