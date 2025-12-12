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

  async getByArmyId(armyId) {
  const [rows] = await pool.query(
    `SELECT id, name 
     FROM users 
     WHERE army_id = ?`,
    [armyId]
  );
    return rows[0];
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
    `
    SELECT 
      u.id,
      u.name,
      u.regiment,
      u.batch_no,
      u.army_id,
      u.role,
      u.status,
      o.otp,
      o.expires_at
    FROM users u
    LEFT JOIN otp_verifications o 
      ON u.id = o.user_id
      AND o.id = (
          SELECT id FROM otp_verifications
          WHERE user_id = u.id
          ORDER BY created_at DESC
          LIMIT 1
      )
    WHERE u.role = ?;
    `,
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
