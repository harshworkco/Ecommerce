const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getSql } = require("../config/db");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const sql = getSql();

  try {
    const userExists = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (userExists.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await sql`
      INSERT INTO users (name, email, password, phone, role, loyalty_points)
      VALUES (${name}, ${email}, ${hashedPassword}, ${phone || null}, ${"customer"}, ${0})
      RETURNING id, name, email, role, loyalty_points, created_at
    `;

    const user = result[0];

    res.status(201).json({
      message: "User registered successfully",
      user,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const sql = getSql();

  try {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        loyalty_points: user.loyalty_points,
      },
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProfile = async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      loyalty_points: req.user.loyalty_points,
    },
  });
};

const updateProfile = async (req, res) => {
  const { name, phone, address } = req.body;
  const sql = getSql();

  try {
    const result = await sql`
      UPDATE users
      SET name = COALESCE(${name}, name),
          phone = COALESCE(${phone}, phone),
          address = COALESCE(${address}, address),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.user.id}
      RETURNING id, name, email, role, loyalty_points, phone, address
    `;

    res.json({
      message: "Profile updated successfully",
      user: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const sql = getSql();

  try {
    const result = await sql`SELECT password FROM users WHERE id = ${req.user.id}`;
    const user = result[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await sql`
      UPDATE users
      SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.user.id}
    `;

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
