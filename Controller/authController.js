
const authModel = require("../Model/authModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const AuthController = {
  // REGISTER
  async register(req, res) {
    const { name, regiment, batch_no, army_id, role = 'Student', password } = req.body;
    
    try {
      console.log('Registration attempt for:', { name, army_id });
      
      // Check if user already exists
      const existingUser = await authModel.findByArmyId(army_id);
      if (existingUser) {
        console.log('User already exists:', army_id);
        return res.status(400).json({ 
          success: false,
          message: 'User with this Army ID already exists' 
        });
      }

      // Hash password
      console.log('Hashing password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      console.log('Creating new user...');
      const newUser = await authModel.register({
        name,
        regiment,
        batch_no,
        army_id,
        role,
        password: hashedPassword,
        status: 'Denied'
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

  // LOGIN
async login(req, res) {
  const { armyId, password } = req.body;
  console.log('Login attempt for armyId:', armyId);

  try {

    // ==============================================
    // 1. HARDCODED ADMIN LOGIN (skip database)
    // ==============================================
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

    // ==============================================
    // 2. NORMAL USER LOGIN FLOW (DB authentication)
    // ==============================================

    if (!armyId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Army ID and password'
      });
    }

    const user = await authModel.login(armyId);
    console.log('User found:', user ? 'Yes' : 'No');


    if (!user) {
      console.log('No user found with armyId:', armyId);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }


      
    if (user.status.toLowerCase() !== 'approved') {
      console.log('Account not approved. Status:', user.status);
      const message =
        user.role.toLowerCase() === 'student'
          ? "Account not approved. Please contact your instructor."
          : "Account not approved. Please contact admin.";

      return res.status(403).json({ success: false, message });
    }

    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ success: false, message: "Invalid credentials" });
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