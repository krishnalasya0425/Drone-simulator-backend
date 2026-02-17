require('dotenv').config();
const pool = require('../config/db');

async function checkRecord16() {
    try {
        const [rows] = await pool.query("SELECT * FROM student_training_progress WHERE id = 16");
        console.log('RECORD_16_DATA');
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkRecord16();
