const unityBuildModel = require('../Model/unityBuildModel');
const buildProtector = require('../Services/unityBuildProtector');
const fs = require('fs');
const path = require('path');

// Helper function to recursively delete directory
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Recursive call
                deleteFolderRecursive(curPath);
            } else {
                // Delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

// Helper function to validate Unity build structure
function validateUnityBuild(buildPath) {
    try {
        if (!fs.existsSync(buildPath)) {
            return {
                valid: false,
                message: 'Build path does not exist on the server'
            };
        }

        const files = fs.readdirSync(buildPath);

        // Check for .exe file
        const exeFile = files.find(f => f.endsWith('.exe'));
        if (!exeFile) {
            return {
                valid: false,
                message: 'No .exe file found in the build folder'
            };
        }

        const exeName = exeFile.replace('.exe', '');

        // Required Unity build files/folders
        const requiredItems = [
            { name: `${exeName}_Data`, type: 'folder', description: 'Game data folder' },
            { name: 'UnityPlayer.dll', type: 'file', description: 'Unity Player library' }
        ];

        // Optional but common files
        const optionalItems = [
            { name: 'UnityCrashHandler64.exe', type: 'file', description: 'Crash handler' },
            { name: 'MonoBleedingEdge', type: 'folder', description: 'Mono runtime' }
        ];

        const missingRequired = [];
        const foundItems = [];

        // Check required items
        for (const item of requiredItems) {
            const itemPath = path.join(buildPath, item.name);
            const exists = fs.existsSync(itemPath);

            if (!exists) {
                missingRequired.push(`${item.name} (${item.description})`);
            } else {
                // Verify type
                const stats = fs.statSync(itemPath);
                const isCorrectType = item.type === 'folder' ? stats.isDirectory() : stats.isFile();

                if (!isCorrectType) {
                    missingRequired.push(`${item.name} (expected ${item.type}, found ${stats.isDirectory() ? 'folder' : 'file'})`);
                } else {
                    foundItems.push(item.name);
                }
            }
        }

        // Check optional items
        for (const item of optionalItems) {
            const itemPath = path.join(buildPath, item.name);
            if (fs.existsSync(itemPath)) {
                foundItems.push(item.name);
            }
        }

        if (missingRequired.length > 0) {
            return {
                valid: false,
                message: 'Invalid Unity build structure. Missing required files/folders',
                missing: missingRequired,
                found: foundItems,
                exeName
            };
        }

        return {
            valid: true,
            message: 'Valid Unity build detected',
            exeName,
            found: foundItems
        };
    } catch (error) {
        return {
            valid: false,
            message: `Error validating build: ${error.message}`
        };
    }
}

const unityBuildController = {
    // Add or update a Unity build path
    async upsertBuild(req, res) {
        try {
            const { class_id, build_type, build_path, build_name } = req.body;
            const uploaded_by = req.user?.id || req.body.uploaded_by;

            // Validate required fields
            if (!class_id || !build_type || !build_path) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: class_id, build_type, and build_path are required'
                });
            }

            // Validate build_type
            if (!['practice', 'exercise'].includes(build_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid build_type. Must be either "practice" or "exercise"'
                });
            }

            // Validate Unity build structure
            const validation = validateUnityBuild(build_path);

            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message,
                    missing: validation.missing,
                    found: validation.found,
                    details: 'A valid Unity build must contain:\n• .exe file (main executable)\n• [GameName]_Data folder (game assets and data)\n• UnityPlayer.dll (Unity runtime library)'
                });
            }

            await unityBuildModel.upsertBuild(
                class_id,
                build_type,
                build_path,
                build_name || validation.exeName,
                uploaded_by
            );

            // Protect the build files from direct deletion
            await buildProtector.protectBuild(build_path, class_id, build_type);

            res.status(200).json({
                success: true,
                message: `${build_type} build path saved successfully`,
                build_name: build_name || validation.exeName,
                validation: {
                    found: validation.found
                }
            });
        } catch (error) {
            console.error('Error upserting Unity build:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save build path',
                error: error.message
            });
        }
    },

    // Get build by class and type
    async getBuildByClassAndType(req, res) {
        try {
            const { class_id, build_type } = req.params;

            if (!class_id || !build_type) {
                return res.status(400).json({
                    success: false,
                    message: 'class_id and build_type are required'
                });
            }

            const build = await unityBuildModel.getBuildByClassAndType(class_id, build_type);

            if (!build) {
                return res.status(404).json({
                    success: false,
                    message: `No ${build_type} build found for this class`
                });
            }

            res.status(200).json({
                success: true,
                build
            });
        } catch (error) {
            console.error('Error fetching Unity build:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch build',
                error: error.message
            });
        }
    },

    // Get all builds for a class
    async getBuildsByClass(req, res) {
        try {
            const { class_id } = req.params;

            if (!class_id) {
                return res.status(400).json({
                    success: false,
                    message: 'class_id is required'
                });
            }

            const builds = await unityBuildModel.getBuildsByClass(class_id);

            res.status(200).json({
                success: true,
                builds
            });
        } catch (error) {
            console.error('Error fetching Unity builds:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch builds',
                error: error.message
            });
        }
    },

    // Delete a build (including actual files)
    async deleteBuild(req, res) {
        try {
            const { class_id, build_type } = req.params;
            const { delete_files } = req.query; // Optional query param to actually delete files

            if (!class_id || !build_type) {
                return res.status(400).json({
                    success: false,
                    message: 'class_id and build_type are required'
                });
            }

            // Get build info before deleting
            const build = await unityBuildModel.getBuildByClassAndType(class_id, build_type);

            if (!build) {
                return res.status(404).json({
                    success: false,
                    message: `No ${build_type} build found for this class`
                });
            }

            const buildPath = build.build_path;
            let filesDeleted = false;
            let deletionError = null;

            // Unprotect the build first
            buildProtector.unprotectBuild(buildPath);

            // If delete_files flag is set, actually delete the build files
            if (delete_files === 'true') {
                try {
                    if (fs.existsSync(buildPath)) {
                        console.log(`Deleting build files at: ${buildPath}`);
                        deleteFolderRecursive(buildPath);
                        filesDeleted = true;
                        console.log(`Successfully deleted build files at: ${buildPath}`);
                    } else {
                        deletionError = 'Build folder no longer exists on disk';
                    }
                } catch (fileError) {
                    console.error('Error deleting build files:', fileError);
                    deletionError = `Failed to delete build files: ${fileError.message}`;
                    // Continue with database deletion even if file deletion fails
                }
            }

            // Delete from database
            await unityBuildModel.deleteBuild(class_id, build_type);

            res.status(200).json({
                success: true,
                message: `${build_type} build configuration deleted successfully`,
                build_path: buildPath,
                build_name: build.build_name,
                files_deleted: filesDeleted,
                deletion_error: deletionError
            });
        } catch (error) {
            console.error('Error deleting Unity build:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete build',
                error: error.message
            });
        }
    }
};

module.exports = unityBuildController;
