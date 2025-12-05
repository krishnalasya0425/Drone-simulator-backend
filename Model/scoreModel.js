const pool = require('../config/db');

const scoreModel = {



async recordScore(testId, studentId, score, totalQuestions) {
    const query = `
        INSERT INTO test_scores (test_id, student_id, score, total_questions)
        VALUES (?, ?, ?, ?)
    `;

    const values = [testId, studentId, score, totalQuestions];

    const [result] = await pool.query(query, values);
    return result;   // MySQL doesn’t return rows for INSERT
},



    async getScoresByUserId(userId) {
        const query = 'SELECT * FROM scores WHERE student_id = $1';
        const values = [userId];
        const res = await pool.query(query, values);
        return res.rows;
    },

    async getScoresByTestId(testId) {
        const query = 'SELECT * FROM scores WHERE test_id = $1';
        const values = [testId];
        const res = await pool.query(query, values);
        return res.rows;
    },
};

module.exports = scoreModel;