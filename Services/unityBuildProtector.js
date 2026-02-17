

const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const unityBuildModel = require('../Model/unityBuildModel');

class UnityBuildProtector {
    constructor() {
        this.protectedBuilds = new Map(); // Map of build_path -> file handles
        this.watchIntervals = new Map(); // Map of build_path -> interval ID
    }

    /**
     * Protect a Unity build folder by locking key files
     * @param {string} buildPath - Path to the Unity build folder
     * @param {number} classId - Class ID
     * @param {string} buildType - 'practice' or 'exercise'
     */
    async protectBuild(buildPath, classId, buildType) {
        try {
            // Check if path exists
            if (!fs.existsSync(buildPath)) {
                console.warn(`⚠️  Build path does not exist: ${buildPath}`);
                return false;
            }

            // Check if we have read access to the directory
            try {
                fs.accessSync(buildPath, fs.constants.R_OK);
            } catch (accessError) {
                console.warn(`⚠️  No read access to build path: ${buildPath}`);
                return false;
            }

            // Find the .exe file
            let files;
            try {
                files = fs.readdirSync(buildPath);
            } catch (readError) {
                console.warn(`⚠️  Cannot read directory: ${buildPath} - ${readError.message}`);
                return false;
            }

            const exeFile = files.find(f => f.endsWith('.exe'));

            if (!exeFile) {
                console.warn(`⚠️  No .exe file found in: ${buildPath}`);
                return false;
            }

            const exePath = path.join(buildPath, exeFile);
            const lockFilePath = path.join(buildPath, '.build_protected');

            // Create a lock file with information
            const lockInfo = {
                protected_by: 'Map Reading VR Training Platform',
                class_id: classId,
                build_type: buildType,
                protected_at: new Date().toISOString(),
                message: 'This Unity build is registered with the Map Reading VR Training Platform.\n\n' +
                    'To delete this build, please use the "Remove Build" button in the website.\n\n' +
                    'Attempting to delete these files directly may cause errors in the training platform.'
            };

            // Ensure lock file is writable if it already exists
            if (fs.existsSync(lockFilePath) && process.platform === 'win32') {
                try {
                    execSync(`attrib -h -r "${lockFilePath}"`);
                } catch (attrError) {
                    // Ignore errors clearing attributes
                }
            }

            // Try to write lock file - this is where permission errors often occur
            try {
                fs.writeFileSync(lockFilePath, JSON.stringify(lockInfo, null, 2));
            } catch (writeError) {
                if (writeError.code === 'EPERM' || writeError.code === 'EACCES') {
                    console.warn(`⚠️  Permission denied writing to: ${buildPath}`);
                    console.warn(`   Build will not be protected. Please check folder permissions.`);
                } else {
                    console.warn(`⚠️  Cannot write lock file to: ${buildPath} - ${writeError.message}`);
                }
                return false;
            }

            // Make lock file hidden and read-only
            if (process.platform === 'win32') {
                exec(`attrib +h +r "${lockFilePath}"`, (error) => {
                    if (error) {
                        // Silently ignore attribute errors
                    }
                });
            }

            // Open file handles to lock the files (Windows-specific)
            const fileHandles = [];

            try {
                // Lock the .exe file
                const exeHandle = fs.openSync(exePath, 'r');
                fileHandles.push({ path: exePath, handle: exeHandle });

                // Lock the lock file itself
                const lockHandle = fs.openSync(lockFilePath, 'r');
                fileHandles.push({ path: lockFilePath, handle: lockHandle });

                // Store the handles
                this.protectedBuilds.set(buildPath, {
                    handles: fileHandles,
                    classId,
                    buildType,
                    lockFilePath
                });

                // console.log(`✅ Protected build: ${buildPath}`);
                return true;

            } catch (lockError) {
                // If we can't lock, close any handles we did open
                fileHandles.forEach(fh => {
                    try {
                        fs.closeSync(fh.handle);
                    } catch (e) {
                        // Ignore close errors
                    }
                });

                // Clean up the lock file we created
                try {
                    if (fs.existsSync(lockFilePath)) {
                        if (process.platform === 'win32') {
                            execSync(`attrib -h -r "${lockFilePath}"`);
                        }
                        fs.unlinkSync(lockFilePath);
                    }
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }

                console.warn(`⚠️  Cannot lock files in: ${buildPath} - ${lockError.message}`);
                return false;
            }

        } catch (error) {
            // Catch any unexpected errors
            console.warn(`⚠️  Unexpected error protecting build ${buildPath}:`, error.message);
            return false;
        }
    }

