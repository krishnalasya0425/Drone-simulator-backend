const UserModel = require("../Model/userModel");
const OtpModel = require("../Model/otpModel");
const bcrypt = require("bcrypt");

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const OtpController = {

  // 1️⃣ Student clicks forgot password
  async requestOtp(req, res) {
    const { armyId } = req.body;

    try {
    const [user] = await UserModel.getByArmyId(armyId);

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
    const { armyId, otp, newPassword } = req.body;

    try {
      const user = await UserModel.getByArmyId(armyId);
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

  // 3️⃣ Instructor dashboard OTP list
  async getOtpForInstructor(req, res) {
    try {
      const students = await UserModel.getByRole("student");

      const otpData = await Promise.all(
        students.map(async (s) => {
          const otp = await OtpModel.getOtpByUser(s.id);
          const isValid = otp && new Date(otp.expires_at) > new Date() && !otp.used;

          return {
            student: s,
            otp: otp ? otp.otp : null,
            valid: isValid
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
    const { role } = req.query;

    try {
      const users = await UserModel.getByRole(role);

      const otpData = await Promise.all(
        users.map(async (u) => {
          const otp = await OtpModel.getOtpByUser(u.id);
          const isValid = otp && new Date(otp.expires_at) > new Date() && !otp.used;

          return {
            id: u.id,
            name : u.name,
            batch_no : u.batch_no,
            army_id : u.army_id,
            regiment : u.regiment,
            role : u.role,
            status: u.status,

            otp: otp ? otp.otp : null,
            valid: isValid,
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