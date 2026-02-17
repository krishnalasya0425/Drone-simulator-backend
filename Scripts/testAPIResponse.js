require('dotenv').config();
const pool = require('../config/db');

async function testAPIResponse() {
    try {
        console.log('🔍 Testing what the API returns to frontend...\n');

        const studentId = 1;
        const classId = 1;

        // Simulate what the frontend API call does
        const DroneTrainingModel = require('../Model/droneTrainingModel');

        console.log('Calling getStudentProgressWithHierarchy...');
        const result = await DroneTrainingModel.getStudentProgressWithHierarchy(
            studentId,
            classId,
            null  // No categoryId - fetch all
        );

        console.log('\n📊 API Response Structure:\n');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n\n🔍 Checking if progress is attached:\n');

        if (result && result.length > 0) {
            const firstCategory = result[0];
            console.log(`Category: ${firstCategory.category_name || firstCategory.id}`);

            if (firstCategory.modules && firstCategory.modules.length > 0) {
                const tutorialModule = firstCategory.modules.find(m => m.module_name === 'Tutorial');

                if (tutorialModule) {
                    console.log(`\n✓ Found Tutorial module (ID: ${tutorialModule.id})`);
                    console.log(`  Module progress:`, tutorialModule.progress);

                    if (tutorialModule.submodules && tutorialModule.submodules.length > 0) {
                        console.log(`\n  Submodules:`);
                        tutorialModule.submodules.forEach(sub => {
                            console.log(`    - ${sub.submodule_name} (ID: ${sub.id})`);
                            console.log(`      Progress:`, sub.progress);
                            if (sub.progress) {
                                console.log(`      Completed: ${sub.progress.completed ? '✅ YES' : '❌ NO'}`);
                            } else {
                                console.log(`      ⚠️  No progress object attached!`);
                            }
                        });
                    }
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testAPIResponse();
