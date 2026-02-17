require('dotenv').config();
const pool = require('../config/db');

async function checkAllProgress() {
    try {
        console.log('🔍 Checking ALL student progress records...\n');

        const [rows] = await pool.query(`
            SELECT 
                p.id,
                p.student_id,
                p.class_id,
                p.module_id,
                m.module_name,
                p.submodule_id,
                s.submodule_name,
                p.completed,
                p.score
            FROM student_training_progress p
            LEFT JOIN training_modules m ON p.module_id = m.id
            LEFT JOIN training_submodules s ON p.submodule_id = s.id
            ORDER BY p.id DESC
        `);

        if (rows.length === 0) {
            console.log('❌ No progress records found in the database.');
        } else {
            console.log(`✅ Found ${rows.length} progress records:\n`);
            console.table(rows.map(r => ({
                id: r.id,
                student: r.student_id,
                class: r.class_id,
                module: `${r.module_name} (${r.module_id})`,
                submodule: `${r.submodule_name} (${r.submodule_id})`,
                completed: r.completed ? '✅' : '❌'
            })));
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkAllProgress();
