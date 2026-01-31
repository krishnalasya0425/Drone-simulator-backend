

const UserModel = require("../Model/userModel");
const OtpModel = require("../Model/otpModel");
const bcrypt = require("bcrypt");

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const OtpController = {

  // 1️⃣ Student clicks forgot password
  async requestOtp(req, res) {
    const { armyNo } = req.body;

    try {
      const user = await UserModel.getByArmyNo(armyNo);

      if (!user) return res.status(404).json({ message: "User not found" });

      const otp = generateOtp();
      await OtpModel.createOtp(user.id, otp);

      res.json({ message: "OTP generated", otp });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // 2️⃣ Reset password using OTP
  async resetPassword(req, res) {
    const { armyNo, otp, newPassword } = req.body;

    try {
      const user = await UserModel.getByArmyNo(armyNo);
      if (!user) return res.status(404).json({ message: "User not found" });

      const validOtp = await OtpModel.getValidOtp(user.id, otp);
      if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserModel.updateUser(user.id, { password: hashedPassword });

      await OtpModel.markOtpUsed(validOtp.id);

      res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // 3️⃣ Instructor dashboard OTP list (Flat structure for frontend)
  async getOtpForInstructor(req, res) {
    try {
      const students = await UserModel.getByRole("student");

      const otpData = await Promise.all(
        students.map(async (s) => {
          const otp = await OtpModel.getOtpByUser(s.id);
          const isValid = otp && new Date(otp.expires_at) > new Date() && !otp.used;

          return {
            ...s,
            otp: otp ? otp.otp : null,
            otpValid: isValid
          };
        })
      );

      res.json(otpData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // 4️⃣ Admin dashboard OTP list
  async getOtpForAdmin(req, res) {
    const { role, instructorId } = req.query;

    try {
      let users = await UserModel.getByRole(role);

      // If instructor is requesting students, filter by their classes only
      if (role === 'student' && instructorId) {
        const pool = require('../config/db');

        // Get students enrolled in instructor's classes
        const [studentIds] = await pool.query(`
          SELECT DISTINCT ac.student_id
          FROM classes c
          JOIN assigned_classes ac ON c.id = ac.class_id
          WHERE c.instructor_id = ?
        `, [instructorId]);

        const allowedStudentIds = studentIds.map(row => row.student_id);

        // Filter users to only include students in instructor's classes
        users = users.filter(u => allowedStudentIds.includes(u.id));
      }

      const otpData = await Promise.all(
        users.map(async (u) => {
          const otp = await OtpModel.getOtpByUser(u.id);
          const isValid = otp && new Date(otp.expires_at) > new Date() && !otp.used;

          return {
            ...u,
            otp: otp ? otp.otp : null,
            otpValid: isValid,
          };
        })
      );

      res.json(otpData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
};

module.exports = OtpController;