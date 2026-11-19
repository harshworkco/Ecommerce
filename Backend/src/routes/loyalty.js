const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getLoyaltyProfile,
  getLoyaltyTransactions,
  getAvailableRewards,
  redeemReward,
} = require("../controllers/loyaltyController");

router.get("/profile", protect, getLoyaltyProfile);
router.get("/transactions", protect, getLoyaltyTransactions);
router.get("/rewards", protect, getAvailableRewards);
router.post("/redeem", protect, redeemReward);

module.exports = router;
