require('dotenv').config();
const pool = require('../config/db');

async function debug() {
    try {
        const [cats] = await pool.query('SELECT id, category_name FROM drone_categories');
        console.log('--- Categories ---');
        console.log(JSON.stringify(cats, null, 2));

        const [classes] = await pool.query('SELECT id, class_name FROM classes');
        console.log('--- Classes ---');
        console.log(JSON.stringify(classes, null, 2));

        const [modules] = await pool.query('SELECT count(*) as count FROM training_modules');
        console.log('--- Total Modules ---');
        console.log(modules[0].count);

        const [submodules] = await pool.query('SELECT count(*) as count FROM training_submodules');
        console.log('--- Total Sub-modules ---');
        console.log(submodules[0].count);

        const [subsubmodules] = await pool.query('SELECT count(*) as count FROM training_subsubmodules');
        console.log('--- Total Sub-sub-modules ---');
        console.log(subsubmodules[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
debug();
