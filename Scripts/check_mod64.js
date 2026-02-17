require('dotenv').config();
const pool = require('../config/db');

async function checkModule64() {
    try {
        const [rows] = await pool.query("SELECT id, submodule_name FROM training_submodules WHERE module_id = 64");
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
checkModule64();
