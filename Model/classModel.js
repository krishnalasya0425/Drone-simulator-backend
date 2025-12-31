
const pool = require("../config/db");

const classModel = {
  async getClassInfo(id) {
    const query = `
    SELECT 
      c.id,
      c.class_name,
      c.created_at,
      u.id AS creator_id,
      u.name AS created_by
    FROM classes c
    JOIN users u ON c.created_by = u.id
    WHERE c.id = ?;
  `;

    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  async createClass(className, createdBy) {
    const query = `INSERT INTO classes (class_name, created_by) VALUES (?, ?)`;
    const values = [className, createdBy];
    const [result] = await pool.query(query, values);
    return result.insertId;
  },

  async updateClass(className, classId) {
    const query = `UPDATE classes SET class_name = ? WHERE id = ?`;
    const values = [className, classId];
    await pool.query(query, values);
  },

  async getClassesFiltered(instructorId) {
    let query = `
    SELECT c.id, c.class_name
    FROM classes c
    JOIN users u ON c.created_by = u.id
  `;

    const params = [];

    if (instructorId) {
      query += ` WHERE c.created_by = ?`;
      params.push(instructorId);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async deleteClass(classId) {
    const query = `DELETE FROM classes WHERE id = ?`;
    const values = [classId];
    await pool.query(query, values);
  },

  async getClassesByStudent(studentId) {
    const query = `
      SELECT 
        c.id,
        c.class_name
      FROM assigned_classes ac
      JOIN classes c ON ac.class_id = c.id
      JOIN users u ON ac.student_id = u.id
      WHERE ac.student_id = ?;
    `;

    const [rows] = await pool.query(query, [studentId]);
    return rows;
  },

  async getStudentsByClass(classId) {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.army_id,
        u.batch_no,
        u.regiment
      FROM assigned_classes ac
      JOIN users u ON ac.student_id = u.id
      WHERE ac.class_id = ?;
    `;
    const [rows] = await pool.query(query, [classId]);
    return rows;
  },

  async assignStudentToClass(studentId, classId) {
    const query = `
      INSERT INTO assigned_classes (student_id, class_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP
    `;
    await pool.query(query, [studentId, classId]);
  },

  async removeStudentsFromClass(studentIds, classId) {
    const query = `
      DELETE FROM assigned_classes 
      WHERE class_id = ? AND student_id IN (?)
    `;
    await pool.query(query, [classId, studentIds]);
  }
};

const docsModel = {
  async uploadDoc(class_id, title, file_data, file_type) {
    await pool.query(
      `INSERT INTO docs (class_id, doc_title, file_data, file_type)
       VALUES (?, ?, ?, ?)`,
      [class_id, title, file_data, file_type]
    );
  },

  async getDocsList(class_id) {
    const [rows] = await pool.query(
      `SELECT id, doc_title, file_type FROM docs WHERE class_id = ?`,
      [class_id]
    );
    return rows; // no file_data → prevents corruption
  },

  async getDocById(id) {
    const [rows] = await pool.query(`SELECT * FROM docs WHERE id = ?`, [id]);
    return rows[0];
  },

  async deleteDoc(id) {
    return pool.query(`DELETE FROM docs WHERE id = ?`, [id]);
  },

  async updateDoc(id, doc_title) {
    const query = `UPDATE classes SET doc_title = ? WHERE id = ?`;
    const values = [doc_title, id];
    await pool.query(query, values);
  },




};

module.exports = { classModel, docsModel };