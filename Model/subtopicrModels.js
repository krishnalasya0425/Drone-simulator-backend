const pool = require("../config/db");

const Subtopic = {
  // Create a new subtopic
  async create(class_id, subtopic_name, parent_id = null) {
    const [result] = await pool.query(
      `INSERT INTO subtopics (class_id, subtopic_name, parent_id)
       VALUES (?, ?, ?)`,
      [class_id, subtopic_name, parent_id]
    );

    return {
      id: result.insertId,
      class_id,
      subtopic_name,
      parent_id
    };
  },

  async findByClassAndName(class_id, subtopic_name, parent_id = null) {
    const [rows] = await pool.query(
      `SELECT * FROM subtopics
       WHERE class_id = ? AND subtopic_name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))
       LIMIT 1`,
      [class_id, subtopic_name, parent_id, parent_id]
    );
    return rows[0];
  },

  // Get all subtopics by class ID
  async findByClassId(classId) {
    const [rows] = await pool.query(
      `SELECT * FROM subtopics
       WHERE class_id = ?
       ORDER BY parent_id ASC, id ASC`,
      [classId]
    );
    return rows;
  },

  // Get subtopic by ID
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM subtopics WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  // Update subtopic
  async update(id, subtopic_name) {
    const [result] = await pool.query(
      `UPDATE subtopics
       SET subtopic_name = ?
       WHERE id = ?`,
      [subtopic_name, id]
    );

    return result.affectedRows > 0;
  },

  // Delete subtopic
  async delete(id) {
    const [result] = await pool.query(
      `DELETE FROM subtopics WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  },

  async deleteByIds(ids) {
    const [result] = await pool.query(
      `DELETE FROM subtopics WHERE id IN (?)`,
      [ids]
    );
    return result.affectedRows;
  },

  async countByClass(classId) {
    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) AS total FROM subtopics WHERE class_id = ?',
        [classId]
      );
      return rows[0].total;
    } catch (error) {
      console.error('Error counting subtopics by class:', error);
      throw error;
    }
  }
};

module.exports = Subtopic;
