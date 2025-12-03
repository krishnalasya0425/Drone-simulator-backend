const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET ;


exports.authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    // Attach decoded info to request
    req.user = decoded;
    next(); // Proceed to the next middleware or route handler
  });
};
