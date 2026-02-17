require('dotenv').config();
const pool = require('../config/db');

async function checkRecord6() {
    try {
        const [rows] = await pool.query("SELECT id, student_id, class_id, module_id, submodule_id, subsubmodule_id, completed FROM student_training_progress WHERE id = 6");
        console.log('RECORD_6:', rows[0]);
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
checkRecord6();
