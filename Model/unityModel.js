const pool = require("../config/db");

const UnityModel = {

  // Create unity build entry
  async createBuild(data) {
    const { build_name, zip_path, batch_no, drive_letter } = data;

    const [result] = await pool.query(
      `
      INSERT INTO unity_builds 
      (build_name, zip_path, batch_no, drive_letter)
      VALUES (?, ?, ?, ?)
      `,
      [build_name, zip_path, batch_no, drive_letter]
    );

    return result.insertId;
  },

  // Get all unity builds
  async getAll() {
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        build_name,
        batch_no,
        zip_path,
        drive_letter,
        created_at
      FROM unity_builds
      ORDER BY created_at DESC
      `
    );
    return rows;
  },

  // Get builds by batch
  async getByBatch(batch_no) {
    const [rows] = await pool.query(
      `
      SELECT id, build_name, zip_path
      FROM unity_builds
      WHERE batch_no = ?
      `,
      [batch_no]
    );
    return rows;
  },

  // Get single build
  async getById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM unity_builds WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  // Delete unity build (ONLY via website)
  async deleteBuild(id) {
    const [rows] = await pool.query(
      `SELECT zip_path FROM unity_builds WHERE id = ?`,
      [id]
    );

    if (!rows.length) return;

    const fs = require("fs");

    // Remove write protection before deleting
    fs.chmodSync(rows[0].zip_path, 0o666);
    fs.unlinkSync(rows[0].zip_path);

    await pool.query(
      `DELETE FROM unity_builds WHERE id = ?`,
      [id]
    );
  }
};

module.exports = UnityModel;
