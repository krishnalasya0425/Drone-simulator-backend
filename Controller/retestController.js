
const retestModel = require('../Model/retestModel');
const { classModel } = require('../Model/classModel');

const retestController = {
    async createRequest(req, res) {
        try {
            const { student_id, class_id, test_id, score, total_questions, attempted_at } = req.body;

            // Validate student completion (this could be checked here or assumed from frontend check)
            // But let's fetch instructor_id for the class
            const classInfo = await classModel.getClassInfo(class_id);
            if (!classInfo) {
                return res.status(400).json({ message: "Class not found" });
            }

            const instructor_id = classInfo.instructor_id || classInfo.creator_id || 0;

            const requestId = await retestModel.createRequest({
                student_id,
                class_id,
                test_id,
                score,
                total_questions,
                instructor_id,
                attempted_at
            });

            res.status(201).json({ message: "Retest request submitted successfully", requestId });
        } catch (error) {
            console.error("Error creating retest request:", error);
            res.status(500).json({ message: "Failed to submit request" });
        }
    },

    async getInstructorRequests(req, res) {
        try {
            const { instructorId } = req.params;
            const requests = await retestModel.getRequestsByInstructor(instructorId);
            res.status(200).json(requests);
        } catch (error) {
            console.error("Error fetching instructor retest requests:", error);
            res.status(500).json({ message: "Failed to fetch requests" });
        }
    },

    async getStudentRequests(req, res) {
        try {
            const { studentId } = req.params;
            const requests = await retestModel.getRequestsByStudent(studentId);
            res.status(200).json(requests);
        } catch (error) {
            console.error("Error fetching student retest requests:", error);
            res.status(500).json({ message: "Failed to fetch requests" });
        }
    },

    async updateStatus(req, res) {
        try {
            const { requestId } = req.params;
            const { status } = req.body;
            await retestModel.updateRequestStatus(requestId, status);
            res.status(200).json({ message: "Status updated successfully" });
        } catch (error) {
            console.error("Error updating retest status:", error);
            res.status(500).json({ message: "Failed to update status" });
        }
    },

    async getRetestHistory(req, res) {
        try {
            const history = await retestModel.getRetestHistory();
            res.status(200).json(history);
        } catch (error) {
            console.error("Error fetching retest history:", error);
            res.status(500).json({ message: "Failed to fetch retest history" });
        }
    }
};

module.exports = retestController;
