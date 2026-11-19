const { getSql } = require("../config/db");

const getReviews = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${req.params.productId}
      ORDER BY r.created_at DESC
    `;
    res.json({ reviews: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createReview = async (req, res) => {
  const sql = getSql();
  const { productId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  try {
    const existing = await sql`
      SELECT id FROM reviews WHERE product_id = ${productId} AND user_id = ${req.user.id}
    `;
    if (existing.length > 0) {
      return res.status(400).json({ message: "You already reviewed this product" });
    }

    const verified = await sql`
      SELECT 1
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ${req.user.id} AND oi.product_id = ${productId} AND o.payment_status = 'paid'
      LIMIT 1
    `;

    const result = await sql`
      INSERT INTO reviews (product_id, user_id, rating, comment, is_verified_purchase)
      VALUES (${productId}, ${req.user.id}, ${rating}, ${comment || null}, ${verified.length > 0})
      RETURNING *
    `;

    res.status(201).json({
      message: "Review created successfully",
      review: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getReviews,
  createReview,
};
