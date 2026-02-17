require('dotenv').config();
const pool = require('../config/db');

/**
 * FIXED DRONE TRAINING STRUCTURE
 * This script creates 3 fixed classes with standardized training hierarchy
 * IDs are predictable and documented for AR/VR team integration
 */

async function initializeFixedStructure() {
    try {
        console.log('🚁 Initializing Fixed Drone Training Structure...\n');

        // ============================================
        // STEP 1: Create 3 Fixed Classes
        // ============================================
        console.log('📚 Creating 3 Fixed Classes...');

        const classes = [
            { id: 1, name: 'FPV Drone' },
            { id: 2, name: 'Surveillance Drone' },
            { id: 3, name: 'Payload Drone' }
        ];

        for (const cls of classes) {
            await pool.query(
                `INSERT INTO classes (id, class_name, created_by) 
                 VALUES (?, ?, 0) 
                 ON DUPLICATE KEY UPDATE class_name = ?`,
                [cls.id, cls.name, cls.name]
            );
            console.log(`   ✓ Class ${cls.id}: ${cls.name}`);
        }

        // ============================================
        // STEP 2: Ensure Drone Categories Exist
        // ============================================
        console.log('\n🏷️  Verifying Drone Categories...');
        const [categories] = await pool.query('SELECT * FROM drone_categories ORDER BY id');

        if (categories.length === 0) {
            await pool.query(`
                INSERT INTO drone_categories (id, category_name, description, display_order) VALUES
                (1, 'FPV Drone', 'First Person View racing and freestyle drones', 1),
                (2, 'Surveillance Drone', 'Reconnaissance and monitoring drones', 2),
                (3, 'Payload Drone', 'Heavy-lift and cargo transport drones', 3)
            `);
            console.log('   ✓ Categories created');
        } else {
            console.log('   ✓ Categories already exist');
        }

        // ============================================
        // STEP 3: Define Standard Training Hierarchy
        // ============================================
        console.log('\n📋 Defining Standard Training Hierarchy...');

        const trainingStructure = {
            'Introduction': {
                order: 1,
                submodules: []
            },
            'Tutorial': {
                order: 2,
                submodules: [
                    { name: 'Start', order: 1, conditions: [] },
                    { name: 'Liftoff', order: 2, conditions: [] },
                    { name: 'Move', order: 3, conditions: [] },
                    { name: 'Straight', order: 4, conditions: [] },
                    { name: 'U Maneuver', order: 5, conditions: [] }
                ]
            },
            'Intermediate': {
                order: 3,
                submodules: [
                    { name: 'City', order: 1, conditions: ['Rain', 'Fog', 'Wind'] },
                    { name: 'Forest', order: 2, conditions: ['Rain', 'Fog', 'Wind'] },
                    { name: 'OpenFields', order: 3, conditions: ['Rain', 'Fog', 'Wind'] },
                    { name: 'Desert', order: 4, conditions: ['Rain', 'Fog', 'Wind'] }
                ]
            },
            'Obstacle Course': {
                order: 4,
                submodules: [
                    { name: 'ObstacleCourse', order: 1, conditions: [] }
                ]
            },
            'Advanced': {
                order: 5,
                submodules: [
                    { name: 'Level1', order: 1, conditions: [] },
                    { name: 'Level2', order: 2, conditions: [] }
                ]
            },
            'Maintenance': {
                order: 6,
                submodules: [
                    { name: 'Parts Identification', order: 1, conditions: [] },
                    { name: 'Assembly', order: 2, conditions: [] },
                    { name: 'Disassembly', order: 3, conditions: [] }
                ]
            }
        };

        // ============================================
        // STEP 4: Create Modules for Each Class
        // ============================================
        console.log('\n🔧 Creating Training Modules...');

        const idMapping = {
            classes: {},
            modules: {},
            submodules: {},
            subsubmodules: {}
        };

        for (const cls of classes) {
            idMapping.classes[cls.id] = { name: cls.name, modules: {} };

            for (const [moduleName, moduleData] of Object.entries(trainingStructure)) {
                // Check if module exists
                const [existingModules] = await pool.query(
                    'SELECT id FROM training_modules WHERE class_id = ? AND module_name = ?',
                    [cls.id, moduleName]
                );

                let moduleId;
                if (existingModules.length > 0) {
                    moduleId = existingModules[0].id;
                } else {
                    const [result] = await pool.query(
                        `INSERT INTO training_modules (class_id, drone_category_id, module_name, description, display_order) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [cls.id, cls.id, moduleName, `${moduleName} training module`, moduleData.order]
                    );
                    moduleId = result.insertId;
                }

                idMapping.classes[cls.id].modules[moduleName] = { id: moduleId, submodules: {} };

                // Create submodules
                for (const sub of moduleData.submodules) {
                    const [existingSubs] = await pool.query(
                        'SELECT id FROM training_submodules WHERE module_id = ? AND submodule_name = ?',
                        [moduleId, sub.name]
                    );

                    let submoduleId;
                    if (existingSubs.length > 0) {
                        submoduleId = existingSubs[0].id;
                    } else {
                        const [result] = await pool.query(
                            `INSERT INTO training_submodules (module_id, submodule_name, description, display_order) 
                             VALUES (?, ?, ?, ?)`,
                            [moduleId, sub.name, `${sub.name} submodule`, sub.order]
                        );
                        submoduleId = result.insertId;
                    }

                    idMapping.classes[cls.id].modules[moduleName].submodules[sub.name] = {
                        id: submoduleId,
                        conditions: {}
                    };

                    // Create conditions (sub-submodules)
                    for (let i = 0; i < sub.conditions.length; i++) {
                        const conditionName = sub.conditions[i];
                        const [existingConds] = await pool.query(
                            'SELECT id FROM training_subsubmodules WHERE submodule_id = ? AND subsubmodule_name = ?',
                            [submoduleId, conditionName]
                        );

                        let conditionId;
                        if (existingConds.length === 0) {
                            const [result] = await pool.query(
                                `INSERT INTO training_subsubmodules (submodule_id, subsubmodule_name, description, display_order) 
                                 VALUES (?, ?, ?, ?)`,
                                [submoduleId, conditionName, `${conditionName} weather condition`, i + 1]
                            );
                            conditionId = result.insertId;
                        } else {
                            conditionId = existingConds[0].id;
                        }

                        idMapping.classes[cls.id].modules[moduleName].submodules[sub.name].conditions[conditionName] = conditionId;
                    }
                }
            }
        }

        // ============================================
        // STEP 5: Generate AR/VR Integration Document
        // ============================================
        console.log('\n📄 Generating AR/VR Integration Document...');

        let document = `
╔════════════════════════════════════════════════════════════════════════════╗
║                   DRONE TRAINING - AR/VR INTEGRATION GUIDE                 ║
║                          ID Reference Document                             ║
╚════════════════════════════════════════════════════════════════════════════╝

ENDPOINT: POST http://localhost:5000/drone-training/progress

REQUIRED FIELDS:
  - studentId: <integer>
  - classId: <integer> (1, 2, or 3)
  - moduleId: <integer> (from tables below)
  - submoduleId: <integer> (optional, for specific submodule)
  - subsubmoduleId: <integer> (optional, for weather conditions)
  - completed: <boolean>
  - score: <float> (optional)

═══════════════════════════════════════════════════════════════════════════

`;

        for (const [classId, classData] of Object.entries(idMapping.classes)) {
            document += `\n┌─────────────────────────────────────────────────────────────────────────┐\n`;
            document += `│ CLASS ${classId}: ${classData.name.toUpperCase().padEnd(64)}│\n`;
            document += `└─────────────────────────────────────────────────────────────────────────┘\n\n`;

            for (const [moduleName, moduleData] of Object.entries(classData.modules)) {
                document += `  📦 MODULE: ${moduleName}\n`;
                document += `     ID: ${moduleData.id}\n`;

                if (Object.keys(moduleData.submodules).length === 0) {
                    document += `     (No submodules)\n\n`;
                } else {
                    document += `\n`;
                    for (const [subName, subData] of Object.entries(moduleData.submodules)) {
                        document += `     ├─ SUBMODULE: ${subName}\n`;
                        document += `     │  ID: ${subData.id}\n`;

                        if (Object.keys(subData.conditions).length > 0) {
                            document += `     │  CONDITIONS:\n`;
                            for (const [condName, condId] of Object.entries(subData.conditions)) {
                                document += `     │    • ${condName}: ID ${condId}\n`;
                            }
                        }
                        document += `     │\n`;
                    }
                    document += `\n`;
                }
            }
        }

        document += `\n═══════════════════════════════════════════════════════════════════════════\n`;
        document += `\nEXAMPLE API CALL:\n`;
        document += `\nPOST /drone-training/progress\n`;
        document += `Content-Type: application/json\n\n`;
        document += `{\n`;
        document += `  "studentId": 1,\n`;
        document += `  "classId": 1,\n`;
        document += `  "moduleId": 2,\n`;
        document += `  "submoduleId": 7,\n`;
        document += `  "subsubmoduleId": 19,\n`;
        document += `  "completed": true,\n`;
        document += `  "score": 95.5\n`;
        document += `}\n`;
        document += `\n═══════════════════════════════════════════════════════════════════════════\n`;

        // Save to file
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(__dirname, '../ARVR_INTEGRATION_IDS.txt');
        fs.writeFileSync(outputPath, document);

        console.log(`   ✓ Document saved to: ${outputPath}`);
        console.log('\n✅ Fixed structure initialized successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

initializeFixedStructure();
