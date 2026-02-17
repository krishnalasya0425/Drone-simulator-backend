require('dotenv').config();
const pool = require('../config/db');

/**
 * Clean up duplicate modules and ensure correct structure
 */

async function cleanupDuplicates() {
    try {
        console.log('🧹 Cleaning up duplicate modules...\n');

        // Delete all existing modules (they will be recreated correctly)
        console.log('📋 Removing all existing training modules...');
        await pool.query('DELETE FROM training_modules');
        console.log('   ✓ Modules cleared\n');

        // Now reinitialize with correct structure
        console.log('🔧 Reinitializing training structure...');
        const DroneTrainingModel = require('../Model/droneTrainingModel');

        for (let classId = 1; classId <= 3; classId++) {
            await DroneTrainingModel.initializeDefaultStructure(classId);
            console.log(`   ✓ Class ${classId} initialized`);
        }

        console.log('\n✅ Cleanup complete!\n');

        // Verify
        const [modules] = await pool.query('SELECT COUNT(*) as count FROM training_modules');
        const [submodules] = await pool.query('SELECT COUNT(*) as count FROM training_submodules');
        const [subsubmodules] = await pool.query('SELECT COUNT(*) as count FROM training_subsubmodules');

        console.log('📊 Final counts:');
        console.log(`   Modules: ${modules[0].count} (expected: 18 = 6 per class × 3 classes)`);
        console.log(`   Submodules: ${submodules[0].count}`);
        console.log(`   Weather Conditions: ${subsubmodules[0].count}`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

cleanupDuplicates();
