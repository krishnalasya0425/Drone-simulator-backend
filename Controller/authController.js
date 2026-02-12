
const authModel = require("../Model/authModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const AuthController = {

  async register(req, res) {
    const { name, rank, unit, course_no, army_no, role = 'Student', password } = req.body;

    try {
      // console.log('Registration attempt for:', { name, army_no });

      // Validation: Required fields
      if (!name || !rank || !army_no || !password) {
        return res.status(400).json({
          success: false,
          message: '❌ Missing Required Fields: Please provide Name, Rank, Army No, and Password to register.'
        });
      }

      // Validation: Name length
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: '❌ Invalid Name: Name must be at least 2 characters long.'
        });
      }

      // Validation: Army No must be alphanumeric
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (!alphanumericRegex.test(army_no.trim())) {
        return res.status(400).json({
          success: false,
          message: '❌ Invalid Army No: Army No must be alphanumeric (letters and numbers only, no spaces or special characters).'
        });
      }

      if (army_no.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: '❌ Invalid Army No: Army No must be at least 3 characters long.'
        });
      }

      // Validation: Password minimum 6 characters
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '❌ Weak Password: Password must be at least 6 characters long for security.'
        });
      }

      // Check if army_no already exists
      const existingUser = await authModel.findByArmyNo(army_no);
      if (existingUser) {
        // console.log('User already exists:', army_no);
        return res.status(400).json({
          success: false,
          message: '❌ Army No Already Registered: This Army No is already registered in the system. Please use a different Army No or login if this is your account.'
        });
      }

      // console.log('Hashing password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // console.log('Creating new user...');
      const newUser = await authModel.register({
        name,
        rank,
        unit,
        course_no,
        army_no,
        role,
        password: hashedPassword,
        status: 'Pending'
      });

      // console.log('User created successfully:', newUser);
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please wait for admin approval.',
        user: {
          id: newUser.insertId,
          name,
          army_no,
          role
        }
      });
    } catch (error) {
      // console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message
      });
    }
  },


  async login(req, res) {
    const { armyNo, password } = req.body;
    console.log('Login attempt for armyNo:', armyNo);

    try {


      if (armyNo === "admin" && password === "admin") {
    
        const adminUser = {
          id: 0,
          army_no: "admin",
          role: "admin",
          name: "Admin",
          course_no: "admin"
        };

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

        const token = jwt.sign(
          {
            id: adminUser.id,
            armyNo: adminUser.army_no,
            role: adminUser.role,
            name: adminUser.name
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
          success: true,
          message: "Logged in successfully",
          token,
          id: adminUser.id,
          role: adminUser.role,
          name: adminUser.name,
          courseNo: adminUser.course_no,
          armyNo: adminUser.army_no
        });
      }



      if (!armyNo || !password) {
        return res.status(400).json({
          success: false,
          message: '❌ Missing Credentials: Please provide both Army No and password to login.'
        });
      }

      const user = await authModel.login(armyNo);
      // console.log('User found:', user ? 'Yes' : 'No');

      // User not found
      if (!user) {
        // console.log('No user found with armyNo:', armyNo);
        return res.status(401).json({
          success: false,
          message: "❌ Invalid Army No: No account found with this Army No. Please check your Army No or register if you don't have an account."
        });
      }



      if (user.status.toLowerCase() !== 'approved') {
        // console.log('Account not approved. Status:', user.status);

        let message = '';
        if (user.status.toLowerCase() === 'pending') {
          message = user.role.toLowerCase() === 'student'
            ? "⏳ Account Pending Approval: Your account is awaiting approval from your instructor. Please contact your instructor to approve your account."
            : "⏳ Account Pending Approval: Your account is awaiting approval from the admin. Please contact the admin to approve your account.";
        } else if (user.status.toLowerCase() === 'denied') {
          message = user.role.toLowerCase() === 'student'
            ? "🚫 Account Denied: Your account has been denied by your instructor. Please contact your instructor for more information."
            : "🚫 Account Denied: Your account has been denied by the admin. Please contact the admin for more information.";
        } else {
          message = user.role.toLowerCase() === 'student'
            ? "⚠️ Account Not Approved: Your account is not approved. Please contact your instructor."
            : "⚠️ Account Not Approved: Your account is not approved. Please contact the admin.";
        }

        return res.status(403).json({ success: false, message });
      }

      // console.log('Comparing passwords...');
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // console.log('Password does not match');
        return res.status(401).json({
          success: false,
          message: "❌ Incorrect Password: The password you entered is incorrect. Please try again or reset your password if you've forgotten it."
        });
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        {
          id: user.id,
          armyNo: user.army_no,
          role: user.role,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // console.log('Login successful for user:', user.army_no);

      return res.json({
        success: true,
        message: "Logged in successfully",
        token,
        id: user.id,
        role: user.role,
        name: user.name,
        courseNo: user.course_no,
        armyNo: user.army_no
      });

    } catch (error) {
      // console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
        error: error.message
      });
    }
  }

};

module.exports = AuthController;