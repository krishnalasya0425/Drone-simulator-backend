require('dotenv').config();
const pool = require('../config/db');

async function checkDb() {
    try {
        const [categories] = await pool.query('SELECT * FROM drone_categories');
        console.log('Categories:', categories);

        const [classes] = await pool.query('SELECT id, class_name FROM classes');
        console.log('Classes:', classes);

        if (classes.length > 0) {
            const classId = classes[0].id;
            const [modules] = await pool.query('SELECT count(*) as count FROM training_modules WHERE class_id = ?', [classId]);
            console.log(`Modules for class ${classId}:`, modules[0].count);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkDb();
