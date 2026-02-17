require('dotenv').config();
const axios = require('axios');

/**
 * TEST: Simplified API - Send only IDs (no "completed" or "score")
 */

const API_URL = 'http://localhost:5000';

async function testSimplifiedAPI() {
    console.log('🧪 Testing SIMPLIFIED Drone Training Progress API\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // TEST 1: Send ONLY studentId, classId, moduleId, submoduleId
        console.log('📝 TEST 1: Minimal request (no completed, no score)');

        const minimalRequest = {
            studentId: 1,
            classId: 1,
            moduleId: 62,
            submoduleId: 151
        };

        console.log('   Request:', JSON.stringify(minimalRequest, null, 2));

        const response1 = await axios.post(`${API_URL}/drone-training/progress`, minimalRequest);
        console.log('   ✓ Response:', response1.data);
        console.log('   ✓ Module should be marked as COMPLETED automatically\n');

        // TEST 2: With weather condition
        console.log('📝 TEST 2: With weather condition (City > Rain)');

        const weatherRequest = {
            studentId: 1,
            classId: 1,
            moduleId: 63,
            submoduleId: 156,
            subsubmoduleId: 121
        };

        console.log('   Request:', JSON.stringify(weatherRequest, null, 2));

        const response2 = await axios.post(`${API_URL}/drone-training/progress`, weatherRequest);
        console.log('   ✓ Response:', response2.data);
        console.log('   ✓ Weather condition should be marked as COMPLETED\n');

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ Simplified API works! AR/VR team can send just IDs!\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Check if axios is available
try {
    testSimplifiedAPI();
} catch (error) {
    console.log('⚠️  axios not found. Install with: npm install axios');
    console.log('   Or test manually with the requests shown above.');
}
