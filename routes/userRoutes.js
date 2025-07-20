const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users/login
router.post('/login', userController.loginUser);
router.post('/getallusers', userController.getAllUsers);
router.get('/getusercount', userController.getUserCount);

router.get('/allusers', userController.getAllUsersIncludingAdmin);


router.post('/add', userController.addUser);

router.put('/update/:id', userController.updateUser);

router.delete('/delete/:id', userController.deleteUser);

module.exports = router;
