const pool = require('../config/db');

const testModel ={
    async createTest(title, description) {
        const query = 'INSERT INTO tests (title, description) VALUES ($1, $2) RETURNING *';
        const values = [title, description];
        const res =  await pool.query(query, values);
        return res.rows[0];
    },

    async getTestById(testId) {
        const query = 'SELECT * FROM tests WHERE id = $1';
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
                        [
                            questionId,
                            opt.label,
                            opt.text,
                        ]
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
        const { question_id, question_text, question_type,answer } = row;

        if (!questionsMap[question_id]) {
            questionsMap[question_id] = {
                id: question_id,
                question_text,
                question_type,
                answer,
                options: []
            };
        }

        if (row.option_id) {
            questionsMap[question_id].options.push({
                option_id: row.option_id,
                key: row.option_key,
                value: row.option_value
            });
        }
    }

    return Object.values(questionsMap);
},


async  getTestAnswers(testId) {
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



}

module.exports = testModel;