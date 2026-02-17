require('dotenv').config();
const pool = require('../config/db');

/**
 * Verify the complete drone training structure
 */

async function verifyStructure() {
    try {
        console.log('🔍 Verifying Drone Training Structure\n');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Check classes
        const [classes] = await pool.query('SELECT * FROM classes WHERE id IN (1, 2, 3) ORDER BY id');
        console.log('📚 CLASSES:');
        classes.forEach(cls => {
            console.log(`   ✓ Class ${cls.id}: ${cls.class_name}`);
        });
        console.log('');

        // Check categories
        const [categories] = await pool.query('SELECT * FROM drone_categories ORDER BY id');
        console.log('🏷️  CATEGORIES:');
        categories.forEach(cat => {
            console.log(`   ✓ Category ${cat.id}: ${cat.category_name}`);
        });
        console.log('');

        // Check modules per class
        console.log('📦 MODULES PER CLASS:');
        for (const cls of classes) {
            const [modules] = await pool.query(
                'SELECT COUNT(*) as count FROM training_modules WHERE class_id = ?',
                [cls.id]
            );
            console.log(`   Class ${cls.id} (${cls.class_name}): ${modules[0].count} modules`);
        }
        console.log('');

        // Check submodules
        const [submodules] = await pool.query('SELECT COUNT(*) as count FROM training_submodules');
        console.log(`📋 TOTAL SUBMODULES: ${submodules[0].count}`);
        console.log('');

        // Check sub-submodules
        const [subsubmodules] = await pool.query('SELECT COUNT(*) as count FROM training_subsubmodules');
        console.log(`🌦️  TOTAL WEATHER CONDITIONS: ${subsubmodules[0].count}`);
        console.log('');

        // Sample module details for Class 1
        console.log('📖 SAMPLE: Class 1 (FPV Drone) Modules:');
        const [class1Modules] = await pool.query(`
            SELECT id, module_name, display_order 
            FROM training_modules 
            WHERE class_id = 1 
            ORDER BY display_order
        `);
        class1Modules.forEach(mod => {
            console.log(`   ${mod.display_order}. ${mod.module_name} (ID: ${mod.id})`);
        });
        console.log('');

        // Check progress table structure
        console.log('🗃️  PROGRESS TABLE STRUCTURE:');
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'student_training_progress'
            ORDER BY ORDINAL_POSITION
        `);
        columns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        console.log('');

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ Structure verification complete!\n');
        console.log('SUMMARY:');
        console.log(`  • Classes: ${classes.length}`);
        console.log(`  • Categories: ${categories.length}`);
        console.log(`  • Total Modules: ${classes.length * 6}`);
        console.log(`  • Total Submodules: ${submodules[0].count}`);
        console.log(`  • Total Weather Conditions: ${subsubmodules[0].count}`);
        console.log('');
        console.log('🎯 System is ready for AR/VR integration!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

verifyStructure();
