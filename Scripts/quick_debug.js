require('dotenv').config();
const pool = require('../config/db');

async function checkAllProgress() {
    try {
        const [rows] = await pool.query(`SELECT student_id, class_id, module_id, submodule_id, completed FROM student_training_progress ORDER BY id DESC LIMIT 20`);
        console.log('DATA_START');
        console.log(JSON.stringify(rows));
        console.log('DATA_END');
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}
checkAllProgress();
