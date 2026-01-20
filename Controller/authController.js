
const authModel = require("../Model/authModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const AuthController = {
  
  async register(req, res) {
    const { name, regiment, batch_no, army_id, role = 'Student', password } = req.body;

    try {
      console.log('Registration attempt for:', { name, army_id });

      
      if (!name || !army_id || !password) {
        return res.status(400).json({
          success: false,
          message: '❌ Missing Required Fields: Please provide Name, Army ID, and Password to register.'
        });
      }

      
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: '❌ Invalid Name: Name must be at least 2 characters long.'
        });
      }

      
      if (army_id.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: '❌ Invalid Army ID: Army ID must be at least 3 characters long.'
        });
      }

      
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '❌ Weak Password: Password must be at least 6 characters long for security.'
        });
      }

      
      const existingUser = await authModel.findByArmyId(army_id);
      if (existingUser) {
        console.log('User already exists:', army_id);
        return res.status(400).json({
          success: false,
          message: '❌ Army ID Already Registered: This Army ID is already registered in the system. Please use a different Army ID or login if this is your account.'
        });
      }

      
      console.log('Hashing password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      
      console.log('Creating new user...');
      const newUser = await authModel.register({
        name,
        regiment,
        batch_no,
        army_id,
        role,
        password: hashedPassword,
        status: 'Pending'
      });

      console.log('User created successfully:', newUser);
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please wait for admin approval.',
        user: {
          id: newUser.insertId,
          name,
          army_id,
          role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message
      });
    }
  },

  
  async login(req, res) {
    const { armyId, password } = req.body;
    console.log('Login attempt for armyId:', armyId);

    try {

      
      if (armyId === "admin" && password === "admin") {
        console.log("Hardcoded admin login successful.");

        const adminUser = {
          id: "admin",
          army_id: "admin",
          role: "admin",
          name: "Admin",
          batch_no: "admin"
        };

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

        const token = jwt.sign(
          {
            id: adminUser.id,
            armyId: adminUser.army_id,
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
          batchNo: adminUser.batch_no,
          armyId: adminUser.army_id
        });
      }

      

      if (!armyId || !password) {
        return res.status(400).json({
          success: false,
          message: '❌ Missing Credentials: Please provide both Army ID and password to login.'
        });
      }

      const user = await authModel.login(armyId);
      console.log('User found:', user ? 'Yes' : 'No');


      if (!user) {
        console.log('No user found with armyId:', armyId);
        return res.status(401).json({
          success: false,
          message: "❌ Invalid Army ID: No account found with this Army ID. Please check your Army ID or register if you don't have an account."
        });
      }



      if (user.status.toLowerCase() !== 'approved') {
        console.log('Account not approved. Status:', user.status);

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

      console.log('Comparing passwords...');
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log('Password does not match');
        return res.status(401).json({
          success: false,
          message: "❌ Incorrect Password: The password you entered is incorrect. Please try again or reset your password if you've forgotten it."
        });
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        {
          id: user.id,
          armyId: user.army_id,
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

      console.log('Login successful for user:', user.army_id);

      return res.json({
        success: true,
        message: "Logged in successfully",
        token,
        id: user.id,
        role: user.role,
        name: user.name,
        batchNo: user.batch_no,
        armyId: user.army_id
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
        error: error.message
      });
    }
  }

};

module.exports = AuthController;