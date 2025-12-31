
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
      `SELECT u.id, u.name, u.regiment, u.batch_no, u.army_id, u.role, u.status,
       GROUP_CONCAT(DISTINCT c.id) as class_ids,
       GROUP_CONCAT(DISTINCT c.class_name SEPARATOR ', ') as class_names
       FROM users u
       LEFT JOIN assigned_classes ac ON u.id = ac.student_id
       LEFT JOIN classes c ON ac.class_id = c.id
       GROUP BY u.id`
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
    const allowedColumns = ['name', 'regiment', 'batch_no', 'army_id', 'role', 'status', 'password'];
    const filteredFields = {};

    for (const key of Object.keys(fields)) {
      if (allowedColumns.includes(key)) {
        filteredFields[key] = fields[key];
      }
    }

    const keys = Object.keys(filteredFields);

    // Nothing to update
    if (keys.length === 0) return;

    const values = Object.values(filteredFields);
    const setClause = keys.map(k => `${k} = ?`).join(", ");

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
      o.expires_at,
      GROUP_CONCAT(DISTINCT c.id) as class_ids,
      GROUP_CONCAT(DISTINCT c.class_name SEPARATOR ', ') as class_names
    FROM users u
    LEFT JOIN otp_verifications o 
      ON u.id = o.user_id
      AND o.id = (
          SELECT id FROM otp_verifications
          WHERE user_id = u.id
          ORDER BY created_at DESC
          LIMIT 1
      )
    LEFT JOIN assigned_classes ac ON u.id = ac.student_id
    LEFT JOIN classes c ON ac.class_id = c.id
    WHERE u.role = ?
    GROUP BY u.id, o.otp, o.expires_at;
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
  async updateStatus(id, status) {
    await pool.query(
      `UPDATE users SET status = ? WHERE id = ?`,
      [status, id]
    );
  }
};

module.exports = UserModel;