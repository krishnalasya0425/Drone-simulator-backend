
const pool = require('../config/db');

const DroneTrainingModel = {
    // ============================================
    // DRONE CATEGORIES
    // ============================================
    async getAllCategories() {
        const [rows] = await pool.query(
            'SELECT * FROM drone_categories ORDER BY display_order, id'
        );
        return rows;
    },

    async getCategoryById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM drone_categories WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // ============================================
    // TRAINING MODULES
    // ============================================
    async getModulesByClassAndCategory(classId, categoryId) {
        const [rows] = await pool.query(
            'SELECT * FROM training_modules WHERE class_id = ? AND drone_category_id = ? ORDER BY display_order, id',
            [classId, categoryId]
        );
        return rows;
    },

    async getModuleById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM training_modules WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    async createModule(classId, categoryId, moduleName, description, displayOrder) {
        const [result] = await pool.query(
            'INSERT INTO training_modules (class_id, drone_category_id, module_name, description, display_order) VALUES (?, ?, ?, ?, ?)',
            [classId, categoryId, moduleName, description, displayOrder]
        );
        return result.insertId;
    },

    // ============================================
    // SUB-MODULES
    // ============================================
    async getSubmodulesByModule(moduleId) {
        const [rows] = await pool.query(
            'SELECT * FROM training_submodules WHERE module_id = ? ORDER BY display_order, id',
            [moduleId]
        );
        return rows;
    },

    async getSubmoduleById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM training_submodules WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    async createSubmodule(moduleId, submoduleName, description, displayOrder) {
        const [result] = await pool.query(
            'INSERT INTO training_submodules (module_id, submodule_name, description, display_order) VALUES (?, ?, ?, ?)',
            [moduleId, submoduleName, description, displayOrder]
        );
        return result.insertId;
    },

    // ============================================
    // SUB-SUB-MODULES
    // ============================================
    async getSubsubmodulesBySubmodule(submoduleId) {
        const [rows] = await pool.query(
            'SELECT * FROM training_subsubmodules WHERE submodule_id = ? ORDER BY display_order, id',
            [submoduleId]
        );
        return rows;
    },

    async getSubsubmoduleById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM training_subsubmodules WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    async createSubsubmodule(submoduleId, subsubmoduleName, description, displayOrder) {
        const [result] = await pool.query(
            'INSERT INTO training_subsubmodules (submodule_id, subsubmodule_name, description, display_order) VALUES (?, ?, ?, ?)',
            [submoduleId, subsubmoduleName, description, displayOrder]
        );
        return result.insertId;
    },

    // ============================================
    // COMPLETE HIERARCHY
    // ============================================
    async getCompleteHierarchy(classId, categoryId) {
        // Get all modules for this class and category
        const modules = await this.getModulesByClassAndCategory(classId, categoryId);

        // For each module, get submodules
        for (let module of modules) {
            module.submodules = await this.getSubmodulesByModule(module.id);

            // For each submodule, get sub-submodules
            for (let submodule of module.submodules) {
                submodule.subsubmodules = await this.getSubsubmodulesBySubmodule(submodule.id);
            }
        }

        return modules;
    },

    // ============================================
    // STUDENT PROGRESS
    // ============================================
    async getStudentProgress(studentId, classId, categoryId) {
        const [rows] = await pool.query(
            `SELECT * FROM student_training_progress 
       WHERE student_id = ? AND class_id = ? AND drone_category_id = ?`,
            [studentId, classId, categoryId]
        );
        return rows;
    },

    async getStudentProgressByIds(studentId, classId, categoryId, moduleId, submoduleId, subsubmoduleId) {
        let query = `SELECT * FROM student_training_progress 
                 WHERE student_id = ? AND class_id = ? AND drone_category_id = ?`;
        const params = [studentId, classId, categoryId];

        if (moduleId) {
            query += ' AND module_id = ?';
            params.push(moduleId);
        }
        if (submoduleId) {
            query += ' AND submodule_id = ?';
            params.push(submoduleId);
        }
        if (subsubmoduleId) {
            query += ' AND subsubmodule_id = ?';
            params.push(subsubmoduleId);
        }

        const [rows] = await pool.query(query, params);
        return rows[0];
    },

    async recordProgress(progressData) {
        let {
            studentId,
            classId,
            categoryId,
            moduleId,
            submoduleId,
            subsubmoduleId,
            completed,
            score
        } = progressData;

        // Automatically resolve categoryId if missing but other identifiers are present
        if (!categoryId) {
            if (subsubmoduleId) {
                const [rows] = await pool.query(
                    `SELECT m.drone_category_id FROM training_modules m
                     JOIN training_submodules s ON s.module_id = m.id
                     JOIN training_subsubmodules ss ON ss.submodule_id = s.id
                     WHERE ss.id = ?`,
                    [subsubmoduleId]
                );
                if (rows.length > 0) categoryId = rows[0].drone_category_id;
            } else if (submoduleId) {

                // 1. Get module_id first
                const [subs] = await pool.query('SELECT module_id FROM training_submodules WHERE id = ?', [submoduleId]);

                if (subs.length > 0) {
                    const parentModuleId = subs[0].module_id;
                    // 2. Get category_id
                    const [mods] = await pool.query('SELECT drone_category_id FROM training_modules WHERE id = ?', [parentModuleId]);

                    if (mods.length > 0) {
                        categoryId = mods[0].drone_category_id;
                    }
                }
            }

            if (!categoryId && moduleId) {
                const [rows] = await pool.query(
                    'SELECT drone_category_id FROM training_modules WHERE id = ?',
                    [moduleId]
                );
                if (rows.length > 0) categoryId = rows[0].drone_category_id;
            }

            if (!categoryId) {
                // If still not resolved, throw so the issue is visible rather than silently saving wrong data
                throw new Error(`Could not resolve drone_category_id for moduleId=${moduleId}, submoduleId=${submoduleId}`);
            }
        } // end of: if (!categoryId) resolution block

        // Check if record exists
        const existing = await this.getStudentProgressByIds(
            studentId, classId, categoryId, moduleId, submoduleId, subsubmoduleId
        );

        if (existing) {
            // Update existing record
            const [result] = await pool.query(
                `UPDATE student_training_progress 
         SET completed = ?, score = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
                [
                    completed,
                    score,
                    completed ? new Date() : null,
                    existing.id
                ]
            );
            return existing.id;
        } else {
            // Insert new record
            const [result] = await pool.query(
                `INSERT INTO student_training_progress 
         (student_id, class_id, drone_category_id, module_id, submodule_id, subsubmodule_id, 
          completed, score, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
                [
                    studentId,
                    classId,
                    categoryId,
                    moduleId || null,
                    submoduleId || null,
                    subsubmoduleId || null,
                    completed,
                    score,
                    completed ? new Date() : null
                ]
            );
            return result.insertId;
        }
    },

    async getStudentProgressWithHierarchy(studentId, classId, categoryId) {
        let categoriesToFetch = [];
        if (categoryId) {
            const cat = await this.getCategoryById(categoryId);
            if (cat) categoriesToFetch.push(cat);
        } else {
            categoriesToFetch = await this.getAllCategories();
        }

        const results = [];

        for (const category of categoriesToFetch) {
            // Get complete hierarchy for this category
            const hierarchy = await this.getCompleteHierarchy(classId, category.id);

            // Get all progress records for this student and category
            const [progressRecords] = await pool.query(
                `SELECT * FROM student_training_progress 
                 WHERE student_id = ? AND class_id = ? AND drone_category_id = ?`,
                [studentId, classId, category.id]
            );

            // Create a map for quick lookup
            const progressMap = new Map();
            progressRecords.forEach(record => {
                const key = `${record.module_id || ''}_${record.submodule_id || ''}_${record.subsubmodule_id || ''}`;
                progressMap.set(key, record);
            });

            // Attach progress to hierarchy
            hierarchy.forEach(module => {
                // Key for module-level progress
                const moduleKey = `${module.id}__`;
                module.progress = progressMap.get(moduleKey) || null;

                module.submodules.forEach(submodule => {
                    // Key for submodule-level progress
                    const submoduleKey = `${module.id}_${submodule.id}_`;
                    submodule.progress = progressMap.get(submoduleKey) || null;

                    submodule.subsubmodules.forEach(subsubmodule => {
                        // Key for sub-submodule-level progress
                        const subsubKey = `${module.id}_${submodule.id}_${subsubmodule.id}`;
                        subsubmodule.progress = progressMap.get(subsubKey) || null;

                        // Fallback: If no specific sub-sub-module record, check if parent submodule is complete
                        if (!subsubmodule.progress && submodule.progress?.completed) {
                            subsubmodule.progress = { ...submodule.progress, implicit: true };
                        }
                    });
                });
            });

            if (categoryId) {
                return hierarchy; // Return as array for single category (backward compatibility)
            }

            results.push({
                ...category,
                modules: hierarchy
            });
        }

        return results;
    },

    // ============================================
    // INITIALIZATION - Seed default structure
    // ============================================
    async initializeDefaultStructure(classId) {
        const categories = await this.getAllCategories();

        const moduleStructure = {
            'Introduction': { order: 1, subs: [] },
            'Tutorial': {
                order: 2,
                subs: [
                    { name: 'Start', order: 1, subsubs: [] },
                    { name: 'Liftoff', order: 2, subsubs: [] },
                    { name: 'Move', order: 3, subsubs: [] },
                    { name: 'Straight', order: 4, subsubs: [] },
                    { name: 'U Maneuver', order: 5, subsubs: [] }
                ]
            },
            'Intermediate': {
                order: 3,
                subs: [
                    { name: 'City', order: 1, subsubs: ['Rain', 'Fog', 'Wind'] },
                    { name: 'Forest', order: 2, subsubs: ['Rain', 'Fog', 'Wind'] },
                    { name: 'OpenFields', order: 3, subsubs: ['Rain', 'Fog', 'Wind'] },
                    { name: 'Desert', order: 4, subsubs: ['Rain', 'Fog', 'Wind'] }
                ]
            },
            'Obstacle Course': {
                order: 4,
                subs: [
                    { name: 'ObstacleCourse', order: 1, subsubs: [] }
                ]
            },
            'Advanced': {
                order: 5,
                subs: [
                    { name: 'Level1', order: 1, subsubs: [] },
                    { name: 'Level2', order: 2, subsubs: [] }
                ]
            },
            'Maintenance': {
                order: 6,
                subs: [
                    { name: 'Parts Identification', order: 1, subsubs: [] },
                    { name: 'Assembly', order: 2, subsubs: [] },
                    { name: 'Disassembly', order: 3, subsubs: [] }
                ]
            }
        };

        for (const category of categories) {
            for (const [moduleName, moduleData] of Object.entries(moduleStructure)) {
                // Check if module already exists for this class and category
                const [existingModules] = await pool.query(
                    'SELECT id FROM training_modules WHERE class_id = ? AND drone_category_id = ? AND module_name = ?',
                    [classId, category.id, moduleName]
                );

                let moduleId;
                if (existingModules.length > 0) {
                    moduleId = existingModules[0].id;
                } else {
                    moduleId = await this.createModule(
                        classId,
                        category.id,
                        moduleName,
                        `${moduleName} module for ${category.category_name}`,
                        moduleData.order
                    );
                }

                for (const sub of moduleData.subs) {
                    // Check if submodule exists
                    const [existingSubmodules] = await pool.query(
                        'SELECT id FROM training_submodules WHERE module_id = ? AND submodule_name = ?',
                        [moduleId, sub.name]
                    );

                    let submoduleId;
                    if (existingSubmodules.length > 0) {
                        submoduleId = existingSubmodules[0].id;
                    } else {
                        submoduleId = await this.createSubmodule(
                            moduleId,
                            sub.name,
                            `${sub.name} submodule`,
                            sub.order
                        );
                    }

                    for (let i = 0; i < sub.subsubs.length; i++) {
                        const conditionName = sub.subsubs[i];
                        // Check if sub-submodule exists
                        const [existingSubsubs] = await pool.query(
                            'SELECT id FROM training_subsubmodules WHERE submodule_id = ? AND subsubmodule_name = ?',
                            [submoduleId, conditionName]
                        );

                        if (existingSubsubs.length === 0) {
                            await this.createSubsubmodule(
                                submoduleId,
                                conditionName,
                                `${conditionName} condition`,
                                i + 1
                            );
                        }
                    }
                }
            }
        }

        return { success: true, message: 'Structure checked and initialized without duplicates' };
    },

    // ============================================
    // SCREENSHOTS
    // ============================================

    /**
     * Save a screenshot (binary buffer) into the training_screenshots table.
     */
    async saveScreenshot({ studentId, classId, categoryId, moduleId, submoduleId, subsubmoduleId, progressId, imageBuffer, mimeType, originalFilename }) {
        const [result] = await pool.query(
            `INSERT INTO training_screenshots
             (student_id, class_id, drone_category_id, module_id, submodule_id, subsubmodule_id, progress_id, image_data, mime_type, original_filename, file_size)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId,
                classId,
                categoryId || null,
                moduleId || null,
                submoduleId || null,
                subsubmoduleId || null,
                progressId || null,
                imageBuffer,
                mimeType || 'image/png',
                originalFilename || null,
                imageBuffer.length
            ]
        );
        return result.insertId;
    },

    /**
     * Get all screenshots for a student in a class (metadata only, no binary).
     */
    async getScreenshotsByStudentAndClass(studentId, classId) {
        const [rows] = await pool.query(
            `SELECT 
                s.id,
                s.student_id,
                s.class_id,
                s.drone_category_id,
                s.module_id,
                s.submodule_id,
                s.subsubmodule_id,
                s.progress_id,
                s.mime_type,
                s.original_filename,
                s.file_size,
                s.captured_at,
                m.module_name,
                sm.submodule_name,
                ssm.subsubmodule_name,
                dc.category_name
             FROM training_screenshots s
             LEFT JOIN training_modules m ON m.id = s.module_id
             LEFT JOIN training_submodules sm ON sm.id = s.submodule_id
             LEFT JOIN training_subsubmodules ssm ON ssm.id = s.subsubmodule_id
             LEFT JOIN drone_categories dc ON dc.id = s.drone_category_id
             WHERE s.student_id = ? AND s.class_id = ?
             ORDER BY s.captured_at DESC`,
            [studentId, classId]
        );
        return rows;
    },

    /**
     * Get a single screenshot's binary data by ID.
     */
    async getScreenshotById(id) {
        const [rows] = await pool.query(
            'SELECT id, image_data, mime_type, original_filename FROM training_screenshots WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }
};

module.exports = DroneTrainingModel;
