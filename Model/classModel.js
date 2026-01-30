

const pool = require("../config/db");

const classModel = {
  async getClassInfo(id) {
    const query = `
    SELECT 
      c.id,
      c.class_name,
      c.created_at,
      c.instructor_id,
      u.id AS creator_id,
      u.name AS created_by,
      i.id AS instructor_id,
      i.name AS instructor_name
    FROM classes c
    JOIN users u ON c.created_by = u.id
    LEFT JOIN users i ON c.instructor_id = i.id
    WHERE c.id = ?;
  `;

    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

  async createClass(classNameOrObj, createdBy, instructorId = null) {
    // Support both calling styles:
    // 1. createClass({ class_name, created_by, instructor_id }) - object destructuring
    // 2. createClass(className, createdBy, instructorId) - traditional parameters
    let className, adminId, assignedInstructorId;

    if (typeof classNameOrObj === 'object' && classNameOrObj !== null) {
      // Object destructuring style
      className = classNameOrObj.class_name;
      adminId = classNameOrObj.created_by;
      assignedInstructorId = classNameOrObj.instructor_id || null;
    } else {
      // Traditional parameters style
      className = classNameOrObj;
      adminId = createdBy;
      assignedInstructorId = instructorId;
    }

    // Check for duplicate class name
    const [existing] = await pool.query(
      'SELECT id FROM classes WHERE class_name = ?',
      [className]
    );

    if (existing.length > 0) {
      throw new Error('A class with this name already exists');
    }

    const query = `INSERT INTO classes (class_name, created_by, instructor_id) VALUES (?, ?, ?)`;
    const [result] = await pool.query(query, [className, adminId, assignedInstructorId]);
    return result.insertId;
  },

  async updateClass(className, classId) {
    const query = `UPDATE classes SET class_name = ? WHERE id = ?`;
    const values = [className, classId];
    await pool.query(query, values);
  },

  async getClassesFiltered(instructorId) {
    let query = `
    SELECT 
      c.id, 
      c.class_name,
      c.instructor_id,
      u.name AS created_by,
      i.name AS instructor_name
    FROM classes c
    JOIN users u ON c.created_by = u.id
    LEFT JOIN users i ON c.instructor_id = i.id
  `;

    const params = [];

    if (instructorId) {
      query += ` WHERE c.instructor_id = ?`;
      params.push(instructorId);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async getAllClasses() {
    const query = `
      SELECT 
        c.id, 
        c.class_name,
        c.instructor_id,
        u.name AS created_by,
        i.name AS instructor_name
      FROM classes c
      JOIN users u ON c.created_by = u.id
      LEFT JOIN users i ON c.instructor_id = i.id
      ORDER BY c.created_at DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  },

  async updateClassInstructor(classId, instructorId) {
    const query = `UPDATE classes SET instructor_id = ? WHERE id = ?`;
    await pool.query(query, [instructorId, classId]);
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
        c.class_name,
        c.instructor_id
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
  async uploadDoc(class_id, title, file_data, file_type, file_path = null) {
    await pool.query(
      `INSERT INTO docs (class_id, doc_title, file_data, file_type, file_path)
       VALUES (?, ?, ?, ?, ?)`,
      [class_id, title, file_data, file_type, file_path]
    );
  },

  async getDocsList(class_id) {
    const [rows] = await pool.query(
      `SELECT id, doc_title, file_type, file_path FROM docs WHERE class_id = ?`,
      [class_id]
    );
    return rows;
  },

  async getDocById(id) {
    const [rows] = await pool.query(`SELECT * FROM docs WHERE id = ?`, [id]);
    return rows[0];
  },

  async deleteDoc(id) {
    // Also consider deleting the physical file if file_path exists
    const [docRows] = await pool.query(`SELECT file_path FROM docs WHERE id = ?`, [id]);
    if (docRows && docRows[0] && docRows[0].file_path) {
      const fs = require('fs');
      if (fs.existsSync(docRows[0].file_path)) {
        fs.unlinkSync(docRows[0].file_path);
      }
    }
    return pool.query(`DELETE FROM docs WHERE id = ?`, [id]);
  },

  async updateDoc(id, doc_title) {
    const query = `UPDATE docs SET doc_title = ? WHERE id = ?`;
    const values = [doc_title, id];
    await pool.query(query, values);
  },
};

module.exports = { classModel, docsModel };