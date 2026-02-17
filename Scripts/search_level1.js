require('dotenv').config();
const pool = require('../config/db');

async function searchLevel1() {
    try {
        const [rows] = await pool.query("SELECT id, submodule_id, subsubmodule_name FROM training_subsubmodules WHERE subsubmodule_name LIKE '%Level1%'");
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
searchLevel1();
