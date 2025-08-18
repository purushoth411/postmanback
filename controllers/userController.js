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

const registerUser = (req, res) => {
  try {
    const { name, email, userpass } = req.body;

    if (!name || !email || !userpass) {
      return res.json({ status: false, message: "All fields are required" });
    }

    userModel.checkEmailExists(email, (err, exists) => {
      if (err) return res.json({ status: false, message: "Database error" });

      if (exists) {
        return res.json({ status: false, message: "Email already registered" });
      }

      // Step 1: Insert user
      userModel.insertUser(name, email, userpass, (err, userId) => {
        if (err) return res.json({ status: false, message: "Error inserting user" });

        // Step 2: Create default workspace + assign owner role
        userModel.createWorkspace(userId, (err, workspaceId) => {
          if (err) return res.json({ status: false, message: "Error creating workspace" });

          return res.json({
            status: true,
            message: "User registered successfully",
            user: {
              id: userId,
              name,
              email,
              workspace_id: workspaceId,
              role: "OWNER",
            },
          });
        });
      });
    });
  } catch (error) {
    console.error("Unexpected Error:", error);
    return res.json({ status: false, message: "Something went wrong" });
  }
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



module.exports = {
    loginUser,
    getAllUsers,
    getUserCount,
    registerUser,
};
