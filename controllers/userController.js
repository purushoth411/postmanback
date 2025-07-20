const userModel = require('../models/userModel');

const loginUser = (req, res) => {
    const { email, userpass } = req.body;

    if (!email || !userpass)
        return res.status(400).json({ message: 'Username and Password are required' });

    userModel.getUserByEmail(email, (err, user) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ status : false , message: 'Server error' });
        }

        if (!user) {
            return res.status(401).json({ status : false , message: 'Invalid username or password' });
        }
        // remove password from the response
        const { userpass: _, ...userData } = user;
        return res.json({ status : true , message: 'Login successful', user: userData });
    });
};






const getAllUsers = (req, res) => {
  const filters = req.body.filters || {};
  

  userModel.getAllUsers(filters, (err, users) => {
    if (err) {
      return res.status(500).json({ status: false, message: "Error: " + err });
    }

    return res.json({ status: true, message: "Success", data: users });
  });
};

const getUserCount = (req, res) => {
  userModel.getUserCount((err, counts) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'Error: ' + err });
    }
    return res.json({ status: true, data: counts });
  });
};


const getAllUsersIncludingAdmin = (req, res) =>{
    userModel.getAllUsersIncludingAdmin((err, users) => {
        if(err){
           return res.status(500).json({status : false, message : "an error occured" + err})
        }

        return res.json({status: true, message : "Success" , data: users})
    })
}

// Add user
const addUser = (req, res) => {
    const { name, email, password, user_type } = req.body;
    if (!name || !email || !password || !user_type) {
        return res.status(400).json({ status: false, message: 'All fields are required' });
    }

    userModel.getUserByEmail(email, (err, existingUser) => {
        if (err) {
            return res.status(500).json({ status: false, message: 'Error checking email: ' + err });
        }

        if (existingUser) {
            return res.status(409).json({ status: false, message: 'Email already exists' });
        }

        // Email not found, proceed to add user
        userModel.addUser(req.body, (err, result) => {
            if (err) {
                return res.status(500).json({ status: false, message: 'Failed to add user: ' + err });
            }
            return res.json({ status: true, message: 'User added successfully', insertId: result.insertId });
        });
    });
};

// Update user
const updateUser = (req, res) => {
    const { id } = req.params;
    const { name, email, password, user_type } = req.body;
    if (!name || !email || !password || !user_type) {
        return res.status(400).json({ status: false, message: 'All fields are required' });
    }

    userModel.updateUser(id, req.body, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: 'Failed to update user: ' + err });
        }
        return res.json({ status: true, message: 'User updated successfully' });
    });
};

// Delete user
const deleteUser = (req, res) => {
    const { id } = req.params;
    userModel.deleteUser(id, (err, result) => {
        if (err) {
            return res.status(500).json({ status: false, message: 'Failed to delete user: ' + err });
        }
        return res.json({ status: true, message: 'User deleted successfully' });
    });
};
module.exports = {
    loginUser,
    getAllUsers,
    getUserCount,
    getAllUsersIncludingAdmin,
    addUser,
    updateUser,
    deleteUser
};
