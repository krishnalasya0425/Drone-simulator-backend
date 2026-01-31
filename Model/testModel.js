

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
        u.unit,
        u.course_no,
        u.army_no,

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
        unit: r.unit,
        course_no: r.course_no,
        army_no: r.army_no,
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
    SELECT t.id, t.title, c.class_name
    FROM tests t
    JOIN users u ON t.created_by = u.id
    LEFT JOIN classes c ON t.class_id = c.id
  `;

    const params = [];

    if (instructorId) {
      query += ` WHERE c.instructor_id = ?`;
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

  async getTestsByStudent(studentId) {
    try {
      const query = `
        SELECT
          sts.id AS id,
          sts.id AS student_test_set_id,
          sts.assigned_at,
          sts.started_at,
          sts.submitted_at,
          sts.score,

          ts.id AS test_set_id,
          ts.set_name,
          ts.total_questions,
          ts.exam_type,
          ts.pass_threshold,
          ts.duration_minutes,
          ts.start_time,
          ts.end_time,
          ts.pass_threshold,

          t.id AS test_id,
          t.title AS test_title,
          c.id AS class_id,
          c.class_name,
          c.instructor_id

        FROM student_test_sets sts
        JOIN test_sets ts 
          ON sts.test_set_id = ts.id
        JOIN tests t 
          ON ts.test_id = t.id
        LEFT JOIN classes c
          ON t.class_id = c.id

        WHERE sts.student_id = ?;
      `;

      const [rows] = await pool.query(query, [studentId]);
      return rows;

    } catch (err) {
      console.error('Error fetching student tests:', err);
      throw err;
    }
  },

  async createTest(title, ID, classId, individualStudentId = null) {
    try {
      const insertQuery = "INSERT INTO tests (title, created_by, class_id, individual_student_id) VALUES (?,?,?,?)";
      const [insertResult] = await pool.query(insertQuery, [title, ID, classId, individualStudentId]);

      // Return only ID
      return insertResult.insertId;
    } catch (err) {
      console.error("Error creating test:", err);
      throw err;
    }
  },

  async getTestById(testId) {
    const query = "SELECT * FROM tests WHERE id = ?";
    const [rows] = await pool.query(query, [testId]);
    return rows[0];
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

  async getQuestionsByTestSetId(idOrStsId) {
    // 1️⃣ Resolve if it's a student_test_set_id
    const [[info]] = await pool.query(
      `SELECT ts.id AS test_set_id, ts.test_id 
       FROM student_test_sets sts 
       JOIN test_sets ts ON sts.test_set_id = ts.id 
       WHERE sts.id = ?`,
      [idOrStsId]
    );

    const testSetId = info ? info.test_set_id : idOrStsId;
    const testId = info ? info.test_id : idOrStsId;

    let sql = `
      SELECT
        ts.id            AS test_set_id,
        ts.test_id,
        ts.set_name,
        ts.exam_type,
        ts.duration_minutes,
        ts.start_time,
        ts.end_time,
        ts.PASS_THRESHOLD,
        ts.total_questions,
        q.id             AS question_id,
        q.question_text,
        q.question_type,
        q.answer,
        o.id             AS option_id,
        o.option_key,
        o.option_value
      FROM test_sets ts
      INNER JOIN test_set_questions tsq ON tsq.test_set_id = ts.id
      INNER JOIN test_questions q ON q.id = tsq.question_id
      LEFT JOIN question_options o ON o.question_id = q.id
      WHERE ts.id = ?
      ORDER BY q.id, o.option_key;
    `;

    let [rows] = await pool.query(sql, [testSetId]);

    // 🔄 FALLBACK: If no test set found, try fetching by main Test ID
    if (!rows || rows.length === 0) {
      const rawQuestions = await this.getQuestionsByTestId(testId);

      if (!rawQuestions || rawQuestions.length === 0) {
        return {
          test_set_id: null,
          test_id: Number(testId),
          exam_type: 'UNTIMED',
          questions: []
        };
      }

      return {
        test_set_id: null,
        test_id: Number(testId),
        exam_type: 'UNTIMED',
        questions: rawQuestions
      };
    }

    // ================= GROUP QUESTIONS =================
    const questionsMap = {};
    for (const row of rows) {
      if (!questionsMap[row.question_id]) {
        questionsMap[row.question_id] = {
          id: row.question_id,
          question_text: row.question_text,
          question_type: row.question_type,
          answer: row.answer,
          options: []
        };
      }
      if (row.option_id) {
        questionsMap[row.question_id].options.push({
          option_id: row.option_id,
          key: row.option_key,
          value: row.option_value
        });
      }
    }

    return {
      test_set_id: rows[0].test_set_id,
      test_id: rows[0].test_id,
      set_name: rows[0].set_name,
      exam_type: rows[0].exam_type,
      duration_minutes: rows[0].duration_minutes,
      start_time: rows[0].start_time,
      end_time: rows[0].end_time,
      pass_threshold: rows[0].PASS_THRESHOLD,
      total_questions: rows[0].total_questions,
      questions: Object.values(questionsMap)
    };
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
  }
};

module.exports = testModel;
