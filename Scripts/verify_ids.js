require('dotenv').config();
const pool = require('../config/db');

async function checkHierarchy() {
    try {
        const [subsubs] = await pool.query("SELECT id, subsubmodule_name, submodule_id FROM training_subsubmodules WHERE id = 121");
        console.log('SUBSUB_121:', subsubs[0]);

        const [sub] = await pool.query("SELECT id, module_id, submodule_name FROM training_submodules WHERE id = 156");
        console.log('SUB_156:', sub[0]);

        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
checkHierarchy();
