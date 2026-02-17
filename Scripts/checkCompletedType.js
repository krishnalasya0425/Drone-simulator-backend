require('dotenv').config();
const pool = require('../config/db');

async function checkActualData() {
    try {
        console.log('🔍 CHECKING ACTUAL DATABASE VALUES\n');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Check what's actually in the database
        const [rows] = await pool.query(`
            SELECT 
                stp.id,
                stp.student_id,
                stp.class_id,
                stp.module_id,
                tm.module_name,
                stp.submodule_id,
                ts.submodule_name,
                stp.completed
            FROM student_training_progress stp
            LEFT JOIN training_modules tm ON stp.module_id = tm.id
            LEFT JOIN training_submodules ts ON stp.submodule_id = ts.id
            WHERE stp.student_id = 1 
            AND stp.class_id IN (1, 2)
            ORDER BY stp.id DESC
            LIMIT 5
        `);

        console.log(`Found ${rows.length} progress records:\n`);

        rows.forEach((row, index) => {
            console.log(`${index + 1}. Progress ID: ${row.id}`);
            console.log(`   Module: ${row.module_name} (ID: ${row.module_id})`);
            console.log(`   Submodule: ${row.submodule_name || 'N/A'} (ID: ${row.submodule_id || 'N/A'})`);
            console.log(`   Completed RAW value: ${row.completed}`);
            console.log(`   Completed JS type: ${typeof row.completed}`);
            console.log(`   Completed === 1: ${row.completed === 1}`);
            console.log(`   Completed === true: ${row.completed === true}`);
            console.log(`   Completed == 1: ${row.completed == 1}`);
            console.log(`   Completed == true: ${row.completed == true}`);
            console.log(`   Truthy: ${row.completed ? 'YES' : 'NO'}`);
            console.log('');
        });

        // Now check what the model returns
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('🔍 CHECKING MODEL OUTPUT FOR CLASS 1\n');

        const DroneTrainingModel = require('../Model/droneTrainingModel');
        const result = await DroneTrainingModel.getStudentProgressWithHierarchy(1, 1, null);

        if (result && result.length > 0) {
            const firstCat = result[0];
            console.log(`Category: ${firstCat.category_name || firstCat.id}\n`);

            const tutorial = firstCat.modules?.find(m => m.module_name === 'Tutorial');

            if (tutorial && tutorial.submodules) {
                console.log('Tutorial submodules from model:\n');
                tutorial.submodules.slice(0, 3).forEach(sub => {
                    console.log(`  📦 ${sub.submodule_name} (ID: ${sub.id}):`);
                    if (sub.progress) {
                        console.log(`    ✓ Has progress object`);
                        console.log(`    Completed value: ${sub.progress.completed}`);
                        console.log(`    Completed type: ${typeof sub.progress.completed}`);
                        console.log(`    === 1: ${sub.progress.completed === 1}`);
                        console.log(`    === true: ${sub.progress.completed === true}`);
                        console.log(`    Truthy: ${sub.progress.completed ? 'YES' : 'NO'}`);
                    } else {
                        console.log(`    ✗ NO progress object`);
                    }
                    console.log('');
                });
            } else {
                console.log('  ❌ Tutorial module not found or has no submodules');
            }
        } else {
            console.log('  ❌ No data returned from model');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

checkActualData();
