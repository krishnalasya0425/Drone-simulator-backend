require('dotenv').config();
const DroneTrainingModel = require('../Model/droneTrainingModel');
const pool = require('../config/db');

/**
 * Seed script to initialize drone training structure for a class
 * Usage: node Scripts/seedDroneTraining.js <classId>
 */

async function seedDroneTraining(classId) {
    try {
        console.log(`🚁 Initializing Drone Training Structure for Class ID: ${classId}`);
        console.log('━'.repeat(60));

        // Check if class exists
        const [classes] = await pool.query('SELECT * FROM classes WHERE id = ?', [classId]);
        if (classes.length === 0) {
            throw new Error(`Class with ID ${classId} not found`);
        }

        console.log(`✅ Class found: ${classes[0].class_name}`);

        // Initialize structure
        const result = await DroneTrainingModel.initializeDefaultStructure(classId);

        console.log('━'.repeat(60));
        console.log('✅ Drone Training Structure Initialized Successfully!');
        console.log('');
        console.log('📊 Structure Created:');
        console.log('   • 3 Drone Categories (FPV, Surveillance, Payload)');
        console.log('   • 6 Training Modules per category:');
        console.log('     - Introduction');
        console.log('     - Tutorial (5 sub-modules)');
        console.log('     - Intermediate (4 environments × 3 conditions each)');
        console.log('     - Obstacle Course (1 sub-module)');
        console.log('     - Advanced (2 levels)');
        console.log('     - Maintenance (3 sub-modules)');
        console.log('');
        console.log('🎯 Total Training Units Created:');
        console.log('   • Modules: 18 (6 per category)');
        console.log('   • Sub-modules: ~60');
        console.log('   • Sub-sub-modules: ~36 (weather conditions)');
        console.log('━'.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing drone training structure:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Get classId from command line arguments
const classId = process.argv[2];

if (!classId) {
    console.error('❌ Error: Class ID is required');
    console.log('Usage: node Scripts/seedDroneTraining.js <classId>');
    process.exit(1);
}

seedDroneTraining(parseInt(classId));