    /**
     * Unprotect a Unity build folder
     * @param {string} buildPath - Path to the Unity build folder
     */
    unprotectBuild(buildPath) {
        try {
            const protection = this.protectedBuilds.get(buildPath);

            if (!protection) {
                // console.log(`Build not protected: ${buildPath}`);
                return true;
            }

            // Close all file handles
            protection.handles.forEach(fh => {
                try {
                    fs.closeSync(fh.handle);
                    // console.log(`Closed handle for: ${fh.path}`);
                } catch (error) {
                    console.error(`Error closing handle for ${fh.path}:`, error);
                }
            });

            // Remove lock file
            try {
                if (fs.existsSync(protection.lockFilePath)) {
                    // Remove read-only attribute first
                    if (process.platform === 'win32') {
                        execSync(`attrib -h -r "${protection.lockFilePath}"`);
                    }
                    fs.unlinkSync(protection.lockFilePath);
                    // console.log(`Removed lock file: ${protection.lockFilePath}`);
                }
            } catch (error) {
                console.error(`Error removing lock file:`, error);
            }

            // Remove from protected builds
            this.protectedBuilds.delete(buildPath);

            // console.log(`✅ Unprotected build: ${buildPath}`);
            return true;

        } catch (error) {
            console.error(`Error unprotecting build ${buildPath}:`, error);
            return false;
        }
    }

    /**
     * Load and protect all builds from database
     */
    async loadAndProtectAllBuilds() {
        try {
            console.log('🔒 Loading Unity builds from database...');

            // Get all builds from database
            const builds = await unityBuildModel.getAllBuilds();

            if (builds.length === 0) {
                console.log('   No Unity builds found in database.');
                return;
            }

            console.log(`   Found ${builds.length} build(s) to protect`);

            let successCount = 0;
            let failCount = 0;

            for (const build of builds) {
                const success = await this.protectBuild(build.build_path, build.class_id, build.build_type);
                if (success) {
                    successCount++;
                    console.log(`   ✅ Protected: ${build.build_path}`);
                } else {
                    failCount++;
                }
            }

            // Summary
            if (failCount === 0) {
                console.log(`✅ All ${successCount} build(s) protected successfully`);
            } else {
                console.log(`⚠️  Build protection summary: ${successCount} succeeded, ${failCount} failed`);
                console.log(`   Failed builds will not be protected from deletion.`);
            }

        } catch (error) {
            console.error('❌ Error loading and protecting builds:', error.message);
        }
    }

    /**
     * Unprotect all builds (for shutdown)
     */
    unprotectAllBuilds() {
        // console.log('Unprotecting all builds...');

        for (const buildPath of this.protectedBuilds.keys()) {
            this.unprotectBuild(buildPath);
        }

        // console.log('✅ All builds unprotected');
    }

    /**
     * Get protection status
     */
    getProtectionStatus() {
        const status = [];
        for (const [buildPath, protection] of this.protectedBuilds.entries()) {
            status.push({
                path: buildPath,
                class_id: protection.classId,
                build_type: protection.buildType,
                locked_files: protection.handles.length
            });
        }
        return status;
    }
}

// Create singleton instance
const buildProtector = new UnityBuildProtector();

// Graceful shutdown handlers
process.on('SIGINT', () => {
    // console.log('\nReceived SIGINT, unprotecting builds...');
    buildProtector.unprotectAllBuilds();
    process.exit(0);
});

process.on('SIGTERM', () => {
    // console.log('\nReceived SIGTERM, unprotecting builds...');
    buildProtector.unprotectAllBuilds();
    process.exit(0);
});

process.on('SIGUSR2', () => {
    // console.log('\nReceived SIGUSR2 (nodemon restart), unprotecting builds...');
    buildProtector.unprotectAllBuilds();
    process.exit(0);
});

process.on('exit', () => {
    // console.log('Process exiting, unprotecting builds...');
    buildProtector.unprotectAllBuilds();
});

module.exports = buildProtector;
