const pool = require('../config/db'); // mysql2 pool
const Subtopic = require('../Model/subtopicrModels');

const CompletionProgress = {
  async findByUserAndClass(user_id, class_id) {
    const [rows] = await pool.query(
      `SELECT * FROM student_progress WHERE user_id = ? AND class_id = ?`,
      [user_id, class_id]
    );
    return rows[0];
  },

  async create(user_id, class_id, completed_subtopics = []) {
    const [result] = await pool.query(
      `INSERT INTO student_progress (user_id, class_id, completed_subtopics)
       VALUES (?, ?, ?)`,
      [user_id, class_id, JSON.stringify(completed_subtopics)]
    );
    return this.findByUserAndClass(user_id, class_id);
  },

  async updateCompletedSubtopics(user_id, class_id, completed_subtopics) {
    await pool.query(
      `UPDATE student_progress SET completed_subtopics = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND class_id = ?`,
      [JSON.stringify(completed_subtopics), user_id, class_id]
    );
    return this.findByUserAndClass(user_id, class_id);
  },

  async deleteById(id) {
    const [result] = await pool.query(`DELETE FROM student_progress WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },

  async deleteByUserAndClass(user_id, class_id) {
    const [result] = await pool.query(
      `DELETE FROM student_progress WHERE user_id = ? AND class_id = ?`,
      [user_id, class_id]
    );
    return result.affectedRows > 0;
  },

  async findAllByUser(user_id) {
    const [rows] = await pool.query(`SELECT * FROM student_progress WHERE user_id = ?`, [user_id]);
    return rows;
  },
};

module.exports = CompletionProgress;
