

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
            if (!fs.existsSync(buildPath)) {
                // console.log(`Build path does not exist: ${buildPath}`);
                return false;
            }

            // Find the .exe file
            const files = fs.readdirSync(buildPath);
            const exeFile = files.find(f => f.endsWith('.exe'));

            if (!exeFile) {
                // console.log(`No .exe file found in: ${buildPath}`);
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

            // Write lock file
            fs.writeFileSync(lockFilePath, JSON.stringify(lockInfo, null, 2));

            // Make lock file hidden and read-only
            if (process.platform === 'win32') {
                exec(`attrib +h +r "${lockFilePath}"`, (error) => {
                    if (error) {
                        console.error('Error setting file attributes:', error);
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
                throw lockError;
            }

        } catch (error) {
            console.error(`Error protecting build ${buildPath}:`, error);
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
            // console.log('Loading all Unity builds from database...');

            // Get all builds from database
            const builds = await unityBuildModel.getAllBuilds();

            // console.log(`Found ${builds.length} builds to protect`);

            for (const build of builds) {
                await this.protectBuild(build.build_path, build.class_id, build.build_type);
            }

            // console.log('✅ All builds protected');

        } catch (error) {
            console.error('Error loading and protecting builds:', error);
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
