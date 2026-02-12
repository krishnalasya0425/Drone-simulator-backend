

const testSetModel = require('../Model/testSetModel');
const scoreModel = require('../Model/scoreModel');
const generateTestPdf = require("../utils/pdfGeneratorQuestions");
const generateTestScorePdf = require("../utils/pdfTestScore");
const generateTestSetResultsPdf = require("../utils/pdfTestSetResults");
const fs = require('fs');
const path = require('path');
const { extractTextFromPdfBuffer } = require('../utils/pdfTextExtractor');
const { parseQuestionsFromText } = require('../utils/questionParser');
const pool = require('../config/db'); // Needed for transactions

const testSubSet = {

  async createSetsFromPdf(req, res) {
    // console.log('---- Processing PDF with UPDATED Logic (v3) ----');
    // console.log('Received PDF upload request');
    // console.log('Body:', req.body);
    // console.log('Files:', req.files);

    const testId = Number(req.params.testId);
    if (!testId || !req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Missing test ID or PDF files" });
    }

    const {
      examType,
      durationMinutes,
      startTime,
      endTime,
      passThreshold,
      classId
    } = req.body;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Validate Students exist
      let students = [];

      // Fetch test details to check for individual student target
      const [[testInfo]] = await conn.query('SELECT class_id, individual_student_id FROM tests WHERE id = ?', [testId]);

      if (testInfo && testInfo.individual_student_id) {
        // Individual test! ONLY this student
        students = [{ student_id: testInfo.individual_student_id }];
      } else if (classId || (testInfo && testInfo.class_id)) {
        const effectiveClassId = classId || testInfo.class_id;
        const [rows] = await conn.query(
          `SELECT student_id FROM assigned_classes WHERE class_id = ?`,
          [effectiveClassId]
        );
        students = rows;
      }

      if (students.length === 0) {
        throw new Error("No students found for this test/class");
      }

      // Check existing sets to start naming (Set A, B, etc)
      const [existingSets] = await conn.query(
        `SELECT set_name FROM test_sets WHERE test_id = ? ORDER BY id ASC`,
        [testId]
      );

      let startIndex = 0;
      if (existingSets.length > 0) {
        const lastSetName = existingSets[existingSets.length - 1].set_name;
        // Assuming format "Set X"
        const lastChar = lastSetName.trim().slice(-1);
        startIndex = lastChar.charCodeAt(0) - 65 + 1;
      }

      const createdSetIds = [];

      // 2. Process each PDF file as a separate Set
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const dataBuffer = fs.readFileSync(file.path);

        let textContent;
        try {
          textContent = await extractTextFromPdfBuffer(dataBuffer);
        } catch (pdfErr) {
          console.error(`PDF Parsing failed for ${file.originalname}:`, pdfErr);
          throw new Error(`Failed to parse PDF file '${file.originalname}'. The file might be corrupted or in an unsupported format. Error: ${pdfErr.message}`);
        }

        // Parse questions
        // Parse questions
        // console.log(`[DEBUG] Text Content Preview for ${file.originalname}:`, textContent.text.substring(0, 500));
        const questions = parseQuestionsFromText(textContent.text);
        // console.log(`Parsed ${questions.length} questions from ${file.originalname}`);

        if (questions.length === 0) {
          throw new Error(`No questions found in file ${file.originalname}. \nPreview: ${textContent.text.substring(0, 100)}... \nPlease make sure the PDF text is selectable and follows the format: '1. Question... A. Option...'`);
        }

        // Create Set Name (A, B, C...)
        const charCode = 65 + startIndex + i;
        const setName = `Set ${String.fromCharCode(charCode)}`;

        // Create Test Set
        const [setResult] = await conn.query(
          `INSERT INTO test_sets
            (test_id, set_name, total_questions, exam_type, duration_minutes, start_time, end_time, PASS_THRESHOLD)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            testId,
            setName,
            questions.length,
            examType,
            examType === 'TIMED' ? durationMinutes : null,
            examType === 'FIXED_TIME' ? startTime : null,
            examType === 'FIXED_TIME' ? endTime : null,
            passThreshold
          ]
        );
        const testSetId = setResult.insertId;
        createdSetIds.push(testSetId);

        // Insert Questions and Link to Set
        for (const q of questions) {
          // Insert into test_questions (library)
          const [qResult] = await conn.query(
            `INSERT INTO test_questions (test_id, question_text, question_type, answer)
                 VALUES (?, ?, ?, ?)`,
            [testId, q.question_text, q.type, q.answer]
          );
          const qId = qResult.insertId;

          // Insert options
          if (q.options && q.options.length > 0) {
            for (const opt of q.options) {
              await conn.query(
                `INSERT INTO question_options (question_id, option_key, option_value)
                         VALUES (?, ?, ?)`,
                [qId, opt.label, opt.text]
              );
            }
          }

          // Link to Test Set
          await conn.query(
            `INSERT INTO test_set_questions (test_set_id, test_id, question_id)
                 VALUES (?, ?, ?)`,
            [testSetId, testId, qId]
          );
        }

        // Cleanup: delete temp file
        fs.unlinkSync(file.path);
      }

      // 3. Randomly Assign Sets to Students
      for (const student of students) {
        // Simple random assignment
        const randomSetId = createdSetIds[Math.floor(Math.random() * createdSetIds.length)];

        // Check if already assigned (optional, but good for safety)
        // For now, we assume this is a fresh assignment or we duplicate behavior of createTestSet
        // Using INSERT IGNORE or checking existence would be better, but lets stick to simple flow
        try {
          await conn.query(
            `INSERT INTO student_test_sets (test_set_id, student_id)
                 VALUES (?, ?)`,
            [randomSetId, student.student_id]
          );
        } catch (e) {
          // console.log(`Student ${student.student_id} might already be assigned multiple sets. Ignoring.`);
        }
      }

      await conn.commit();
      res.status(201).json({
        message: `Successfully created ${createdSetIds.length} sets and assigned to ${students.length} students.`,
        setIds: createdSetIds
      });

    } catch (err) {
      await conn.rollback();
      console.error("Error creating sets from PDF:", err);
      // Cleanup files if error
      if (req.files) {
        req.files.forEach(f => {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
      }
      res.status(500).json({ message: err.message || "Failed to create sets from PDF" });
    } finally {
      conn.release();
    }
  },

  /**
   * Create multiple test sets from a single question bank PDF
   * Questions are randomly distributed across sets
   * Sets are randomly assigned to students
   */
  async createSetsFromQuestionBank(req, res) {
    // console.log('---- Creating Sets from Question Bank ----');
    // console.log('Body:', req.body);
    // console.log('File:', req.file);

    const testId = Number(req.params.testId);
    if (!testId || !req.file) {
      return res.status(400).json({ message: "Missing test ID or question bank PDF file" });
    }

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

    // Validation
    if (!numberOfSets || !questionsPerSet) {
      return res.status(400).json({
        message: "Please specify number of sets and questions per set"
      });
    }

    const numSets = parseInt(numberOfSets);
    const numQuestionsPerSet = parseInt(questionsPerSet);

    if (numSets < 1 || numQuestionsPerSet < 1) {
      return res.status(400).json({
        message: "Number of sets and questions per set must be at least 1"
      });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Extract and parse all questions from the question bank PDF
      const dataBuffer = fs.readFileSync(req.file.path);

      let textContent;
      try {
        textContent = await extractTextFromPdfBuffer(dataBuffer);
      } catch (pdfErr) {
        console.error(`PDF Parsing failed:`, pdfErr);
        throw new Error(`Failed to parse PDF file. The file might be corrupted or in an unsupported format. Error: ${pdfErr.message}`);
      }

      // console.log(`[DEBUG] Text Content Preview:`, textContent.text.substring(0, 500));
      const allQuestions = parseQuestionsFromText(textContent.text);
      // console.log(`Parsed ${allQuestions.length} questions from question bank`);

      if (allQuestions.length === 0) {
        throw new Error(`No questions found in the question bank PDF. Please make sure the PDF text is selectable and follows the format: '1. Question... A. Option...'`);
      }

      // Check if we have enough questions
      const totalQuestionsNeeded = numSets * numQuestionsPerSet;
      if (allQuestions.length < numQuestionsPerSet) {
        throw new Error(`Question bank has only ${allQuestions.length} questions, but you need at least ${numQuestionsPerSet} questions per set.`);
      }

      // console.log(`Total questions in bank: ${allQuestions.length}`);
      // console.log(`Questions needed: ${numQuestionsPerSet} per set × ${numSets} sets`);

      // 2. Get students for assignment
      let students = [];
      const [[testInfo]] = await conn.query('SELECT class_id, individual_student_id FROM tests WHERE id = ?', [testId]);

      if (testInfo && testInfo.individual_student_id) {
        students = [{ student_id: testInfo.individual_student_id }];
      } else if (classId || (testInfo && testInfo.class_id)) {
        const effectiveClassId = classId || testInfo.class_id;
        const [rows] = await conn.query(
          `SELECT student_id FROM assigned_classes WHERE class_id = ?`,
          [effectiveClassId]
        );
        students = rows;
      }

      if (students.length === 0) {
        throw new Error("No students found for this test/class");
      }

      // console.log(`Found ${students.length} students to assign sets to`);

      // 3. Determine set naming
      const [existingSets] = await conn.query(
        `SELECT set_name FROM test_sets WHERE test_id = ? ORDER BY id ASC`,
        [testId]
      );

      let startIndex = 0;
      if (existingSets.length > 0) {
        const lastSetName = existingSets[existingSets.length - 1].set_name;
        const lastChar = lastSetName.trim().slice(-1);
        startIndex = lastChar.charCodeAt(0) - 65 + 1;
      }

      const createdSetIds = [];

      // 4. Create sets with randomly distributed questions
      for (let setIdx = 0; setIdx < numSets; setIdx++) {
        const charCode = 65 + startIndex + setIdx;
        const setName = `Set ${String.fromCharCode(charCode)}`;

        // Randomly select questions for this set
        const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffledQuestions.slice(0, numQuestionsPerSet);

        // console.log(`Creating ${setName} with ${selectedQuestions.length} questions`);

        // Create Test Set
        const [setResult] = await conn.query(
          `INSERT INTO test_sets
            (test_id, set_name, total_questions, exam_type, duration_minutes, start_time, end_time, PASS_THRESHOLD)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            testId,
            setName,
            selectedQuestions.length,
            examType,
            examType === 'TIMED' ? durationMinutes : null,
            examType === 'FIXED_TIME' ? startTime : null,
            examType === 'FIXED_TIME' ? endTime : null,
            passThreshold
          ]
        );
        const testSetId = setResult.insertId;
        createdSetIds.push(testSetId);

        // Insert Questions and Link to Set
        for (const q of selectedQuestions) {
          // Insert into test_questions (library)
          const [qResult] = await conn.query(
            `INSERT INTO test_questions (test_id, question_text, question_type, answer)
                 VALUES (?, ?, ?, ?)`,
            [testId, q.question_text, q.type, q.answer]
          );
          const qId = qResult.insertId;

          // Insert options
          if (q.options && q.options.length > 0) {
            for (const opt of q.options) {
              await conn.query(
                `INSERT INTO question_options (question_id, option_key, option_value)
                         VALUES (?, ?, ?)`,
                [qId, opt.label, opt.text]
              );
            }
          }

          // Link to Test Set
          await conn.query(
            `INSERT INTO test_set_questions (test_set_id, test_id, question_id)
                 VALUES (?, ?, ?)`,
            [testSetId, testId, qId]
          );
        }
      }

      // 5. Randomly Assign Sets to Students
      // console.log(`Randomly assigning ${createdSetIds.length} sets to ${students.length} students`);

      for (const student of students) {
        const randomSetId = createdSetIds[Math.floor(Math.random() * createdSetIds.length)];

        try {
          await conn.query(
            `INSERT INTO student_test_sets (test_set_id, student_id)
                 VALUES (?, ?)`,
            [randomSetId, student.student_id]
          );
        } catch (e) {
          // console.log(`Student ${student.student_id} might already be assigned. Ignoring.`);
        }
      }

      // Cleanup: delete temp file
      fs.unlinkSync(req.file.path);

      await conn.commit();
      res.status(201).json({
        message: `✅ Successfully created ${createdSetIds.length} sets from question bank with ${numQuestionsPerSet} questions each and assigned to ${students.length} students.`,
        setIds: createdSetIds,
        totalQuestions: allQuestions.length,
        questionsPerSet: numQuestionsPerSet,
        numberOfSets: numSets
      });

    } catch (err) {
      await conn.rollback();
      console.error("Error creating sets from question bank:", err);

      // Cleanup file if error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ message: err.message || "Failed to create sets from question bank" });
    } finally {
      conn.release();
    }
  },


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

      // console.log(testId, req.body)
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

        // console.log(`Class ${classId} has ${students.length} students`);
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