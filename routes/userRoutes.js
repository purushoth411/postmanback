const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateInput, checkValidation } = require('../middleware/validate');

// POST /api/users/login
router.post('/login', validateInput.login, checkValidation, userController.loginUser);
router.post('/register', validateInput.register, checkValidation, userController.registerUser);
router.post('/logout', userController.logoutUser); // Logout route


module.exports = router;
