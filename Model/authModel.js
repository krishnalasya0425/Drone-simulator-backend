
const pool = require('../config/db');

const AuthModel = {
    // Find user by army_id
    async findByArmyId(army_id) {
        try {
            console.log('Finding user by army_id:', army_id);
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE army_id = ?',
                [army_id]
            );
            console.log('User found:', rows[0] ? 'Yes' : 'No');
            return rows[0];
        } catch (error) {
            console.error('Error in findByArmyId:', error);
            throw error;
        }
    },

    // Register new user
    async register(userData) {
        const { name, regiment, batch_no, army_id, role, password, status } = userData;
        try {
            console.log('Registering new user with data:', { 
                name, 
                regiment, 
                batch_no, 
                army_id, 
                role, 
                status,
                password: password ? '***' : 'undefined'
            });
            
            const [result] = await pool.query(
                `INSERT INTO users 
                 (name, regiment, batch_no, army_id, role, password, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [name, regiment, batch_no, army_id, role, password, status]
            );
            
            console.log('Registration successful, insertId:', result.insertId);
            return result;
        } catch (error) {
            console.error('Error in register:', {
                message: error.message,
                code: error.code,
                sqlMessage: error.sqlMessage,
                sql: error.sql
            });
            throw error;
        }
    },

    // Login user
    async login(army_id) {
        try {
            console.log('Login attempt for army_id:', army_id);
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE army_id = ?',
                [army_id]
            );
            console.log('Login result:', rows[0] ? 'User found' : 'User not found');
            return rows[0];
        } catch (error) {
            console.error('Error in login:', error);
            throw error;
        }
    }
};

module.exports = AuthModel;