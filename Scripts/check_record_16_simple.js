require('dotenv').config();
const pool = require('../config/db');

async function checkRecord16() {
    try {
        const [rows] = await pool.query("SELECT id, completed FROM student_training_progress WHERE id = 16");
        console.log('RECORD_16:', rows[0]);
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
checkRecord16();
