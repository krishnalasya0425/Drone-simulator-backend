require('dotenv').config();
const pool = require('../config/db');
const DroneTrainingModel = require('../Model/droneTrainingModel');

async function createProgressForStudent2() {
    try {
        console.log('📝 Creating test progress for Student 2, Class 1 (FPV Drone)...\n');

        // Get the Tutorial module for Class 1
        const [modules] = await pool.query(`
            SELECT id, module_name 
            FROM training_modules 
            WHERE class_id = 1 AND module_name = 'Tutorial'
        `);

        if (modules.length === 0) {
            console.log('❌ Tutorial module not found for Class 1');
            process.exit(1);
        }

        const tutorialModule = modules[0];
        console.log(`✓ Found Tutorial module: ID ${tutorialModule.id}`);

        // Get ALL submodules for Tutorial
        const [submodules] = await pool.query(`
            SELECT id, submodule_name 
            FROM training_submodules 
            WHERE module_id = ?
            ORDER BY display_order
        `, [tutorialModule.id]);

        console.log(`✓ Found ${submodules.length} submodules\n`);

        // Create progress for each submodule
        for (const submodule of submodules) {
            console.log(`Creating progress for: ${submodule.submodule_name}...`);

            const progressId = await DroneTrainingModel.recordProgress({
                studentId: 2,  // Student 2!
                classId: 1,    // FPV Drone
                categoryId: 1, // FPV category
                moduleId: tutorialModule.id,
                submoduleId: submodule.id,
                subsubmoduleId: null,
                completed: true,
                score: null
            });

            console.log(`  ✅ Progress ID: ${progressId}`);
        }

        console.log('\n✅ All Tutorial submodules marked as completed for Student 2!');
        console.log('   Refresh your browser at /1/2/progress\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

createProgressForStudent2();
