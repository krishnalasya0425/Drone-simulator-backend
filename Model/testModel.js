const pool = require("../config/db");

const testModel = {

  async getTestsInfo(id) {
    const query = `
    SELECT 
      t.id,
      t.title,
      t.created_at,
      u.id AS creator_id,
      u.name AS created_by
    FROM tests t
    JOIN users u ON t.created_by = u.id
    WHERE t.id = ?;
  `;

    const [rows] = await pool.query(query, [id]);
    return rows[0];
  },

async getTestScoreInfo(testId) {
  const query = `
    SELECT
      t.id AS test_id,
      t.title AS test_title,
      c.class_name,

      u.id AS student_id,
      u.name AS student_name,
      u.regiment,
      u.batch_no,
      u.army_id,

      ts.score,
      ts.total_questions

    FROM tests t
    JOIN classes c 
      ON t.class_id = c.id

    JOIN users u 
      ON u.role = 'Student'

    LEFT JOIN test_scores ts
      ON ts.test_id = t.id
      AND ts.student_id = u.id

    WHERE t.id = ?;
  `;

  const [rows] = await pool.query(query, [testId]);

  if (rows.length === 0) return null;

  return {
    test_id: rows[0].test_id,
    test_title: rows[0].test_title,
    class_name: rows[0].class_name,
    students: rows.map(r => ({
      student_id: r.student_id,
      name: r.student_name,
      regiment: r.regiment,
      batch_no: r.batch_no,
      army_id: r.army_id,
      score: r.score,
      total_questions: r.total_questions
    }))
  };
},


  async updatTest(testName, testId) {
    const query = `UPDATE tests SET title = ? WHERE id = ?`;
    const values = [testName, testId];
    await pool.query(query, values);
  },

  async getTestsFiltered(instructorId) {
    let query = `
    SELECT t.id, t.title
    FROM tests t
    JOIN users u ON t.created_by = u.id
  `;

    const params = [];

    if (instructorId) {
      query += ` WHERE t.created_by = ?`;
      params.push(instructorId);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  async deleteTest(testId) {
    const query = `DELETE FROM tests WHERE id = ?`;
    const values = [testId];
    await pool.query(query, values);
  },

// async getTestsByStudent(studentId) {
//   try {
//     const query = `
//       SELECT DISTINCT
//         t.id,
//         t.title
//       FROM assigned_classes ac
//       JOIN tests t
//         ON ac.class_id = t.class_id
//       WHERE ac.student_id = ?;
//     `;

//     const [rows] = await pool.query(query, [studentId]);
//     return rows;
//   } catch (err) {
//     console.error('Error fetching tests for student:', err);
//     throw err;
//   }
// },

async getTestsByStudent(studentId) {
  try {
    const query = `
      SELECT
        t.id , 
        t.title,
        ts.score,
        ts.total_questions
      FROM assigned_classes ac
     JOIN tests t
        ON ac.class_id = t.class_id
      LEFT JOIN test_scores ts
        ON ts.test_id = t.id
       AND ts.student_id = ac.student_id
      WHERE ac.student_id = ?;
    `;

    const [rows] = await pool.query(query, [studentId]);
    return rows;
  } catch (err) {
    console.error('Error fetching student tests with scores:', err);
    throw err;
  }
},


  async createTest(title, ID, classId) {
    try {
      const insertQuery = "INSERT INTO tests (title,created_by, class_id) VALUES (?,?,?)";
      const [insertResult] = await pool.query(insertQuery, [title, ID, classId]);

      // Return only ID
      return insertResult.insertId;
    } catch (err) {
      console.error("Error creating test:", err);
      throw err;
    }
  },

  async getTestById(testId) {
    const query = "SELECT * FROM tests WHERE id = $1";
    const values = [testId];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  async addQuestionsToTest(testId, questions) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const q of questions) {
        const [questionRes] = await conn.query(
          `INSERT INTO test_questions 
                 (test_id, question_text, question_type, answer)
                 VALUES (?, ?, ?, ?)`,
          [testId, q.question_text, q.type, q.answer]
        );

        const questionId = questionRes.insertId;

        if (q.options?.length) {
          for (const opt of q.options) {
            await conn.query(
              `INSERT INTO question_options 
                         (question_id, option_key, option_value)
                         VALUES (?, ?, ?)`,
              [questionId, opt.label, opt.text]
            );
          }
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getQuestionsByTestId(testId) {
    const sql = `
        SELECT 
            q.id AS question_id,
            q.question_text,
            q.question_type,
            q.answer,
            o.id AS option_id,
            o.option_key,
            o.option_value
        FROM test_questions q
        INNER JOIN tests t ON t.id = q.test_id
        LEFT JOIN question_options o ON o.question_id = q.id
        WHERE q.test_id = ?;
    `;

    const [rows] = await pool.query(sql, [testId]);

    // Group options into an array for each question
    const questionsMap = {};

    for (const row of rows) {
      const { question_id, question_text, question_type, answer } = row;

      if (!questionsMap[question_id]) {
        questionsMap[question_id] = {
          id: question_id,
          question_text,
          question_type,
          answer,
          options: [],
        };
      }

      if (row.option_id) {
        questionsMap[question_id].options.push({
          option_id: row.option_id,
          key: row.option_key,
          value: row.option_value,
        });
      }
    }

    return Object.values(questionsMap);
  },

  async getTestAnswers(testId) {
    const sql = `
        SELECT 
            q.id AS question_id,
            q.question_text,
            q.question_type,
            q.answer
        FROM test_questions q
        INNER JOIN tests t ON t.id = q.test_id
        WHERE q.test_id = ?;
    `;

    const [rows] = await pool.query(sql, [testId]);
    return rows;
  },
};

module.exports = testModel;
