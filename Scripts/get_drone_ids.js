require('dotenv').config();
const pool = require('../config/db');

async function getIDs() {
    try {
        const [modules] = await pool.query('SELECT id, module_name FROM training_modules WHERE class_id = 1');
        console.log('--- MODULES ---');
        console.table(modules);

        const [submodules] = await pool.query('SELECT id, module_id, submodule_name FROM training_submodules WHERE module_id IN (SELECT id FROM training_modules WHERE class_id = 1)');
        console.log('--- SUBMODULES ---');
        console.table(submodules);

        const [subsubmodules] = await pool.query('SELECT id, submodule_id, subsubmodule_name FROM training_subsubmodules WHERE submodule_id IN (SELECT id FROM training_submodules WHERE module_id IN (SELECT id FROM training_modules WHERE class_id = 1))');
        console.log('--- SUB-SUBMODULES ---');
        console.table(subsubmodules);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
getIDs();
