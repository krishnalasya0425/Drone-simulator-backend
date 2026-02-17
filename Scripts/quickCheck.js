require('dotenv').config();
const pool = require('../config/db');

async function quickCheck() {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id,
                class_id,
                drone_category_id,
                module_id,
                submodule_id,
                completed
            FROM student_training_progress 
            WHERE student_id = 1
            ORDER BY id DESC
            LIMIT 10
        `);

        console.log('\n📊 Progress Records:\n');
        console.table(rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

quickCheck();
