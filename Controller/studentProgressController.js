const studentProgressModel = require('../Model/studentProgressModel');

class StudentProgressController {
    /**
     * Update student's progress for a document
     * POST /api/progress/document
     */
    async updateDocumentProgress(req, res) {
        try {
            const {
                student_id,
                doc_id,
                class_id,
                completion_percentage,
                total_pages,
                pages_read,
                view_duration_seconds,
                video_duration_seconds,
                video_watched_seconds
            } = req.body;

            // Validation
            if (!student_id || !doc_id || !class_id || completion_percentage === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            await studentProgressModel.updateDocumentProgress({
                student_id,
                doc_id,
                class_id,
                completion_percentage: Math.min(100, Math.max(0, completion_percentage)), // Clamp 0-100
                total_pages,
                pages_read,
                view_duration_seconds,
                video_duration_seconds,
                video_watched_seconds
            });

            res.json({
                success: true,
                message: 'Progress updated successfully'
            });

        } catch (error) {
            console.error('Error updating document progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update progress'
            });
        }
    }

    /**
     * Get student's progress for a specific document
     * GET /api/progress/document/:studentId/:docId
     */
    async getDocumentProgress(req, res) {
        try {
            const { studentId, docId } = req.params;

            const progress = await studentProgressModel.getDocumentProgress(
                parseInt(studentId),
                parseInt(docId)
            );

            res.json({
                success: true,
                data: progress
            });

        } catch (error) {
            console.error('Error getting document progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get progress'
            });
        }
    }

    /**
     * Get student's overall progress in a class
     * GET /api/progress/class/:studentId/:classId
     */
    async getClassProgress(req, res) {

        try {
            const { studentId, classId } = req.params;

            const progress = await studentProgressModel.getClassProgress(
                parseInt(studentId),
                parseInt(classId)
            );

            res.json({
                success: true,
                data: progress
            });

        } catch (error) {
            console.error('Error getting class progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get class progress'
            });
        }
    }

    /**
     * Get all students' progress in a class (for instructor/admin)
     * GET /api/progress/class/:classId/students
     */
    async getAllStudentsProgress(req, res) {
        try {
            const { classId } = req.params;

            const progress = await studentProgressModel.getAllStudentsProgress(
                parseInt(classId)
            );

            res.json({
                success: true,
                data: progress
            });

        } catch (error) {
            console.error('Error getting all students progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get students progress'
            });
        }
    }

    /**
     * Get student's progress across all their classes
     * GET /api/progress/student/:studentId
     */
    async getStudentAllClassesProgress(req, res) {
        try {
            const { studentId } = req.params;

            const progress = await studentProgressModel.getStudentAllClassesProgress(
                parseInt(studentId)
            );

            res.json({
                success: true,
                data: progress
            });

        } catch (error) {
            console.error('Error getting student all classes progress:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get student progress'
            });
        }
    }

    /**
     * Get detailed document-level progress for a student in a class
     * GET /api/progress/class/:studentId/:classId/documents
     */
    async getStudentClassDocuments(req, res) {
        try {
            const { studentId, classId } = req.params;

            const documents = await studentProgressModel.getStudentClassDocuments(
                parseInt(studentId),
                parseInt(classId)
            );

            res.json({
                success: true,
                data: documents
            });

        } catch (error) {
            console.error('Error getting student class documents:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get documents'
            });
        }
    }
}

module.exports = new StudentProgressController();
