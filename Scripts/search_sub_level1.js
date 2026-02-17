require('dotenv').config();
const pool = require('../config/db');

async function searchSubLevel1() {
    try {
        const [rows] = await pool.query("SELECT id, module_id, submodule_name FROM training_submodules WHERE submodule_name LIKE '%Level1%'");
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
searchSubLevel1();
