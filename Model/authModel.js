const pool = require('../config/db');

const AuthModel = {

    // Find user by army_id
   async login(req,res){
    const { army_id} = req.body;
    const [rows] =  await pool.query(
      `SELECT * FROM users WHERE army_id = ?`,
      [army_id]
    );
    return rows;
   }    
};

module.exports = AuthModel;