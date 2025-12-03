const bcrypt = require('bcrypt');
const UserModel = require('../Model/userModel');

const UserController = {
  
  // GET all users
  async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAll();
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
      const data = req.body;

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      await UserModel.updateUser(id, data);
      res.json({ message: "User updated" });

    } catch (err) {
      console.error(err);
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
      const { status } = req.body;

      await UserModel.updateStatus(id, status);
      res.json({ message: "Status updated" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

};

module.exports = UserController;
