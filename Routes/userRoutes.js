const express = require('express');
const router = express.Router();
const userController = require('../Controller/userController');

// GET all
router.get('/', userController.getAllUsers);

// GET user by ID
router.get('/id/:id', userController.getUserById);

// DOWNLOAD profile
router.get('/download-profile/:id', userController.downloadProfilePdf);

// CREATE user
router.post('/register', userController.createUser);

// SEARCH by role
router.get('/:role', userController.getByRole);

// SEARCH by batch number
router.get('/batch/:batch_no', userController.getByBatch);

// UPDATE status only
router.put('/:id/status', userController.setStatus);

// UPDATE user
router.put('/:id', userController.updateUser);

// DELETE user
router.delete('/:id', userController.deleteUser);

module.exports = router;
