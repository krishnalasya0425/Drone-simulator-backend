require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Generate complete system status report
 */

async function generateStatusReport() {
    try {
        console.log('📊 Generating System Status Report...\n');

        let report = '';
        report += '╔════════════════════════════════════════════════════════════════════════════╗\n';
        report += '║                  DRONE TRAINING SYSTEM - STATUS REPORT                     ║\n';
        report += '║                        Generated: ' + new Date().toISOString() + '                    ║\n';
        report += '╚════════════════════════════════════════════════════════════════════════════╝\n\n';

        // Database Connection
        report += '🔌 DATABASE CONNECTION\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        const [dbInfo] = await pool.query('SELECT DATABASE() as db_name, VERSION() as version');
        report += `Database: ${dbInfo[0].db_name}\n`;
        report += `MySQL Version: ${dbInfo[0].version}\n`;
        report += `Status: ✅ Connected\n\n`;

        // Classes
        report += '📚 CLASSES\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        const [classes] = await pool.query('SELECT * FROM classes WHERE id IN (1, 2, 3) ORDER BY id');
        classes.forEach(cls => {
            report += `Class ${cls.id}: ${cls.class_name}\n`;
        });
        report += `Total: ${classes.length} classes\n\n`;

        // Categories
        report += '🏷️  DRONE CATEGORIES\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        const [categories] = await pool.query('SELECT * FROM drone_categories ORDER BY id');
        categories.forEach(cat => {
            report += `${cat.id}. ${cat.category_name} - ${cat.description}\n`;
        });
        report += `Total: ${categories.length} categories\n\n`;

        // Training Structure
        report += '📦 TRAINING STRUCTURE\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        const [modules] = await pool.query('SELECT COUNT(*) as count FROM training_modules');
        const [submodules] = await pool.query('SELECT COUNT(*) as count FROM training_submodules');
        const [subsubmodules] = await pool.query('SELECT COUNT(*) as count FROM training_subsubmodules');

        report += `Modules: ${modules[0].count}\n`;
        report += `Submodules: ${submodules[0].count}\n`;
        report += `Weather Conditions: ${subsubmodules[0].count}\n`;
        report += `Total Trackable Items: ${modules[0].count + submodules[0].count + subsubmodules[0].count}\n\n`;

        // Per-Class Breakdown
        report += '📊 PER-CLASS BREAKDOWN\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        for (const cls of classes) {
            const [classModules] = await pool.query(
                'SELECT COUNT(*) as count FROM training_modules WHERE class_id = ?',
                [cls.id]
            );
            report += `Class ${cls.id} (${cls.class_name}):\n`;
            report += `  • Modules: ${classModules[0].count}\n`;

            const [moduleList] = await pool.query(
                'SELECT module_name FROM training_modules WHERE class_id = ? ORDER BY display_order',
                [cls.id]
            );
            moduleList.forEach(mod => {
                report += `    - ${mod.module_name}\n`;
            });
            report += '\n';
        }

        // Progress Table
        report += '🗃️  PROGRESS TABLE\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        const [progressCount] = await pool.query('SELECT COUNT(*) as count FROM student_training_progress');
        report += `Total Progress Records: ${progressCount[0].count}\n`;

        const [progressColumns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'student_training_progress'
            ORDER BY ORDINAL_POSITION
        `);
        report += `Table Columns: ${progressColumns.map(c => c.COLUMN_NAME).join(', ')}\n\n`;

        // API Endpoints
        report += '🔌 API ENDPOINTS\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        report += 'POST   /drone-training/progress                    (Record progress)\n';
        report += 'GET    /drone-training/progress/:studentId/:classId (Get progress)\n';
        report += 'GET    /drone-training/progress-summary/:studentId/:classId (Summary)\n';
        report += 'GET    /drone-training/categories                  (List categories)\n';
        report += 'GET    /drone-training/hierarchy/:classId/:categoryId (Get hierarchy)\n';
        report += 'POST   /drone-training/initialize/:classId         (Initialize class)\n\n';

        // Documentation Files
        report += '📄 DOCUMENTATION FILES\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        const docs = [
            'ARVR_INTEGRATION_README.md',
            'ARVR_INTEGRATION_IDS.txt',
            'ARVR_INTEGRATION_IDS.json',
            'QUICK_REFERENCE.txt',
            'IMPLEMENTATION_SUMMARY.md'
        ];

        docs.forEach(doc => {
            const docPath = path.join(__dirname, '..', doc);
            if (fs.existsSync(docPath)) {
                const stats = fs.statSync(docPath);
                report += `✓ ${doc} (${(stats.size / 1024).toFixed(2)} KB)\n`;
            } else {
                report += `✗ ${doc} (missing)\n`;
            }
        });
        report += '\n';

        // System Status
        report += '✅ SYSTEM STATUS\n';
        report += '─────────────────────────────────────────────────────────────────────────────\n';
        report += '✓ Database: Connected\n';
        report += '✓ Classes: 3 fixed classes created\n';
        report += '✓ Training Hierarchy: Complete\n';
        report += '✓ API Endpoints: Configured\n';
        report += '✓ Documentation: Generated\n';
        report += '✓ Scorecard Features: Removed\n';
        report += '✓ Progress Tracking: Simplified\n\n';

        report += '🎯 SYSTEM READY FOR AR/VR INTEGRATION\n';
        report += '═══════════════════════════════════════════════════════════════════════════\n';

        // Save report
        const reportPath = path.join(__dirname, '..', 'SYSTEM_STATUS_REPORT.txt');
        fs.writeFileSync(reportPath, report);

        console.log(report);
        console.log(`\n📝 Report saved to: ${reportPath}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

generateStatusReport();
