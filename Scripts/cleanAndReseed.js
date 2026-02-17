require('dotenv').config();
const pool = require('../config/db');
const DroneTrainingModel = require('../Model/droneTrainingModel');

async function cleanAndReseed(classId) {
    try {
        console.log(`🧹 Cleaning and Re-seeding Drone Training for Class ID: ${classId}`);

        // Check if class exists
        const [classes] = await pool.query('SELECT id FROM classes WHERE id = ?', [classId]);
        if (classes.length === 0) {
            throw new Error(`Class with ID ${classId} not found`);
        }

        // 1. Delete existing structure (Cascading deletes should handle sub-modules and sub-sub-modules if foreign keys are set correctly)
        // If not, we or manually delete in order
        console.log('🗑️ Removing old training modules...');

        // Get all module IDs for this class
        const [modules] = await pool.query('SELECT id FROM training_modules WHERE class_id = ?', [classId]);
        const moduleIds = modules.map(m => m.id);

        if (moduleIds.length > 0) {
            // Get submodule IDs
            const [submodules] = await pool.query('SELECT id FROM training_submodules WHERE module_id IN (?)', [moduleIds]);
            const submoduleIds = submodules.map(s => s.id);

            if (submoduleIds.length > 0) {
                console.log(`   - Deleting ${submoduleIds.length} sub-sub-modules...`);
                await pool.query('DELETE FROM training_subsubmodules WHERE submodule_id IN (?)', [submoduleIds]);

                console.log(`   - Deleting ${submoduleIds.length} sub-modules...`);
                await pool.query('DELETE FROM training_submodules WHERE module_id IN (?)', [moduleIds]);
            }

            console.log(`   - Deleting ${moduleIds.length} modules...`);
            await pool.query('DELETE FROM training_modules WHERE class_id = ?', [classId]);
        }

        console.log('✅ Previous structure cleared.');

        // 2. Re-seed structure
        console.log('🌱 Generating new clean structure...');
        await DroneTrainingModel.initializeDefaultStructure(classId);

        console.log('✅ Done! Duplicates have been removed and structure is fresh.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning and re-seeding:', error.message);
        process.exit(1);
    }
}

const classId = process.argv[2];
if (!classId) {
    console.error('❌ Usage: node Scripts/cleanAndReseed.js <classId>');
    process.exit(1);
}

cleanAndReseed(parseInt(classId));
