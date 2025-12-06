const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');

const loginUser = async (req, res) => {
    try {
      console.log('Login attempt with data:', req.body);
      
        const { email, userpass } = req.body;

        if (!email || !userpass)
            return res.status(400).json({ status: false, message: 'Email and Password are required' });

        userModel.getUserByEmail(email, async (err, user) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ status: false, message: 'Server error' });
            }
            console.log('Fetched user:', user);

            if (!user) {
                return res.status(401).json({ status: false, message: 'Invalid email or password' });
            }

            // Check if password is hashed (starts with $2b$) or plain text (for migration)
            // Database column is 'password', not 'userpass'
            const storedPassword = user.password || user.userpass; // Support both field names
            const isHashed = storedPassword && storedPassword.startsWith('$2b$');
            let passwordMatch = false;

            if (isHashed) {
                // Compare with hashed password
                passwordMatch = await bcrypt.compare(userpass, storedPassword);
            } else {
                // Legacy: compare plain text (for existing users)
                // In production, you should migrate all passwords to hashed
                passwordMatch = userpass === storedPassword;
                
                // If match and not hashed, upgrade to hashed password
                if (passwordMatch) {
                    const hashedPassword = await bcrypt.hash(userpass, 10);
                    // Update password in database
                    const updateSql = "UPDATE tbl_users SET password = ? WHERE id = ?";
                    const db = require('../config/db');
                    db.query(updateSql, [hashedPassword, user.id], (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating password:', updateErr);
                        }
                    });
                }
            }

            if (!passwordMatch) {
                return res.status(401).json({ status: false, message: 'Incorrect Password' });
            }

            // Create session
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
            };

            // Remove password from response
            const { password: _, userpass: __, ...userData } = user;
            return res.json({ 
                status: true, 
                message: 'Login successful', 
                user: userData 
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, userpass } = req.body;

    if (!name || !email || !userpass) {
      return res.json({ status: false, message: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({ status: false, message: "Invalid email format" });
    }

    // Validate password strength (minimum 6 characters)
    if (userpass.length < 6) {
      return res.json({ status: false, message: "Password must be at least 6 characters long" });
    }

    userModel.checkEmailExists(email, async (err, exists) => {
      if (err) return res.json({ status: false, message: "Database error" });

      if (exists) {
        return res.json({ status: false, message: "Email already registered" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userpass, 10);

      // Step 1: Insert user with hashed password
      userModel.insertUser(name, email, hashedPassword, (err, userId) => {
        if (err) return res.json({ status: false, message: "Error inserting user" });

        // Step 2: Create default workspace + assign owner role
        userModel.createWorkspace(userId, (err, workspaceId) => {
          if (err) return res.json({ status: false, message: "Error creating workspace" });

          // Create session for newly registered user
          req.session.user = {
            id: userId,
            name,
            email,
          };

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



const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ status: false, message: 'Error logging out' });
    }
    res.clearCookie('session_cookie_name');
    return res.json({ status: true, message: 'Logged out successfully' });
  });
};

module.exports = {
    loginUser,
    getAllUsers,
    getUserCount,
    registerUser,
    logoutUser,
};
