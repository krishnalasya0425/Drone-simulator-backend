require('dotenv').config();
const pool = require('../config/db');

async function checkRecord6() {
    try {
        const [rows] = await pool.query("SELECT * FROM student_training_progress WHERE id = 6");
        console.log('RECORD_6_DATA:', JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkRecord6();
