require('dotenv').config();
const pool = require('../config/db');

async function debugProgress() {
    try {
        console.log('🔍 DEBUGGING PROGRESS DATA\n');
        console.log('═══════════════════════════════════════════════════════════\n');

        // 1. Check if modules exist
        console.log('1️⃣ Checking modules for Class 1 (FPV Drone):\n');
        const [modules] = await pool.query(`
            SELECT id, module_name, drone_category_id 
            FROM training_modules 
            WHERE class_id = 1 
            ORDER BY display_order
        `);

        console.log(`   Found ${modules.length} modules:`);
        modules.forEach(m => {
            console.log(`   - Module ${m.id}: ${m.module_name} (category: ${m.drone_category_id})`);
        });
        console.log('');

        // 2. Check if submodules exist
        console.log('2️⃣ Checking submodules for Tutorial module:\n');
        const tutorialModule = modules.find(m => m.module_name === 'Tutorial');

        if (tutorialModule) {
            const [submodules] = await pool.query(`
                SELECT id, submodule_name 
                FROM training_submodules 
                WHERE module_id = ?
                ORDER BY display_order
            `, [tutorialModule.id]);

            console.log(`   Found ${submodules.length} submodules:`);
            submodules.forEach(s => {
                console.log(`   - Submodule ${s.id}: ${s.submodule_name}`);
            });
            console.log('');

            // 3. Check progress records
            console.log('3️⃣ Checking progress records for Student 1:\n');
            const [progress] = await pool.query(`
                SELECT 
                    id,
                    module_id,
                    submodule_id,
                    subsubmodule_id,
                    completed,
                    score,
                    drone_category_id
                FROM student_training_progress 
                WHERE student_id = 1 AND class_id = 1
                ORDER BY id DESC
            `);

            console.log(`   Found ${progress.length} progress records:`);
            progress.forEach(p => {
                console.log(`   - Progress ${p.id}: Module ${p.module_id}, Submodule ${p.submodule_id}, Completed: ${p.completed ? '✅' : '❌'}, Category: ${p.drone_category_id}`);
            });
            console.log('');

            // 4. Check if there's a match
            console.log('4️⃣ Checking for matching progress:\n');
            const startSubmodule = submodules.find(s => s.submodule_name === 'Start');
            if (startSubmodule) {
                const matchingProgress = progress.find(p =>
                    p.module_id === tutorialModule.id &&
                    p.submodule_id === startSubmodule.id
                );

                if (matchingProgress) {
                    console.log(`   ✅ FOUND MATCH!`);
                    console.log(`      Module: ${tutorialModule.id} (${tutorialModule.module_name})`);
                    console.log(`      Submodule: ${startSubmodule.id} (${startSubmodule.submodule_name})`);
                    console.log(`      Completed: ${matchingProgress.completed ? 'YES ✅' : 'NO ❌'}`);
                    console.log(`      Category ID in progress: ${matchingProgress.drone_category_id}`);
                } else {
                    console.log(`   ❌ NO MATCH FOUND`);
                    console.log(`      Looking for: Module ${tutorialModule.id}, Submodule ${startSubmodule.id}`);
                    console.log(`      Available progress records:`);
                    progress.forEach(p => {
                        console.log(`        - Module ${p.module_id}, Submodule ${p.submodule_id}`);
                    });
                }
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

debugProgress();
