require('dotenv').config();
const pool = require('../config/db');

/**
 * Clean up database by removing unused scorecard and completion_data columns
 */

async function cleanupDatabase() {
    try {
        console.log('🧹 Cleaning up database schema...\n');

        // Check if columns exist before trying to drop them
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'student_training_progress'
            AND COLUMN_NAME IN ('scorecard_image_path', 'completion_data')
        `);

        if (columns.length > 0) {
            console.log('📋 Found columns to remove:');
            columns.forEach(col => console.log(`   - ${col.COLUMN_NAME}`));
            console.log('');

            // Remove scorecard_image_path column
            if (columns.some(col => col.COLUMN_NAME === 'scorecard_image_path')) {
                await pool.query(`
                    ALTER TABLE student_training_progress 
                    DROP COLUMN scorecard_image_path
                `);
                console.log('   ✓ Removed scorecard_image_path column');
            }

            // Remove completion_data column
            if (columns.some(col => col.COLUMN_NAME === 'completion_data')) {
                await pool.query(`
                    ALTER TABLE student_training_progress 
                    DROP COLUMN completion_data
                `);
                console.log('   ✓ Removed completion_data column');
            }

            console.log('\n✅ Database cleanup completed!\n');
        } else {
            console.log('✓ Database schema is already clean (no columns to remove)\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

cleanupDatabase();
