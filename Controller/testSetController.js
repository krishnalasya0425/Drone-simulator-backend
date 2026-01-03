const testSetModel = require('../Model/testSetModel');
const scoreModel = require('../Model/scoreModel');
const generateTestPdf = require("../utils/pdfGeneratorQuestions");
const generateTestScorePdf = require("../utils/pdfTestScore");
const generateTestSetResultsPdf = require("../utils/pdfTestSetResults");

const testSubSet = {


  async createSubTest(req, res) {

    try {
      const testId = Number(req.params.testId);

      const {
        numberOfSets,
        questionsPerSet,
        examType,
        durationMinutes,
        startTime,
        endTime,
        passThreshold
      } = req.body;

      console.log(testId, req.body)
      // 🔒 Basic validation
      if (!testId || !numberOfSets || !questionsPerSet || !examType) {
        return res.status(400).json({
          message: "Missing required fields"
        });
      }

      if (examType === 'TIMED' && (durationMinutes === undefined || durationMinutes === null)) {
        return res.status(400).json({
          message: "Duration is required for TIMED exams"
        });
      }

      if (examType === 'FIXED_TIME' && (!startTime || !endTime)) {
        return res.status(400).json({
          message: "Start and end time are required for FIXED_TIME exams"
        });
      }

      await testSetModel.createTestSet({
        testId,
        numberOfSets,
        questionsPerSet,
        examType,
        durationMinutes,
        startTime,
        endTime,
        passThreshold
      });

      res.status(201).json({
        message: "Subtests created successfully"
      });

    } catch (err) {
      console.error("Create Subtest Error:", err);
      res.status(500).json({
        message: err.message || "Failed to create subtests"
      });
    }
  },

  async getSubTest(req, res) {
    try {
      const testId = Number(req.params.testId);

      if (!testId) {
        return res.status(400).json({ message: "Invalid test id" });
      }

      const sets = await testSetModel.getTestSetsByTestId(testId);

      res.status(200).json({
        test_id: testId,
        total_sets: sets.length,
        sets
      });
    } catch (err) {
      console.error("Get Subtest Error:", err);
      res.status(500).json({
        message: err.message || "Failed to fetch subtests"
      });
    }
  },

  async downloadPdf(req, res) {
    try {
      const { id } = req.params;

      const questions = await testSetModel.getQuestionsByTestSetId(id);

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

      const scoreData = await testSetModel.getTestScoreInfo(id);

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

      const testInfo = await testSetModel.getTestScoreInfo(id);

      if (!testInfo) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.status(200).json(testInfo);

    } catch (error) {
      console.error("Error fetching test score info:", error);
      res.status(500).json({ message: "Failed to fetch test score info" });
    }
  },

  async deleteSubTest(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Invalid test set id" });
      }

      await testSetModel.deleteTestSet(id);
      res.status(200).json({ message: "Sub-test deleted successfully" });
    } catch (error) {
      console.error("Delete Sub-test Error:", error);
      res.status(500).json({
        message: error.message || "Failed to delete sub-test"
      });
    }
  },

  async downloadSetResults(req, res) {
    try {
      const { id } = req.params;

      const results = await scoreModel.getResultsByTestSetId(id);

      if (!results) {
        return res.status(404).json({ message: "No results found for this set" });
      }

      const fileName = `${results.set_name.replace(/\s+/g, '_')}_Results`;

      generateTestSetResultsPdf(results, fileName, res);
    } catch (error) {
      console.error("Download Set Results Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
}

module.exports = testSubSet;