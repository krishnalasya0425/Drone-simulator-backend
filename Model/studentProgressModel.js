const pool = require('../config/db');

class StudentProgressModel {
    /**
     * Update student's progress for a specific document
     * @param {Object} progressData - Progress data
     * @returns {Promise}
     */
    async updateDocumentProgress(progressData) {
        const {
            student_id,
            doc_id,
            class_id,
            completion_percentage,
            total_pages = null,
            pages_read = null,
            view_duration_seconds = 0,
            video_duration_seconds = null,
            video_watched_seconds = null
        } = progressData;

        // Ensure we don't insert NULL into the duration sum
        const safeViewDuration = view_duration_seconds || 0;

        const query = `
            INSERT INTO student_document_progress 
            (student_id, doc_id, class_id, completion_percentage, total_pages, pages_read, 
             view_duration_seconds, video_duration_seconds, video_watched_seconds, 
             first_accessed_at, total_access_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)
            ON DUPLICATE KEY UPDATE
                completion_percentage = GREATEST(completion_percentage, VALUES(completion_percentage)),
                pages_read = GREATEST(COALESCE(pages_read, 0), VALUES(pages_read)),
                view_duration_seconds = view_duration_seconds + ?,
                video_watched_seconds = GREATEST(COALESCE(video_watched_seconds, 0), VALUES(video_watched_seconds)),
                last_accessed_at = NOW(),
                total_access_count = total_access_count + 1
        `;

        const [result] = await pool.query(query, [
            student_id, doc_id, class_id, completion_percentage,
            total_pages, pages_read, safeViewDuration,
            video_duration_seconds, video_watched_seconds,
            safeViewDuration
        ]);

        console.log(`[DEBUG] Updated doc ${doc_id} progress for student ${student_id}: ${completion_percentage}%`);

        // After updating document progress, recalculate class progress
        await this.recalculateClassProgress(student_id, class_id);

        return result;
    }

    /**
     * Get student's progress for a specific document
     */
    async getDocumentProgress(studentId, docId) {
        const query = `
            SELECT * FROM student_document_progress
            WHERE student_id = ? AND doc_id = ?
        `;
        const [rows] = await pool.query(query, [studentId, docId]);
        return rows[0] || null;
    }

    /**
     * Get all document progress for a student in a class
     */
    async getStudentClassDocuments(studentId, classId) {
        const query = `
            SELECT 
                sdp.*,
                d.doc_title,
                d.file_path,
                d.file_type
            FROM student_document_progress sdp
            JOIN docs d ON sdp.doc_id = d.id
            WHERE sdp.student_id = ? AND sdp.class_id = ?
            ORDER BY d.created_at DESC
        `;
        const [rows] = await pool.query(query, [studentId, classId]);
        return rows;
    }

