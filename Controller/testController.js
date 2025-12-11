const testModel = require('../Model/testModel');


const testController = {
   async createTest(req, res) {
    const { title } = req.body;
    try {
        const testId = await testModel.createTest(title);
        res.status(201).json({ testId });
    }
    catch (err) {
        console.error("Error creating test:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
},

    

    async addQuestions(req, res) {  
       
        const { testId, questions } = req.body;
        try {
            await testModel.addQuestionsToTest(testId, questions);
            res.status(200).json({ message: 'Questions added successfully' });
        } catch (err) { 
            console.error("Error adding questions:", err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },


    async getTestQuestions(req, res) {
        const { testId } = req.params;
        try {
            const questions = await testModel.getQuestionsByTestId(testId);
            res.status(200).json(questions);
        } catch (err) {
            console.error("Error fetching questions:", err);
            res.status(500).json({ error: 'Internal server error' });
        }   
    },

    async getTestAnsweers(req, res) {
        const { testId } = req.params;  
        try {
            const answers = await testModel.getTestAnswers(testId);
            res.status(200).json(answers);
        } catch (err) {
            console.error("Error fetching answers:", err);
            res.status(500).json({ error: 'Internal server error' });
        }   
    },
};

module.exports = testController;