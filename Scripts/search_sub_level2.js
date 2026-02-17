require('dotenv').config();
const pool = require('../config/db');

async function searchSubLevel2() {
    try {
        const [rows] = await pool.query("SELECT id, module_id, submodule_name FROM training_submodules WHERE submodule_name LIKE '%Level2%'");
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
searchSubLevel2();
