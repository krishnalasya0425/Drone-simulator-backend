require('dotenv').config();
const pool = require('../config/db');
const DroneTrainingModel = require('../Model/droneTrainingModel');

async function createTestDataForClass2() {
    try {
        console.log('📝 Creating test progress for Class 2 (Surveillance Drone)...\n');

        // Get the Tutorial module for Class 2
        const [modules] = await pool.query(`
            SELECT id, module_name 
            FROM training_modules 
            WHERE class_id = 2 AND module_name = 'Tutorial'
        `);

        if (modules.length === 0) {
            console.log('❌ Tutorial module not found for Class 2');
            process.exit(1);
        }

        const tutorialModule = modules[0];
        console.log(`✓ Found Tutorial module: ID ${tutorialModule.id}`);

        // Get the Start submodule
        const [submodules] = await pool.query(`
            SELECT id, submodule_name 
            FROM training_submodules 
            WHERE module_id = ? AND submodule_name = 'Start'
        `, [tutorialModule.id]);

        if (submodules.length === 0) {
            console.log('❌ Start submodule not found');
            process.exit(1);
        }

        const startSubmodule = submodules[0];
        console.log(`✓ Found Start submodule: ID ${startSubmodule.id}\n`);

        // Create progress record
        console.log('Creating progress record...');
        const progressId = await DroneTrainingModel.recordProgress({
            studentId: 1,
            classId: 2,  // Surveillance Drone
            categoryId: 2,  // Surveillance category
            moduleId: tutorialModule.id,
            submoduleId: startSubmodule.id,
            subsubmoduleId: null,
            completed: true,
            score: null
        });

        console.log(`✅ Progress recorded! ID: ${progressId}\n`);

        // Verify
        const [rows] = await pool.query(
            'SELECT * FROM student_training_progress WHERE id = ?',
            [progressId]
        );

        if (rows.length > 0) {
            const record = rows[0];
            console.log('Verification:');
            console.log(`  Class: 2 (Surveillance Drone)`);
            console.log(`  Module: ${record.module_id} (Tutorial)`);
            console.log(`  Submodule: ${record.submodule_id} (Start)`);
            console.log(`  Completed: ${record.completed ? '✅ YES' : '❌ NO'}`);
            console.log(`  Category ID: ${record.drone_category_id}`);
        }

        console.log('\n✅ Test data created for Class 2!');
        console.log('   Refresh your browser at localhost:5173/2/progress\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createTestDataForClass2();
