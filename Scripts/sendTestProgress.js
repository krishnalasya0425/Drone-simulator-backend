require('dotenv').config();
const pool = require('../config/db');

async function sendTestProgress() {
    try {
        console.log('📝 Sending test progress to API...\n');

        // Import the controller
        const DroneTrainingController = require('../Controller/droneTrainingController');
        const DroneTrainingModel = require('../Model/droneTrainingModel');

        // Test data - minimal request (no completed, no score)
        const testData = {
            studentId: 1,
            classId: 1,
            moduleId: 62,      // Tutorial
            submoduleId: 151   // Start
        };

        console.log('Test data:', testData);
        console.log('');

        // Call the model directly
        const progressId = await DroneTrainingModel.recordProgress({
            studentId: testData.studentId,
            classId: testData.classId,
            categoryId: testData.classId, // Same as classId
            moduleId: testData.moduleId,
            submoduleId: testData.submoduleId,
            subsubmoduleId: null,
            completed: true,  // Explicitly set to true
            score: null
        });

        console.log('✅ Progress recorded! ID:', progressId);
        console.log('');

        // Verify
        const [rows] = await pool.query(
            'SELECT * FROM student_training_progress WHERE id = ?',
            [progressId]
        );

        if (rows.length > 0) {
            const record = rows[0];
            console.log('Verification:');
            console.log(`  Module: ${record.module_id}`);
            console.log(`  Submodule: ${record.submodule_id}`);
            console.log(`  Completed: ${record.completed ? '✅ YES' : '❌ NO'}`);
            console.log(`  Score: ${record.score || 'N/A'}`);
        }

        console.log('\n✅ Test complete! Refresh frontend to see checkmark.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

sendTestProgress();
