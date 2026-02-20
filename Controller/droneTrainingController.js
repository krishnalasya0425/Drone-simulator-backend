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
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                error: error.message
            });
        }
    },

    // ============================================
    // HIERARCHY
    // ============================================
    async getHierarchy(req, res) {
        try {
            const { classId, categoryId } = req.params;

            const hierarchy = await DroneTrainingModel.getCompleteHierarchy(
                classId,
                categoryId
            );

            res.json({ success: true, hierarchy });
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch hierarchy',
                error: error.message
            });
        }
    },

    // ============================================
    // STUDENT PROGRESS
    // ============================================
    async getStudentProgress(req, res) {
        try {
            const { studentId, classId } = req.params;
            const { categoryId } = req.query;

            const progressWithHierarchy =
                await DroneTrainingModel.getStudentProgressWithHierarchy(
                    studentId,
                    classId,
                    categoryId
                );

            res.json({ success: true, data: progressWithHierarchy });

        } catch (error) {
            console.error('Error fetching student progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch progress',
                error: error.message
            });
        }
    },

    // ============================================
    // RECORD PROGRESS (from Unity/VR)
    // ============================================
    async recordProgress(req, res) {
        try {
            // 🔍 DEBUG LOGS (From Code-1)
            console.log("📦 Body:", req.body);
            console.log("📸 File Object:", req.file);

            if (req.file) {
                console.log("📂 Screenshot Path:", req.file.path);
                console.log("📛 Filename:", req.file.filename);
                console.log("📏 Size:", req.file.size);
            } else {
                console.log("❌ No screenshot received");
            }

            // Support both Unity camelCase (subModuleId, subSubModuleId, isCompleted)
            // and standard lowercase (submoduleId, subsubmoduleId, completed)
            const studentId = req.body.studentId;
            const classId = req.body.classId;
            const moduleId = req.body.moduleId;

            // Unity sends "subModuleId" (capital M), fallback to "submoduleId"
            const submoduleId = req.body.subModuleId !== undefined
                ? req.body.subModuleId
                : req.body.submoduleId;

            // Unity sends "subSubModuleId" (capital S), fallback to "subsubmoduleId"
            // Also treat 0 as null (Unity sends 0 when there is no sub-submodule)
            const rawSubSubModuleId = req.body.subSubModuleId !== undefined
                ? req.body.subSubModuleId
                : req.body.subsubmoduleId;
            const subsubmoduleId = (rawSubSubModuleId === 0 || rawSubSubModuleId === '0' || rawSubSubModuleId === null || rawSubSubModuleId === undefined)
                ? null
                : rawSubSubModuleId;

            // Unity sends "isCompleted", fallback to "completed"
            const completedRaw = req.body.isCompleted !== undefined
                ? req.body.isCompleted
                : req.body.completed;

            const score = req.body.score;

            console.log("SubModuleId (resolved):", submoduleId);
            console.log("SubSubModuleId (resolved):", subsubmoduleId);
            console.log("Completed (resolved):", completedRaw);

            // Required field validation
            if (!studentId || !classId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: studentId, classId'
                });
            }

            // Category resolution — do NOT fall back to classId.
            // The model will resolve drone_category_id from the submodule/module chain in the DB.
            const finalCategoryId = req.body.categoryId || null;

            // Boolean conversion — handle true/false/"true"/"false"/1/0
            let finalCompleted;
            if (completedRaw === true || completedRaw === 'true' || completedRaw === 1 || completedRaw === '1') {
                finalCompleted = 1;
            } else if (completedRaw === false || completedRaw === 'false' || completedRaw === 0 || completedRaw === '0') {
                finalCompleted = 0;
            } else {
                finalCompleted = 1; // default: treat as completed if field is missing
            }

            console.log("✅ Processing: Student", studentId, ", Class", classId, ", Module", moduleId, ", Submodule", submoduleId, ", SubSubmodule", subsubmoduleId, ", Completed", finalCompleted);

            const progressId = await DroneTrainingModel.recordProgress({
                studentId,
                classId,
                categoryId: finalCategoryId,
                moduleId: moduleId || null,
                submoduleId: submoduleId || null,
                subsubmoduleId: subsubmoduleId || null,
                completed: finalCompleted,
                score: score || null,
                completionData: {}
            });

            // Save screenshot to database if provided
            let screenshotId = null;
            if (req.file && req.file.buffer) {
                try {
                    screenshotId = await DroneTrainingModel.saveScreenshot({
                        studentId,
                        classId,
                        categoryId: finalCategoryId,
                        moduleId: moduleId || null,
                        submoduleId: submoduleId || null,
                        subsubmoduleId: subsubmoduleId || null,
                        progressId,
                        imageBuffer: req.file.buffer,
                        mimeType: req.file.mimetype,
                        originalFilename: req.file.originalname
                    });
                    console.log(`📸 Screenshot saved to DB with ID: ${screenshotId}`);
                } catch (screenshotErr) {
                    console.error('⚠️  Failed to save screenshot:', screenshotErr.message);
                    // Don't fail the whole request if screenshot save fails
                }
            }

            res.json({
                success: true,
                message: 'Progress recorded successfully',
                progressId,
                screenshotId
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
                return res.status(400).json({
                    success: false,
                    message: 'Class ID is required'
                });
            }

            const result =
                await DroneTrainingModel.initializeDefaultStructure(classId);

            res.json(result);

        } catch (error) {
            console.error('Error initializing structure:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to initialize structure',
                error: error.message
            });
        }
    },

    // ============================================
    // GET PROGRESS SUMMARY
    // ============================================
    async getProgressSummary(req, res) {
        try {
            const { studentId, classId } = req.params;

            const categories =
                await DroneTrainingModel.getAllCategories();

            const summary = [];

            for (const category of categories) {

                const progress =
                    await DroneTrainingModel.getStudentProgress(
                        studentId,
                        classId,
                        category.id
                    );

                const totalItems = progress.length;
                const completedItems =
                    progress.filter(p => p.completed).length;

                const completionPercentage =
                    totalItems > 0
                        ? (completedItems / totalItems) * 100
                        : 0;

                summary.push({
                    category: category.category_name,
                    categoryId: category.id,
                    totalItems,
                    completedItems,
                    completionPercentage:
                        Math.round(completionPercentage * 100) / 100,
                    recentProgress: progress.slice(0, 5)
                });
            }

            res.json({ success: true, summary });

        } catch (error) {
            console.error('Error fetching progress summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch summary',
                error: error.message
            });
        }
    },
    // ============================================
    // GET SCREENSHOTS (metadata list)
    // ============================================
    async getScreenshots(req, res) {
        try {
            const { studentId, classId } = req.params;

            if (!studentId || !classId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required params: studentId, classId'
                });
            }

            const screenshots = await DroneTrainingModel.getScreenshotsByStudentAndClass(studentId, classId);

            res.json({
                success: true,
                data: screenshots
            });

        } catch (error) {
            console.error('Error fetching screenshots:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch screenshots',
                error: error.message
            });
        }
    },

    // ============================================
    // SERVE SCREENSHOT IMAGE (binary stream)
    // ============================================
    async serveScreenshot(req, res) {
        try {
            const { id } = req.params;
            const screenshot = await DroneTrainingModel.getScreenshotById(id);

            if (!screenshot) {
                return res.status(404).json({ success: false, message: 'Screenshot not found' });
            }

            res.set('Content-Type', screenshot.mime_type || 'image/png');
            res.set('Cache-Control', 'public, max-age=86400'); // cache 1 day
            res.send(screenshot.image_data);

        } catch (error) {
            console.error('Error serving screenshot:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to serve screenshot',
                error: error.message
            });
        }
    }
};

module.exports = DroneTrainingController;