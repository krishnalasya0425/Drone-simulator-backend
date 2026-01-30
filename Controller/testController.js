const testModel = require('../Model/testModel');
const generateTestPdf = require("../utils/pdfGeneratorQuestions");
const generateTestScorePdf = require("../utils/pdfTestScore");


const testController = {

  async getTestsInfo(req, res) {
    try {
      const { id } = req.params
      const Tests = await testModel.getTestsInfo(id);
      res.status(200).json(Tests);
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to fetch Testses' });
    }
  },

  async downloadPdf(req, res) {
    try {
      const { id } = req.params;

      const questions = await testModel.getQuestionsByTestId(id);

      if (!questions.length) {
        return res.status(404).json({ message: "No questions found" });
      }

      const testTitle = `Test_${id}_Questions`;

      generateTestPdf(questions, testTitle, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  },

  async downloadScorePdf(req, res) {
    try {
      const { id } = req.params;

      const scoreData = await testModel.getTestScoreInfo(id);

      if (!scoreData || !scoreData.students.length) {
        return res.status(404).json({ message: "No score data found" });
      }

      const testTitle = `${scoreData.test_title}_Scores`;

      generateTestScorePdf(scoreData, testTitle, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  },


  async getTestScoreInfo(req, res) {
    try {
      const { id } = req.params;

      const testInfo = await testModel.getTestScoreInfo(id);

      if (!testInfo) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.status(200).json(testInfo);

    } catch (error) {
      console.error("Error fetching test score info:", error);
      res.status(500).json({ message: "Failed to fetch test score info" });
    }
  },


  async getTestsByInstructorId(req, res) {
    try {
      const { id } = req.query;  // now reading ?id=123

      const Tests = await testModel.getTestsFiltered(id);

      res.status(200).json(Tests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch Testses" });
    }
  },

  async getByStudentId(req, res) {
    const { id } = req.query;

    try {
      const Tests = await testModel.getTestsByStudent(id);
      return res.status(200).json(Tests);
    } catch (error) {
      console.error("Error fetching Testses by student:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching assigned Testses"
      });
    }
  },


  async updateTest(req, res) {

    try {
      const { testId } = req.params;
      const { testName } = req.body;
      await testModel.updatTest(testName, testId);
      res.status(200).json({ message: 'Tests updated' });
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to update Tests' });
    }
  },

  async deleteTest(req, res) {
    try {
      const { testId } = req.params;
      await testModel.deleteTest(testId);
      res.status(200).json({ message: 'Tests deleted' });
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to delete Tests' });
    }
  },


  async createTest(req, res) {
    const { title, ID, classId, individualStudentId, requestId } = req.body;
    try {
      const testId = await testModel.createTest(title, ID, classId, individualStudentId);

      if (requestId) {
        const retestModel = require('../Model/retestModel');
        await retestModel.updateRequestStatus(requestId, 'Completed');
      }

      res.status(201).json({ testId });
    }
    catch (err) {
      console.error("Error creating test:", err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },



  async addQuestions(req, res) {

    const { testId, questions } = req.body;


    if (!testId) {
      return res.status(400).json({
        error: '❌ Test ID Required: Please select a test before uploading questions.'
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        error: '❌ No Questions Provided: Please add at least one question before submitting.'
      });
    }

    try {

      const testExists = await testModel.getTestById(testId);
      if (!testExists) {
        return res.status(404).json({
          error: '❌ Test Not Found: The selected test does not exist. Please create a test first before adding questions.'
        });
      }

      await testModel.addQuestionsToTest(testId, questions);
      res.status(200).json({
        message: `✅ Success! ${questions.length} question(s) added successfully to the test.`
      });
    } catch (err) {
      console.error("Error adding questions:", err);

      let errorMessage = '❌ Failed to add questions: ';
      if (err.message.includes('duplicate')) {
        errorMessage += 'Some questions already exist in this test.';
      } else if (err.message.includes('foreign key')) {
        errorMessage += 'Invalid test ID. Please select a valid test.';
      } else {
        errorMessage += err.message || 'An unexpected error occurred. Please try again.';
      }

      res.status(500).json({ error: errorMessage });
    }
  },


  async getTestQuestions(req, res) {
    const { testId } = req.params;
    try {
      const questions = await testModel.getQuestionsByTestSetId(testId);

      if (!questions) {
        return res.status(404).json({ message: "No questions found for this test set" });
      }

      res.status(200).json(questions);
    } catch (err) {
      console.error("Error fetching questions:", err);
      res.status(404).json({ error: err.message || 'Internal server error' });
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