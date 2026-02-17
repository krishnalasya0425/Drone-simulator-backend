require('dotenv').config();
const pool = require('../config/db');

async function checkHierarchy() {
    try {
        console.log('--- INTERMEDIATE MODULE (63) ---');
        const [submodules] = await pool.query("SELECT id, submodule_name FROM training_submodules WHERE module_id = 63");
        console.table(submodules);

        console.log('--- CITY SUBMODULE (156) SUB-SUB-MODULES ---');
        const [subsubs] = await pool.query("SELECT id, subsubmodule_name FROM training_subsubmodules WHERE submodule_id = 156");
        console.table(subsubs);

        console.log('--- PROGRESS RECORD 17 ---');
        const [progress] = await pool.query("SELECT * FROM student_training_progress WHERE id = 17");
        console.table(progress);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkHierarchy();
