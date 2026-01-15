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
        passThreshold,
        classId
      } = req.body;

      console.log(testId, req.body)
      // 🔒 Basic validation
      if (!testId || !numberOfSets || !questionsPerSet || !examType) {
        return res.status(400).json({
          message: "❌ Missing Required Fields: Please provide all required information (test ID, number of sets, questions per set, and exam type)."
        });
      }

      if (examType === 'TIMED' && (durationMinutes === undefined || durationMinutes === null)) {
        return res.status(400).json({
          message: "❌ Duration Required: Please specify the duration in minutes for this timed exam."
        });
      }

      if (examType === 'FIXED_TIME' && (!startTime || !endTime)) {
        return res.status(400).json({
          message: "❌ Time Window Required: Please specify both start time and end time for this fixed-time exam."
        });
      }

      // Check if class has students (if classId is provided)
      if (classId) {
        const { classModel } = require('../Model/classModel');
        const students = await classModel.getStudentsByClass(classId);

        if (!students || students.length === 0) {
          return res.status(400).json({
            message: "❌ No Students Found: This class has no students enrolled. Please add students to the class before generating test sets."
          });
        }

        console.log(`Class ${classId} has ${students.length} students`);
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
        message: "✅ Test sets created successfully!"
      });

    } catch (err) {
      console.error("Create Subtest Error:", err);

      // Provide user-friendly error messages
      let errorMessage = "❌ Failed to create test sets: ";

      if (err.message.includes("No questions")) {
        errorMessage += "No questions found in the test. Please add questions to the test first before creating test sets.";
      } else if (err.message.includes("duplicate")) {
        errorMessage += "Test sets already exist. Please delete existing sets before creating new ones.";
      } else {
        errorMessage += err.message || "An unexpected error occurred. Please try again.";
      }

      res.status(500).json({
        message: errorMessage
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