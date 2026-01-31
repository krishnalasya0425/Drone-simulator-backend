const pool = require('../config/db');

const toMySQLDateTime = (date) => {
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
};

const scoreModel = {

  async recordScore({
    test_set_id,
    student_id,
    score,
    started_at,
    submitted_at,
    answers
  }) {
    const sql = `
      UPDATE student_test_sets
      SET
        score = ?,
        started_at = ?,
        submitted_at = ?,
        answers = ?
      WHERE test_set_id = ? AND student_id = ?
    `;

    await pool.query(sql, [
      score,
      toMySQLDateTime(started_at),
      toMySQLDateTime(submitted_at),
      JSON.stringify(answers),
      test_set_id,
      student_id
    ]);
  },

  async getStudentTestReview(student_id, test_set_id) {
    /**
     * 1️⃣ Get answers JSON from student_test_sets
     */
    const [[attempt]] = await pool.query(
      `
      SELECT answers
      FROM student_test_sets
      WHERE student_id = ? AND test_set_id = ?
      `,
      [student_id, test_set_id]
    );

    if (!attempt) {
      throw new Error("Test attempt not found");
    }

    const studentAnswers = attempt.answers || {};

    /**
     * 2️⃣ Get questions + options for that test_set
     */
    const [rows] = await pool.query(
      `
      SELECT
        q.id AS question_id,
        q.question_text,
        q.question_type,
        q.answer AS correct_answer,
        o.id AS option_id,
        o.option_key,
        o.option_value
      FROM test_set_questions tsq
      JOIN test_questions q ON q.id = tsq.question_id
      LEFT JOIN question_options o ON o.question_id = q.id
      WHERE tsq.test_set_id = ?
      ORDER BY q.id
      `,
      [test_set_id]
    );

    /**
     * 3️⃣ Group options per question
     */
    const questionMap = {};

    for (const row of rows) {
      const qid = row.question_id;

      if (!questionMap[qid]) {
        const selected = studentAnswers[qid] || null;

        questionMap[qid] = {
          question_id: qid,
          question_text: row.question_text,
          question_type: row.question_type,
          correct_answer: row.correct_answer,
          selected_answer: selected,
          is_correct: selected === row.correct_answer,
          options: []
        };
      }

      if (row.option_id) {
        questionMap[qid].options.push({
          option_id: row.option_id,
          key: row.option_key,
          value: row.option_value
        });
      }
    }

    return Object.values(questionMap);
  },

  async getResultsByTestSetId(testSetId) {
    // 1. Get test set info
    const [testSetRows] = await pool.query(
      "SELECT id, test_id, set_name, total_questions, exam_type, PASS_THRESHOLD as pass_threshold FROM test_sets WHERE id = ?",
      [testSetId]
    );

    if (testSetRows.length === 0) return null;

    const testSet = testSetRows[0];

    // 2. Get results
    const sql = `
      SELECT
        sts.student_id,
        u.name,
        u.army_no,
        u.unit,
        u.course_no,
        sts.score,
        sts.started_at,
        sts.submitted_at
      FROM student_test_sets sts
      INNER JOIN users u ON u.id = sts.student_id
      WHERE sts.test_set_id = ?
    `;

    const [rows] = await pool.query(sql, [testSetId]);

    return {
      test_set_id: testSetId,
      test_id: testSet.test_id,
      set_name: testSet.set_name,
      exam_type: testSet.exam_type,
      pass_threshold: testSet.pass_threshold,
      results: rows.map(r => ({
        student_id: r.student_id,
        name: r.name,
        unit: r.unit,
        course_no: r.course_no,
        army_no: r.army_no,
        score: r.score,
        started_at: r.started_at,
        submitted_at: r.submitted_at,
        total_questions: testSet.total_questions,
        status: r.score === null ? "PENDING" : (r.score >= testSet.pass_threshold ? "PASS" : "FAIL")
      }))
    };
  },

  async getAllSetsResultsByTestId(testId) {
    // 1. Get all test sets for this test
    const [testSets] = await pool.query(
      "SELECT id, set_name, total_questions, PASS_THRESHOLD as pass_threshold FROM test_sets WHERE test_id = ? ORDER BY id ASC",
      [testId]
    );

    if (testSets.length === 0) return null;

    // 2. Get test title
    const [[test]] = await pool.query("SELECT title FROM tests WHERE id = ?", [testId]);
    const testTitle = test ? test.title : "Test Report";

    const resultsBySet = [];
    const testSetModel = require('./testSetModel');

    for (const set of testSets) {
      const setResults = await this.getResultsByTestSetId(set.id);
      const questions = await testSetModel.getQuestionsByTestSetId(set.id);

      resultsBySet.push({
        ...setResults,
        questions: questions
      });
    }

    return {
      test_id: testId,
      test_title: testTitle,
      sets: resultsBySet
    };
  },

  // Legacy: Get scores by user ID (for backward compatibility)
  async getScoresByUserId(userId) {
    const query = `
      SELECT 
        sts.id,
        sts.test_set_id,
        ts.set_name,
        sts.score,
        ts.total_questions,
        sts.started_at,
        sts.submitted_at
      FROM student_test_sets sts
      JOIN test_sets ts ON sts.test_set_id = ts.id
      WHERE sts.student_id = ?
      ORDER BY sts.submitted_at DESC
    `;

    const [rows] = await pool.query(query, [userId]);
    return rows;
  },

  // Legacy: Get scores by test ID (for backward compatibility)
  async getScoresByTestId(testId) {
    const query = `
      SELECT 
        sts.id,
        sts.student_id,
        u.name AS student_name,
        sts.test_set_id,
        ts.set_name,
        sts.score,
        ts.total_questions,
        sts.submitted_at
      FROM student_test_sets sts
      JOIN test_sets ts ON sts.test_set_id = ts.id
      JOIN users u ON sts.student_id = u.id
      WHERE ts.test_id = ?
      ORDER BY sts.submitted_at DESC
    `;

    const [rows] = await pool.query(query, [testId]);
    return rows;
  }
};

module.exports = scoreModel;
