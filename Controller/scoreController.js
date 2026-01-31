const scoreModel = require('../Model/scoreModel');
const generateResultPdf = require('../utils/pdfGeneratorResult');
const generateAllSetsReportPdf = require('../utils/pdfAllSetsReport');

const scoreController = {

    async downloadAllSetsReport(req, res) {
        try {
            const { testId } = req.params;

            if (!testId) {
                return res.status(400).json({ message: "testId is required" });
            }

            const data = await scoreModel.getAllSetsResultsByTestId(testId);

            if (!data) {
                return res.status(404).json({ message: "No sets found for this test" });
            }

            const fileName = `${data.test_title.replace(/\s+/g, '_')}_Full_Report`;

            generateAllSetsReportPdf(data, fileName, res);

        } catch (err) {
            console.error("Download All Sets Report Error:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    async postScore(req, res) {
        try {
            const {
                test_set_id,
                student_id,
                score,
                started_at,
                submitted_at,
                answers
            } = req.body;

            if (!test_set_id || !student_id || score == null) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const saved = await scoreModel.recordScore({
                test_set_id,
                student_id,
                score,
                started_at,
                submitted_at,
                answers
            });

            res.status(201).json({
                message: "Score saved successfully",
                result: saved
            });
        } catch (err) {
            console.error("Error saving score:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async getTestReview(req, res) {
        try {
            const { student_id, test_set_id } = req.params;

            if (!student_id || !test_set_id) {
                return res.status(400).json({
                    message: "student_id and test_set_id are required"
                });
            }

            const summary = await scoreModel.getResultsByTestSetId(test_set_id);
            if (!summary) return res.status(404).json({ message: "Test set not found" });

            const studentData = summary.results.find(s => s.student_id == student_id);
            if (!studentData) return res.status(404).json({ message: "Student record not found" });

            const data = await scoreModel.getStudentTestReview(
                Number(student_id),
                Number(test_set_id)
            );

            const duration = studentData.started_at && studentData.submitted_at
                ? Math.round((new Date(studentData.submitted_at) - new Date(studentData.started_at)) / 60000)
                : "--";

            res.status(200).json({
                student_id,
                test_set_id,
                student_name: studentData.name,
                score: studentData.score,
                total_questions: studentData.total_questions,
                pass_threshold: summary.pass_threshold,
                exam_type: summary.exam_type,
                status: studentData.status,
                submitted_at: studentData.submitted_at,
                time_taken: duration,
                questions: data
            });
        } catch (err) {
            console.error("Review Error:", err);
            res.status(500).json({
                message: err.message || "Failed to fetch test review"
            });
        }
    },

    async getTestSetResults(req, res) {
        try {
            const { test_set_id } = req.params;

            if (!test_set_id) {
                return res.status(400).json({ message: "test_set_id is required" });
            }

            const data = await scoreModel.getResultsByTestSetId(test_set_id);

            if (!data) {
                return res.status(404).json({ message: "No results found" });
            }

            res.status(200).json(data);
        } catch (err) {
            console.error("Get Test Set Results Error:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    async downloadResultPdf(req, res) {
        try {
            const { test_set_id, student_id } = req.params;

            const summary = await scoreModel.getResultsByTestSetId(test_set_id);
            if (!summary) return res.status(404).json({ message: "Test set not found" });

            const studentData = summary.results.find(s => s.student_id == student_id);
            if (!studentData) return res.status(404).json({ message: "Student record not found in this set" });

            if (studentData.score == null) {
                return res.status(400).json({ message: "Student has not attempted this test yet" });
            }

            const questions = await scoreModel.getStudentTestReview(student_id, test_set_id);

            const duration = studentData.started_at && studentData.submitted_at
                ? Math.round((new Date(studentData.submitted_at) - new Date(studentData.started_at)) / 60000)
                : "--";

            const pdfData = {
                test_title: summary.set_name,
                test_id: summary.test_id,
                student_name: studentData.name,
                rank: studentData.rank,
                army_no: studentData.army_no,
                unit: studentData.unit,
                course_no: studentData.course_no,
                score: studentData.score,
                total_questions: questions.length,
                pass_threshold: summary.pass_threshold,
                status: studentData.status,
                duration: duration,
                questions: questions
            };

            const fileName = `${studentData.name.replace(/\s+/g, '_')}_Result`;

            generateResultPdf(pdfData, fileName, res);

        } catch (err) {
            console.error("Download Result PDF Error:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    async getScoresByUserId(req, res) {
        const { userId } = req.params;
        try {
            const scores = await scoreModel.getScoresByUserId(userId);
            res.status(200).json(scores);
        } catch (err) {
            console.error("Error fetching scores by user ID:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getScoresByTestId(req, res) {
        const { testId } = req.params;
        try {
            const scores = await scoreModel.getScoresByTestId(testId);
            res.status(200).json(scores);
        } catch (err) {
            console.error("Error fetching scores by test ID:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = scoreController;