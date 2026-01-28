const pool = require('../config/db');

const unityBuildModel = {
    // Add or update a Unity build path for a class
    async upsertBuild(classId, buildType, buildPath, buildName, uploadedBy) {
        const query = `
            INSERT INTO unity_builds (class_id, build_type, build_path, build_name, uploaded_by)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                build_path = VALUES(build_path),
                build_name = VALUES(build_name),
                uploaded_by = VALUES(uploaded_by),
                updated_at = CURRENT_TIMESTAMP
        `;

        const [result] = await pool.query(query, [classId, buildType, buildPath, buildName, uploadedBy]);
        return result;
    },

    // Get build path for a specific class and build type
    async getBuildByClassAndType(classId, buildType) {
        const query = `
            SELECT 
                id,
                class_id,
                build_type,
                build_path,
                build_name,
                uploaded_by,
                uploaded_at,
                updated_at
            FROM unity_builds
            WHERE class_id = ? AND build_type = ?
        `;

        const [rows] = await pool.query(query, [classId, buildType]);
        return rows[0] || null;
    },

    // Get all builds for a specific class
    async getBuildsByClass(classId) {
        const query = `
            SELECT 
                id,
                class_id,
                build_type,
                build_path,
                build_name,
                uploaded_by,
                uploaded_at,
                updated_at
            FROM unity_builds
            WHERE class_id = ?
        `;

        const [rows] = await pool.query(query, [classId]);
        return rows;
    },

    // Delete a build
    async deleteBuild(classId, buildType) {
        const query = `DELETE FROM unity_builds WHERE class_id = ? AND build_type = ?`;
        const [result] = await pool.query(query, [classId, buildType]);
        return result;
    },

    // Check if build exists
    async buildExists(classId, buildType) {
        const query = `SELECT COUNT(*) as count FROM unity_builds WHERE class_id = ? AND build_type = ?`;
        const [rows] = await pool.query(query, [classId, buildType]);
        return rows[0].count > 0;
    },

    // Get all builds (for file protection service)
    async getAllBuilds() {
        const query = `
            SELECT 
                id,
                class_id,
                build_type,
                build_path,
                build_name,
                uploaded_by,
                uploaded_at,
                updated_at
            FROM unity_builds
        `;

        const [rows] = await pool.query(query);
        return rows;
    }
};

module.exports = unityBuildModel;
