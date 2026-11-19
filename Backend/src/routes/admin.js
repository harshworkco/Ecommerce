const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getAllProductsAdmin,
  getAllUsers,
} = require("../controllers/adminController");

router.get("/dashboard", protect, admin, getDashboardStats);
router.get("/products", protect, admin, getAllProductsAdmin);
router.get("/users", protect, admin, getAllUsers);

module.exports = router;
