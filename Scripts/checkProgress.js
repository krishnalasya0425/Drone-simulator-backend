require('dotenv').config();
const pool = require('../config/db');

async function checkProgress() {
    try {
        console.log('🔍 Checking student progress records...\n');

        const [rows] = await pool.query(`
            SELECT 
                id,
                student_id,
                class_id,
                module_id,
                submodule_id,
                subsubmodule_id,
                completed,
                score
            FROM student_training_progress 
            WHERE student_id = 1
            ORDER BY id DESC
            LIMIT 10
        `);

        if (rows.length === 0) {
            console.log('❌ No progress records found for student 1');
            console.log('   Run testAPI.bat to create some test data\n');
        } else {
            console.log(`✅ Found ${rows.length} progress records:\n`);
            rows.forEach((row, index) => {
                console.log(`${index + 1}. Module: ${row.module_id}, Submodule: ${row.submodule_id || 'N/A'}, Completed: ${row.completed ? '✓' : '✗'}, Score: ${row.score || 'N/A'}`);
            });
            console.log('');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkProgress();
