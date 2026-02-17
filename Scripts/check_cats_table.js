require('dotenv').config();
const pool = require('../config/db');

async function checkCategories() {
    try {
        const [rows] = await pool.query("SELECT id, category_name FROM drone_categories");
        console.table(rows);
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
checkCategories();
