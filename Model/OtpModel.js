const pool = require("../config/db");

const OtpModel = {
  async createOtp(userId, otp) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const [result] = await pool.query(
      `INSERT INTO otp_verifications (user_id, otp, expires_at) VALUES (?, ?, ?)`,
      [userId, otp, expiresAt]
    );
    return result.insertId;
  },

  async getValidOtp(userId, otp) {
    const [rows] = await pool.query(
      `SELECT * FROM otp_verifications 
       WHERE user_id = ? AND otp = ? AND expires_at > NOW() AND used = FALSE`,
      [userId, otp]
    );
    return rows[0];
  },

  async markOtpUsed(id) {
    await pool.query(
      `UPDATE otp_verifications SET used = TRUE WHERE id = ?`,
      [id]
    );
  },

  async getOtpByUser(userId) {
    const [rows] = await pool.query(
      `SELECT * FROM otp_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0];
  }
};

module.exports = OtpModel;