const authModel = require('../Model/authModel');
const bcrypt = require('bcrypt');
const userModel = require('../Model/userModel');


const AuthController = {

    // LOGIN
    async login(req, res) {
        const { armyId, password } = req.body;
         try {
           // Find the user by email
           const user = await authModel.login(armyId);
           if (!user) return res.status(401).json({ message: 'Invalid credentials' });
       
           // Compare password
           const isMatch = await bcrypt.compare(password, user.password);
           if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
       
           // Create JWT with emp_id, role, department, and email
           const JWT_SECRET = process.env.JWT_SECRET;
         const token = jwt.sign(
         { 
           id: user.emp_id, 
           role: user.role, 
          batchNo: user.batchNo,
         },
         JWT_SECRET,
         { expiresIn: '7d' } // <- Changed from '1h' to '7d'
       );
       
       
           // Set token in HTTP-only cookie
           res.cookie('token', token, { 
             httpOnly: true, 
             secure: process.env.NODE_ENV === 'production' 
           });
           
           // Return token and user details in the response
           res.json({ 
             message: 'Logged in successfully',
             token,
             id: user.id,
             role: user.role,
             batchNo: user.batchNo
           });
         } catch (error) {
           console.error(error);
           res.status(500).json({ message: 'Server error' });
         }
        }
};

module.exports = AuthController;