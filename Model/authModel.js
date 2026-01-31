
const pool = require('../config/db');

const AuthModel = {
    // Find user by army_no
    async findByArmyNo(army_no) {
        try {
            console.log('Finding user by army_no:', army_no);
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE army_no = ?',
                [army_no]
            );
            console.log('User found:', rows[0] ? 'Yes' : 'No');
            return rows[0];
        } catch (error) {
            console.error('Error in findByArmyNo:', error);
            throw error;
        }
    },

    // Register new user
    async register(userData) {
        const { name, rank, unit, course_no, army_no, role, password, status } = userData;
        try {
            console.log('Registering new user with data:', {
                name,
                rank,
                unit,
                course_no,
                army_no,
                role,
                status,
                password: password ? '***' : 'undefined'
            });

            const [result] = await pool.query(
                `INSERT INTO users 
                 (\`name\`, \`rank\`, \`unit\`, \`course_no\`, \`army_no\`, \`role\`, \`password\`, \`status\`) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, rank, unit, course_no, army_no, role, password, status]
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
    async login(army_no) {
        try {
            console.log('Login attempt for army_no:', army_no);
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE army_no = ?',
                [army_no]
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