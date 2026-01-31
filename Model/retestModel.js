
const pool = require('../config/db');

const retestModel = {
    async createRequest(data) {
        const { student_id, class_id, test_id, score, total_questions, instructor_id, attempted_at } = data;

        // Check for existing pending or approved requests
        const checkQuery = `
            SELECT id, status FROM retest_requests 
            WHERE student_id = ? AND test_id = ? AND status IN ('Pending', 'Approved')
            LIMIT 1
        `;
        const [existing] = await pool.query(checkQuery, [student_id, test_id]);

        if (existing.length > 0) {
            throw new Error(`You already have a ${existing[0].status.toLowerCase()} retest request for this test.`);
        }

        // Convert attempted_at to MySQL datetime format if it exists
        let mysqlAttemptedAt = null;
        if (attempted_at) {
            const date = new Date(attempted_at);
            mysqlAttemptedAt = date.toISOString().slice(0, 19).replace('T', ' ');
        }

        const query = `
            INSERT INTO retest_requests 
            (student_id, class_id, test_id, score, total_questions, instructor_id, attempted_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;
        const [result] = await pool.query(query, [student_id, class_id, test_id, score, total_questions, instructor_id, mysqlAttemptedAt]);
        return result.insertId;
    },

    async getRequestsByInstructor(instructorId) {
        const query = `
            SELECT 
                r.id,
                r.student_id,
                r.class_id,
                r.test_id,
                r.score,
                r.total_questions,
                r.status,
                r.created_at,
                r.updated_at,
                r.instructor_id,
                u.name as student_name, 
                u.army_id, 
                c.class_name, 
                t.title as test_title,
                COALESCE(
                    r.attempted_at, 
                    (SELECT sts.submitted_at 
                     FROM test_sets ts 
                     JOIN student_test_sets sts ON sts.test_set_id = ts.id 
                     WHERE ts.test_id = r.test_id 
                       AND sts.student_id = r.student_id 
                       AND sts.submitted_at IS NOT NULL
                     ORDER BY sts.submitted_at DESC 
                     LIMIT 1)
                ) as attempted_at,
                (SELECT sts.score 
                 FROM tests retest 
                 JOIN test_sets ts ON ts.test_id = retest.id
                 JOIN student_test_sets sts ON sts.test_set_id = ts.id 
                 WHERE retest.individual_student_id = r.student_id 
                   AND retest.class_id = r.class_id 
                   AND retest.created_at > r.created_at
                   AND sts.student_id = r.student_id
                   AND sts.score IS NOT NULL
                 ORDER BY retest.created_at DESC
                 LIMIT 1) as retest_score
            FROM retest_requests r
            JOIN users u ON r.student_id = u.id
            JOIN classes c ON r.class_id = c.id
            JOIN tests t ON r.test_id = t.id
            WHERE r.instructor_id = ?
            ORDER BY r.created_at DESC
        `;
        const [rows] = await pool.query(query, [instructorId]);
        return rows;
    },

    async getRequestsByStudent(studentId) {
        const query = `
            SELECT r.*, c.class_name, t.title as test_title
            FROM retest_requests r
            JOIN classes c ON r.class_id = c.id
            JOIN tests t ON r.test_id = t.id
            WHERE r.student_id = ?
            ORDER BY r.created_at DESC
        `;
        const [rows] = await pool.query(query, [studentId]);
        return rows;
    },

    async updateRequestStatus(requestId, status) {
        const query = `UPDATE retest_requests SET status = ? WHERE id = ?`;
        await pool.query(query, [status, requestId]);
    },


    async getRequestById(requestId) {
        const query = `SELECT * FROM retest_requests WHERE id = ?`;
        const [rows] = await pool.query(query, [requestId]);
        return rows[0];
    },

    async getRetestHistory() {
        const query = `
            SELECT 
                r.id,
                r.student_id,
                r.class_id,
                r.test_id,
                r.score,
                r.total_questions,
                r.status,
                r.created_at,
                r.updated_at,
                r.instructor_id,
                u.name as student_name, 
                u.army_id, 
                c.class_name, 
                original_test.title as original_test_title,
                COALESCE(
                    r.attempted_at, 
                    (SELECT sts.submitted_at 
                     FROM test_sets ts 
                     JOIN student_test_sets sts ON sts.test_set_id = ts.id 
                     WHERE ts.test_id = r.test_id 
                       AND sts.student_id = r.student_id 
                       AND sts.submitted_at IS NOT NULL
                     ORDER BY sts.submitted_at DESC 
                     LIMIT 1)
                ) as attempted_at,
                (SELECT retest.title 
                 FROM tests retest 
                 WHERE retest.individual_student_id = r.student_id 
                   AND retest.class_id = r.class_id 
                   AND retest.created_at > r.created_at
                 ORDER BY retest.created_at DESC
                 LIMIT 1) as retest_title,
                (SELECT retest.id 
                 FROM tests retest 
                 WHERE retest.individual_student_id = r.student_id 
                   AND retest.class_id = r.class_id 
                   AND retest.created_at > r.created_at
                 ORDER BY retest.created_at DESC
                 LIMIT 1) as retest_id,
                (SELECT sts.score 
                 FROM tests retest 
                 JOIN test_sets ts ON ts.test_id = retest.id
                 JOIN student_test_sets sts ON sts.test_set_id = ts.id 
                 WHERE retest.individual_student_id = r.student_id 
                   AND retest.class_id = r.class_id 
                   AND retest.created_at > r.created_at
                   AND sts.student_id = r.student_id
                   AND sts.score IS NOT NULL
                 ORDER BY retest.created_at DESC
                 LIMIT 1) as retest_score,
                (SELECT sts.submitted_at 
                 FROM tests retest 
                 JOIN test_sets ts ON ts.test_id = retest.id
                 JOIN student_test_sets sts ON sts.test_set_id = ts.id 
                 WHERE retest.individual_student_id = r.student_id 
                   AND retest.class_id = r.class_id 
                   AND retest.created_at > r.created_at
                   AND sts.student_id = r.student_id
                   AND sts.submitted_at IS NOT NULL
                 ORDER BY retest.created_at DESC
                 LIMIT 1) as retest_submitted_at
            FROM retest_requests r
            JOIN users u ON r.student_id = u.id
            JOIN classes c ON r.class_id = c.id
            JOIN tests original_test ON r.test_id = original_test.id
            WHERE r.status = 'Completed'
            ORDER BY r.updated_at DESC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }
};

module.exports = retestModel;
