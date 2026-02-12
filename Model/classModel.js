

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

  async createClass(classNameOrObj, createdBy, instructorIds = null) {
    // Support both calling styles:
    // 1. createClass({ class_name, created_by, instructor_ids }) - object destructuring
    // 2. createClass(className, createdBy, instructorIds) - traditional parameters
    let className, adminId, assignedInstructorIds;

    if (typeof classNameOrObj === 'object' && classNameOrObj !== null) {
      // Object destructuring style
      className = classNameOrObj.class_name;
      adminId = classNameOrObj.created_by;
      assignedInstructorIds = classNameOrObj.instructor_ids || null;
    } else {
      // Traditional parameters style
      className = classNameOrObj;
      adminId = createdBy;
      assignedInstructorIds = instructorIds;
    }

    // Check for duplicate class name
    const [existing] = await pool.query(
      'SELECT id FROM classes WHERE class_name = ?',
      [className]
    );

    if (existing.length > 0) {
      throw new Error('A class with this name already exists');
    }

    // Create the class (keeping instructor_id for backward compatibility, set to first instructor if provided)
    const firstInstructorId = Array.isArray(assignedInstructorIds) && assignedInstructorIds.length > 0
      ? assignedInstructorIds[0]
      : assignedInstructorIds;

    const query = `INSERT INTO classes (class_name, created_by, instructor_id) VALUES (?, ?, ?)`;
    const [result] = await pool.query(query, [className, adminId, firstInstructorId]);
    const classId = result.insertId;

    // If instructor IDs are provided, add them to class_instructors table
    if (assignedInstructorIds) {
      const instructorArray = Array.isArray(assignedInstructorIds) ? assignedInstructorIds : [assignedInstructorIds];
      for (const instructorId of instructorArray) {
        if (instructorId) {
          await this.assignInstructorToClass(instructorId, classId);
        }
      }
    }

    return classId;
  },

  async updateClass(className, classId) {
    const query = `UPDATE classes SET class_name = ? WHERE id = ?`;
    const values = [className, classId];
    await pool.query(query, values);
  },

  async getClassesFiltered(instructorId) {
    let query = `
    SELECT DISTINCT
      c.id, 
      c.class_name,
      c.instructor_id,
      u.name AS created_by
    FROM classes c
    JOIN users u ON c.created_by = u.id
    LEFT JOIN class_instructors ci ON c.id = ci.class_id
  `;

    const params = [];

    if (instructorId) {
      query += ` WHERE ci.instructor_id = ? OR c.instructor_id = ?`;
      params.push(instructorId, instructorId);
    }

    const [rows] = await pool.query(query, params);

    // Fetch instructors for each class
    for (let row of rows) {
      const instructors = await this.getInstructorsByClass(row.id);
      row.instructors = instructors;
      row.instructor_names = instructors.map(i => i.name).join(', ');
    }

    return rows;
  },

  async getAllClasses() {
    const query = `
      SELECT 
        c.id, 
        c.class_name,
        c.instructor_id,
        u.name AS created_by
      FROM classes c
      JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `;
    const [rows] = await pool.query(query);

    // Fetch instructors for each class
    for (let row of rows) {
      const instructors = await this.getInstructorsByClass(row.id);
      row.instructors = instructors;
      row.instructor_names = instructors.map(i => i.name).join(', ');
    }

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
        u.\`rank\`,
        u.army_no,
        u.course_no,
        u.unit
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
  },

  // Multiple Instructors Support
  async assignInstructorToClass(instructorId, classId) {
    const query = `
      INSERT INTO class_instructors (instructor_id, class_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP
    `;
    await pool.query(query, [instructorId, classId]);
  },

  async removeInstructorFromClass(instructorId, classId) {
    const query = `
      DELETE FROM class_instructors 
      WHERE class_id = ? AND instructor_id = ?
    `;
    await pool.query(query, [classId, instructorId]);
  },

  async getInstructorsByClass(classId) {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.rank,
        ci.assigned_at
      FROM class_instructors ci
      JOIN users u ON ci.instructor_id = u.id
      WHERE ci.class_id = ?
      ORDER BY ci.assigned_at ASC
    `;
    const [rows] = await pool.query(query, [classId]);
    return rows;
  },

  async updateClassInstructors(classId, instructorIds) {
    // Remove all existing instructors
    await pool.query('DELETE FROM class_instructors WHERE class_id = ?', [classId]);

    // Add new instructors
    if (instructorIds && instructorIds.length > 0) {
      for (const instructorId of instructorIds) {
        await this.assignInstructorToClass(instructorId, classId);
      }

      // Update the main instructor_id field for backward compatibility
      await pool.query(
        'UPDATE classes SET instructor_id = ? WHERE id = ?',
        [instructorIds[0], classId]
      );
    } else {
      // If no instructors, set instructor_id to NULL
      await pool.query(
        'UPDATE classes SET instructor_id = NULL WHERE id = ?',
        [classId]
      );
    }
  }
};

const docsModel = {
  async uploadDoc(class_id, title, file_data, file_type, file_path = null, total_pages = null) {
    await pool.query(
      `INSERT INTO docs (class_id, doc_title, file_data, file_type, file_path, total_pages)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [class_id, title, file_data, file_type, file_path, total_pages]
    );
  },

  async getDocsList(class_id) {
    const [rows] = await pool.query(
      `SELECT id, doc_title, file_type, file_path, total_pages FROM docs WHERE class_id = ?`,
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