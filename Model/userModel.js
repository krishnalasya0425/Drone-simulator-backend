const pool = require('../config/db');

const UserModel = {
  
  // Create a new user
  async createUser(data) {
    const { name, regiment, batch_no, army_id, role, password } = data;
    const [result] = await pool.query(
      `INSERT INTO users (name, regiment, batch_no, army_id, role, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, regiment, batch_no, army_id, role, password]
    );
    return result.insertId;
  },

  // Select all users
  async getAll() {
    const [rows] = await pool.query(
      `SELECT id, name, regiment, batch_no, army_id, role, status FROM users`
    );
    return rows;
  },

  
  // Update user fields
  async updateUser(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map(k => `${k} = ?`).join(', ');

    values.push(id);

    await pool.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );
  },

  // Delete User
  async deleteUser(id) {
    await pool.query(
      `DELETE FROM users WHERE id = ?`,
      [id]
    );
  },

  // Get users by role
  async getByRole(role) {
    const [rows] = await pool.query(
      `SELECT id, name FROM users WHERE role = ?`,
      [role]
    );
    return rows;
  },

  // Get users by Batch Number
  async getByBatch(classes) {
    const [rows] = await pool.query(
      `SELECT id, name, army_id, batch_no FROM users WHERE classes = ?`,
      [classes]
    );
    return rows;
  },

  // Update status
  async updateStatus(id, status, classes) {
    await pool.query(
      `UPDATE users SET status = ? classes =?  WHERE id = ?`,
      [status,classes, id]
    );
  }};

module.exports = UserModel;
