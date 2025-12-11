const {classModel, subSyllabusModel, syllabusModel, docsModel} = require('../Model/classModel');


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
    const { id } = req.query;  // now reading ?id=123

    const classes = await classModel.getClassesFiltered(id);  

    res.status(200).json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
},


    async addClass(req, res) {
       
        try {
            const { className, createdBy} = req.body;
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
}


const docsController = {

   
    async updateDocs (req, res){
        try {
            const { id } = req.params;
            const { doc_name , doc_url} = req.body;
            await docsModel.updateDoc(doc_name , doc_url, id);
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

      await docsModel.uploadDoc(
        class_id,
        doc_title,
        req.file.buffer,
        req.file.mimetype
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
      res.json({ docs });
    } catch (err) {
      res.status(500).json({ error: "Cannot fetch docs" });
    }
  },

  async streamDoc(req, res) {
    try {
      const { id } = req.params;
      const doc = await docsModel.getDocById(id);

      if (!doc) return res.status(404).send("Not found");

      res.setHeader("Content-Type", doc.file_type);
      res.setHeader("Content-Disposition", `inline; filename="${doc.doc_title}"`);

      res.send(doc.file_data); // RAW BUFFER — perfect for preview
    } catch (err) {
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