    /**
     * Recalculate overall class progress for a student
     */
    async recalculateClassProgress(studentId, classId) {
        // Get all documents in the class
        const [allDocs] = await pool.query(
            'SELECT id, file_type FROM docs WHERE class_id = ?',
            [classId]
        );

        if (allDocs.length === 0) return;

        // Get student's progress for all documents
        const [progress] = await pool.query(
            'SELECT doc_id, completion_percentage FROM student_document_progress WHERE student_id = ? AND class_id = ?',
            [studentId, classId]
        );

        const progressMap = new Map(progress.map(p => [p.doc_id, parseFloat(p.completion_percentage)]));

        const typeGroups = { pdf: [], image: [], video: [], other: [] };

        allDocs.forEach(doc => {
            const completion = progressMap.get(doc.id) || 0;
            const fileType = (doc.file_type || '').toLowerCase();

            if (fileType.includes('pdf')) {
                typeGroups.pdf.push(completion);
            } else if (fileType.includes('image')) {
                typeGroups.image.push(completion);
            } else if (fileType.includes('video')) {
                typeGroups.video.push(completion);
            } else {
                typeGroups.other.push(completion);
            }
        });

        // Calculate averages
        const getAvg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        const pdfAvg = getAvg(typeGroups.pdf);
        const imageAvg = getAvg(typeGroups.image);
        const videoAvg = getAvg(typeGroups.video);
        const otherAvg = getAvg(typeGroups.other);

        // Overall average of ALL documents
        const allCompletions = [...typeGroups.pdf, ...typeGroups.image, ...typeGroups.video, ...typeGroups.other];
        const overallAvg = getAvg(allCompletions);
        const completedCount = allCompletions.filter(c => c >= 99).length;

        console.log(`[DEBUG] Student ${studentId} Class ${classId} recalculation: ${overallAvg.toFixed(2)}%`);

        const query = `
            INSERT INTO student_class_progress 
            (student_id, class_id, overall_completion_percentage, 
             pdf_completion_percentage, image_completion_percentage, video_completion_percentage,
             total_documents, completed_documents)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                overall_completion_percentage = VALUES(overall_completion_percentage),
                pdf_completion_percentage = VALUES(pdf_completion_percentage),
                image_completion_percentage = VALUES(image_completion_percentage),
                video_completion_percentage = VALUES(video_completion_percentage),
                total_documents = VALUES(total_documents),
                completed_documents = VALUES(completed_documents),
                last_updated_at = NOW()
        `;

        await pool.query(query, [
            studentId, classId, overallAvg.toFixed(2),
            pdfAvg.toFixed(2), imageAvg.toFixed(2), videoAvg.toFixed(2),
            allDocs.length, completedCount
        ]);
    }

    /**
     * Get class progress summary for a student
     * @param {number} studentId 
     * @param {number} classId 
     * @returns {Promise<Object>}
     */
    async getClassProgress(studentId, classId) {
        const query = `
            SELECT * FROM student_class_progress
            WHERE student_id = ? AND class_id = ?
        `;
        const [rows] = await pool.query(query, [studentId, classId]);
        return rows[0] || {
            overall_completion_percentage: 0,
            pdf_completion_percentage: 0,
            image_completion_percentage: 0,
            video_completion_percentage: 0,
            total_documents: 0,
            completed_documents: 0
        };
    }

    /**
     * Get progress for all students in a class (for instructor/admin dashboard)
     * @param {number} classId 
     * @returns {Promise<Array>}
     */
    async getAllStudentsProgress(classId) {
        const query = `
            SELECT 
                scp.*,
                u.name as student_name,
                u.army_no
            FROM student_class_progress scp
            JOIN users u ON scp.student_id = u.id
            WHERE scp.class_id = ?
            ORDER BY scp.overall_completion_percentage DESC, u.name ASC
        `;
        const [rows] = await pool.query(query, [classId]);
        return rows;
    }

    /**
     * Get progress for a specific student across all their classes
     * @param {number} studentId 
     * @returns {Promise<Array>}
     */
    async getStudentAllClassesProgress(studentId) {
        const query = `
            SELECT 
                c.id as class_id,
                c.class_name,
                COALESCE(scp.overall_completion_percentage, 0) as overall_completion_percentage,
                COALESCE(scp.pdf_completion_percentage, 0) as pdf_completion_percentage,
                COALESCE(scp.image_completion_percentage, 0) as image_completion_percentage,
                COALESCE(scp.video_completion_percentage, 0) as video_completion_percentage,
                COALESCE(scp.total_documents, (SELECT COUNT(*) FROM docs WHERE class_id = c.id)) as total_documents,
                COALESCE(scp.completed_documents, 0) as completed_documents
            FROM assigned_classes ac
            JOIN classes c ON ac.class_id = c.id
            LEFT JOIN student_class_progress scp ON scp.class_id = c.id AND scp.student_id = ac.student_id
            WHERE ac.student_id = ?
            ORDER BY overall_completion_percentage DESC, c.class_name ASC
        `;
        const [rows] = await pool.query(query, [studentId]);
        return rows;
    }
}

module.exports = new StudentProgressModel();
