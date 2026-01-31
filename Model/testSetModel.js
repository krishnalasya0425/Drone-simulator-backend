// models/testSet.model.js
const pool = require('../config/db');

const testSubSets = {

    async createTestSet(payload) {
        const {
            testId,
            numberOfSets,
            questionsPerSet,
            examType,
            durationMinutes,
            startTime,
            endTime,
            passThreshold
        } = payload;

        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            // 1️⃣ Get class_id from test
            const [[test]] = await conn.query(
                `SELECT class_id FROM tests WHERE id = ?`,
                [testId]
            );

            if (!test) throw new Error("Test not found");

            const classId = test.class_id;

            // 2️⃣ Get students in class
            const [students] = await conn.query(
                `SELECT student_id FROM assigned_classes WHERE class_id = ?`,
                [classId]
            );

            if (students.length === 0) {
                throw new Error("No students assigned to this class");
            }

            // 3️⃣ Get all questions
            const [questions] = await conn.query(
                `SELECT id FROM test_questions WHERE test_id = ?`,
                [testId]
            );

            if (questions.length < questionsPerSet) {
                throw new Error("Not enough questions in test");
            }

            const questionIds = questions.map(q => q.id);
            const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

            const createdSetIds = [];

            // 🔹 Get existing sets
            const [existingSets] = await conn.query(
                `SELECT set_name FROM test_sets WHERE test_id = ? ORDER BY id ASC`,
                [testId]
            );

            let startIndex = 0;
            if (existingSets.length > 0) {
                const lastSetName = existingSets[existingSets.length - 1].set_name;
                const lastChar = lastSetName.trim().slice(-1);
                startIndex = lastChar.charCodeAt(0) - 65 + 1;
            }

            // 🔹 Create test sets
            for (let i = 0; i < numberOfSets; i++) {
                const setName = `Set ${String.fromCharCode(65 + startIndex + i)}`;

                const [setResult] = await conn.query(
                    `INSERT INTO test_sets
     (test_id, set_name, total_questions, exam_type, duration_minutes, start_time, end_time, PASS_THRESHOLD)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        testId,
                        setName,
                        questionsPerSet,
                        examType,
                        examType === 'TIMED' ? durationMinutes : null,
                        examType === 'FIXED_TIME' ? startTime : null,
                        examType === 'FIXED_TIME' ? endTime : null,
                        passThreshold
                    ]
                );

                const testSetId = setResult.insertId;
                createdSetIds.push(testSetId);

                const selectedQuestions = shuffle(questionIds).slice(0, questionsPerSet);

                for (const qid of selectedQuestions) {
                    await conn.query(
                        `INSERT INTO test_set_questions (test_set_id, test_id, question_id)
       VALUES (?, ?, ?)`,
                        [testSetId, testId, qid]
                    );
                }
            }

            // 5️⃣ Assign random set to each student
            for (const student of students) {
                const randomSetId =
                    createdSetIds[Math.floor(Math.random() * createdSetIds.length)];

                await conn.query(
                    `INSERT INTO student_test_sets (test_set_id, student_id)
         VALUES ( ?, ?)`,
                    [randomSetId, student.student_id]
                );
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },


    async getTestSetsByTestId(testId) {
        const query = `
    SELECT
      id AS set_id,
      set_name,
      total_questions,
      exam_type,
      duration_minutes,
      start_time,
      end_time,
      PASS_THRESHOLD,
      created_at
    FROM test_sets
    WHERE test_id = ?
    ORDER BY id ASC
  `;

        const [rows] = await pool.query(query, [testId]);
        return rows;
    },

    async getQuestionsByTestSetId(idOrStsId) {
        // 1️⃣ Resolve if it's a student_test_set_id
        const [[info]] = await pool.query(
            `SELECT test_set_id FROM student_test_sets WHERE id = ?`,
            [idOrStsId]
        );

        const testSetId = info ? info.test_set_id : idOrStsId;

        const sql = `
    SELECT 
      q.id AS question_id,
      q.question_text,
      q.question_type,
      q.answer,
      o.id AS option_id,
      o.option_key,
      o.option_value
    FROM test_set_questions tsq
    INNER JOIN test_questions q 
        ON q.id = tsq.question_id
    LEFT JOIN question_options o 
        ON o.question_id = q.id
    WHERE tsq.test_set_id = ?;
  `;

        const [rows] = await pool.query(sql, [testSetId]);

        // Group options per question
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

    LEFT JOIN student_test_sets sts
      ON sts.student_id = u.id
    LEFT JOIN test_sets ts
      ON ts.id = sts.test_set_id
      AND ts.test_id = t.id

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

    async deleteTestSet(testSetId) {
        const query = `DELETE FROM test_sets WHERE id = ?`;
        await pool.query(query, [testSetId]);
    }
}

module.exports = testSubSets;
