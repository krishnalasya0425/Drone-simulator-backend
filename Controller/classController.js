


const { classModel, subSyllabusModel, syllabusModel, docsModel } = require('../Model/classModel');


const classController = {

  async getClassInfo(req, res) {
    try {
      const { id } = req.params
      const classes = await classModel.getClassInfo(id);
      res.status(200).json(classes);
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  },

  async getClassesByInstructorId(req, res) {
    try {
      const { id, role } = req.query;  // now reading ?id=123&role=admin/instructor

      let classes;
      if (role === 'admin') {
        // Admin can filter by instructor or see all
        if (id) {
          // Admin filtering by specific instructor
          classes = await classModel.getClassesFiltered(id);
        } else {
          // Admin seeing all classes
          classes = await classModel.getAllClasses();
        }
      } else if (id) {
        // Instructor sees only their assigned classes
        classes = await classModel.getClassesFiltered(id);
      } else {
        classes = await classModel.getAllClasses();
      }

      res.status(200).json(classes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  },

  async getByStudentId(req, res) {
    const { id } = req.query;

    try {
      const classes = await classModel.getClassesByStudent(id);
      return res.status(200).json(classes);
    } catch (error) {
      console.error("Error fetching classes by student:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching assigned classes"
      });
    }
  },

  async adminAddClass(req, res) {
    try {
      console.log("BODY:", req.body);
      console.log("FILE:", req.file);

      const { class_name, instructor_id, created_by } = req.body;

      if (!class_name || !created_by) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: class_name and created_by are required"
        });
      }

      try {
        const classId = await classModel.createClass(class_name, created_by, instructor_id || null);
        res.status(201).json({
          success: true,
          message: "Class created successfully",
          classId
        });
      } catch (error) {
        if (error.message.includes('already exists')) {
          return res.status(409).json({
            success: false,
            message: "A class with this name already exists. Please choose a different name."
          });
        }
        throw error;
      }
    } catch (err) {
      console.error("adminAddClass error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  },

  async addClass(req, res) {

    try {
      const { className, createdBy } = req.body;
      const classId = await classModel.createClass(className, createdBy);
      res.status(201).json({ message: 'Class created', classId });
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to create class' });
    }
  },

  async updateClass(req, res) {

    try {
      const { classId } = req.params;
      const { className } = req.body;
      await classModel.updateClass(className, classId);
      res.status(200).json({ message: 'Class updated' });
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to update class' });
    }
  },

  async delelteClass(req, res) {
    try {
      const { classId } = req.params;
      await classModel.deleteClass(classId);
      res.status(200).json({ message: 'Class deleted' });
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to delete class' });
    }
  },

  async getStudents(req, res) {
    try {
      const { classId } = req.params;
      const students = await classModel.getStudentsByClass(classId);
      res.status(200).json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  },

  async addStudents(req, res) {
    try {
      const { classId } = req.params;
      const { studentIds, userRole } = req.body;

      // Only admin can add students
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Only administrators can add students to classes"
        });
      }

      if (!studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({ error: "Invalid student IDs" });
      }

      for (const studentId of studentIds) {
        await classModel.assignStudentToClass(studentId, classId);
      }

      res.status(200).json({
        success: true,
        message: "Students added successfully"
      });
    } catch (error) {
      console.error("Error adding students:", error);
      res.status(500).json({ error: "Failed to add students" });
    }
  },

  async removeStudents(req, res) {
    try {
      const { classId } = req.params;
      const { studentIds, userRole } = req.body;

      // Only admin can remove students
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Only administrators can remove students from classes"
        });
      }

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: "Invalid student IDs" });
      }

      await classModel.removeStudentsFromClass(studentIds, classId);

      res.status(200).json({
        success: true,
        message: "Students removed successfully"
      });
    } catch (error) {
      console.error("Error removing students:", error);
      res.status(500).json({ error: "Failed to remove students" });
    }
  }
}


const docsController = {


  async updateDocs(req, res) {
    try {
      const { id } = req.params;
      const { doc_name, doc_url } = req.body;
      await docsModel.updateDoc(doc_name, doc_url, id);
      res.status(200).json({ message: 'Document updated' });
    }
    catch (error) {
      res.status(500).json({ error: 'Failed to update document' });
    }
  },

  async uploadDocs(req, res) {
    try {
      const { class_id, doc_title } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const isVideo = req.file.mimetype.startsWith('video/');
      let fileData = null;
      let filePath = req.file.path; // Always available with diskStorage

      if (!isVideo) {
        // Optional: still save binary for images if you want them in DB
        const fs = require('fs');
        fileData = fs.readFileSync(req.file.path);
      }

      await docsModel.uploadDoc(
        class_id,
        doc_title,
        fileData,
        req.file.mimetype,
        filePath
      );

      res.json({ message: "File uploaded successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Upload failed" });
    }
  },

  async getDocsByClass(req, res) {
    try {
      const { class_id } = req.params;
      const docs = await docsModel.getDocsList(class_id);

      // Add a full URL for videos stored on disk
      const docsWithPaths = docs.map(doc => {
        if (doc.file_path) {
          return {
            ...doc,
            file_url: `${req.protocol}://${req.get('host')}/${doc.file_path.replace(/\\/g, '/')}`
          };
        }
        return doc;
      });

      res.json({ docs: docsWithPaths });
    } catch (err) {
      res.status(500).json({ error: "Cannot fetch docs" });
    }
  },

  async streamDoc(req, res) {
    try {
      const { id } = req.params;
      const doc = await docsModel.getDocById(id);

      if (!doc) return res.status(404).send("Not found");

      if (doc.file_path) {
        // If it's stored on disk, we can redirect or send the file
        const path = require('path');
        const fs = require('fs');
        const absolutePath = path.join(__dirname, '..', doc.file_path);

        if (fs.existsSync(absolutePath)) {
          return res.sendFile(absolutePath);
        } else {
          return res.status(404).send("Physical file not found");
        }
      }

      res.setHeader("Content-Type", doc.file_type);
      res.setHeader("Content-Disposition", `inline; filename="${doc.doc_title}"`);

      res.send(doc.file_data); // RAW BUFFER for older BLOB data
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to open file" });
    }
  },

  async deleteDoc(req, res) {
    try {
      await docsModel.deleteDoc(req.params.id);
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ error: "Delete failed" });
    }
  }
};



module.exports = { classController, docsController };