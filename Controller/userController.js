

const bcrypt = require('bcrypt');
const UserModel = require('../Model/userModel');
const { classModel } = require('../Model/classModel');
const testModel = require('../Model/testModel');
const generateStudentProfilePdf = require('../utils/pdfStudentProfile');

const UserController = {

  // GET all users
  async getAllUsers(req, res) {
    try {
      const { role, status } = req.query;
      let users;
      if (role) {
        users = await UserModel.getByRole(role);
        if (status) {
          users = users.filter(u => u.status === status);
        }
      } else {
        users = await UserModel.getAll();
        if (status) {
          users = users.filter(u => u.status === status);
        }
      }
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // CREATE new user
  async createUser(req, res) {
    try {
      const body = req.body;

      // hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);

      body.password = hashedPassword;

      const id = await UserModel.createUser(body);
      res.json({ message: "User created", user_id: id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // UPDATE user fields
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { class_id, ...userData } = req.body;

      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      // Handle class assignment if class_id is provided
      if (class_id && class_id !== "") {
        await classModel.assignStudentToClass(id, class_id);
      }

      await UserModel.updateUser(id, userData);
      res.json({ message: "User updated" });

    } catch (err) {
      console.error("Error in updateUser:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // DELETE user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await UserModel.deleteUser(id);
      res.json({ message: "User deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // GET by role
  async getByRole(req, res) {
    try {
      const { role } = req.params;
      const rows = await UserModel.getByRole(role);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // GET by batch
  async getByBatch(req, res) {
    try {
      const { batch_no } = req.params;
      const rows = await UserModel.getByBatch(batch_no);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // UPDATE status
  async setStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, classId } = req.body;

      await UserModel.updateStatus(id, status);

      // If status is Approved and classId is provided, assign student to class
      if (status === 'Approved' && classId && classId !== "") {
        await classModel.assignStudentToClass(id, classId);
      }

      res.json({ message: "Status updated" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  async downloadProfilePdf(req, res) {
    try {
      const { id } = req.params;

      // 1. Fetch info
      const student = await UserModel.getById(id);
      if (!student) return res.status(404).json({ message: "Student not found" });

      const classes = await classModel.getClassesByStudent(id);
      const tests = await testModel.getTestsByStudent(id);

      const data = {
        ...student,
        classes,
        tests
      };

      const fileName = `${student.name.replace(/\s+/g, '_')}_Profile`;

      generateStudentProfilePdf(data, fileName, res);

    } catch (err) {
      console.error("Error generating profile PDF:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = UserController;