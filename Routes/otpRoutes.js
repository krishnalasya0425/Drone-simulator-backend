const express = require("express");
const router = express.Router();
const OtpController = require("../Controller/otpController");

// Student requests OTP
router.post("/request", OtpController.requestOtp);

// Reset password using OTP
router.post("/reset", OtpController.resetPassword);

// Instructor dashboard OTP list
router.get("/instructor-dashboard", OtpController.getOtpForInstructor);

// Admin dashboard OTP list
router.get("/admin-dashboard", OtpController.getOtpForAdmin);

module.exports = router;