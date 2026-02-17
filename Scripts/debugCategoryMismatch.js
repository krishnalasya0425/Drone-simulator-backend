require('dotenv').config();
const pool = require('../config/db');

async function debugCategoryMismatch() {
    try {
        console.log('🔍 DEBUGGING CATEGORY ID MISMATCH\n');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Check what categories exist
        const [categories] = await pool.query('SELECT * FROM drone_categories');
        console.log('Available categories:');
        categories.forEach(cat => {
            console.log(`  - ID: ${cat.id}, Name: ${cat.category_name}`);
        });
        console.log('');

        // Check what's in the progress table
        const [progress] = await pool.query(`
            SELECT 
                stp.id,
                stp.class_id,
                stp.drone_category_id,
                stp.module_id,
                stp.submodule_id,
                stp.completed,
                tm.module_name,
                ts.submodule_name
            FROM student_training_progress stp
            LEFT JOIN training_modules tm ON stp.module_id = tm.id
            LEFT JOIN training_submodules ts ON stp.submodule_id = ts.id
            WHERE stp.student_id = 1
            ORDER BY stp.id DESC
            LIMIT 5
        `);

        console.log('Progress records for student 1:');
        progress.forEach(p => {
            console.log(`  - Class: ${p.class_id}, Category: ${p.drone_category_id}, Module: ${p.module_name} (${p.module_id}), Submodule: ${p.submodule_name} (${p.submodule_id}), Completed: ${p.completed}`);
        });
        console.log('');

        // Check what modules exist for class 1
        const [modules] = await pool.query(`
            SELECT id, class_id, drone_category_id, module_name
            FROM training_modules
            WHERE class_id = 1
            ORDER BY display_order
        `);

        console.log('Modules for Class 1:');
        modules.forEach(m => {
            console.log(`  - Module: ${m.module_name} (ID: ${m.id}), Category: ${m.drone_category_id}`);
        });
        console.log('');

        // Now simulate what the model does
        console.log('═══════════════════════════════════════════════════════════');
        console.log('Simulating model query:\n');

        const studentId = 1;
        const classId = 1;
        const categoryId = 1; // FPV Drone

        const [progressForCategory] = await pool.query(
            `SELECT * FROM student_training_progress 
             WHERE student_id = ? AND class_id = ? AND drone_category_id = ?`,
            [studentId, classId, categoryId]
        );

        console.log(`Query: student_id=${studentId}, class_id=${classId}, drone_category_id=${categoryId}`);
        console.log(`Found ${progressForCategory.length} progress records\n`);

        if (progressForCategory.length > 0) {
            console.log('Progress records found:');
            progressForCategory.forEach(p => {
                const key = `${p.module_id || ''}_${p.submodule_id || ''}_${p.subsubmodule_id || ''}`;
                console.log(`  Key: "${key}", Module: ${p.module_id}, Submodule: ${p.submodule_id}, Completed: ${p.completed}`);
            });
        } else {
            console.log('❌ NO PROGRESS RECORDS FOUND!');
            console.log('   This means the category_id in progress table doesn\'t match!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

debugCategoryMismatch();
