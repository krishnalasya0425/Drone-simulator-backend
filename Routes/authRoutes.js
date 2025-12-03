const express = require('express');
const router = express.Router();
const authController = require('../Controller/authController'); 




// LOGIN
router.post('/login', authController.login);    



module.exports = router;