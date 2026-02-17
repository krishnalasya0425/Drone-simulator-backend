require('dotenv').config();
const pool = require('../config/db');

async function checkSubmodule160() {
    try {
        const [rows] = await pool.query("SELECT id, submodule_name FROM training_submodules WHERE id = 160");
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
checkSubmodule160();
