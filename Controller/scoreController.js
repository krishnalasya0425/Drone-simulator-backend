const scoreModel = require('../Model/scoreModel');


const scoreController = {

async postScore(req, res) {
    try {
        const { testId, studentId, score, totalQuestions } = req.body;

        if (!testId || !studentId || score == null || !totalQuestions) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const saved = await scoreModel.recordScore(
            testId,
            studentId,
            score,
            totalQuestions
        );

        res.status(201).json({
            message: "Score saved successfully",
            score: saved
        });
    } catch (err) {
        console.error("Error saving score:", err);
        res.status(500).json({ error: "Internal server error" });
    }
},


    async getScoresByUserId(req, res) {
        const { userId } = req.params;
        try {
            const scores = await scoreModel.getScoresByUserId(userId);
            res.status(200).json(scores);
        }
        catch (err) {
            console.error("Error fetching scores by user ID:", err);
            res.status(500).json({ error: 'Internal server error' });
        }   
    },

    async getScoresByTestId(req, res) {
        const { testId } = req.params;
        try {
            const scores = await scoreModel.getScoresByTestId(testId);
            res.status(200).json(scores);
        }
        catch (err) {
            console.error("Error fetching scores by test ID:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = scoreController;