const jwt = require("jsonwebtoken");
const { getSql } = require("../config/db");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const sql = getSql();
      const result = await sql`
        SELECT id, name, email, role, loyalty_points
        FROM users
        WHERE id = ${decoded.id}
      `;

      if (result.length === 0) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      req.user = result[0];
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

module.exports = { protect, admin };
