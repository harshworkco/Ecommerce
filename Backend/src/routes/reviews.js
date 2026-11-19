const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect } = require("../middleware/authMiddleware");
const { getReviews, createReview } = require("../controllers/reviewController");

router.get("/:productId/reviews", getReviews);
router.post("/:productId/reviews", protect, createReview);

module.exports = router;
