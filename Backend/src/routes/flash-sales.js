const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const { getActiveFlashSales, createFlashSale } = require("../controllers/flashSaleController");

router.get("/", getActiveFlashSales);
router.post("/", protect, admin, createFlashSale);

module.exports = router;
