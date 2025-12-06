// Authentication middleware to protect routes
const authMiddleware = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.id) {
    // Attach user info to request for easy access
    req.user = req.session.user;
    next();
  } else {
    return res.status(401).json({ 
      status: false, 
      message: 'Authentication required. Please login.' 
    });
  }
};

module.exports = authMiddleware;

