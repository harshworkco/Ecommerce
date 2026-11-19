const { getSql } = require("../config/db");

const getWishlist = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT w.id, w.created_at,
             p.id as product_id, p.name, p.price, p.discount_price,
             p.stock, p.image_url, p.slug
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ${req.user.id} AND p.is_active = TRUE
      ORDER BY w.created_at DESC
    `;
    res.json({ items: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addToWishlist = async (req, res) => {
  const sql = getSql();
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const productExists = await sql`
      SELECT id FROM products WHERE id = ${product_id} AND is_active = TRUE
    `;
    if (productExists.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = await sql`
      SELECT id FROM wishlist WHERE user_id = ${req.user.id} AND product_id = ${product_id}
    `;
    if (existing.length > 0) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    const result = await sql`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (${req.user.id}, ${product_id})
      RETURNING *
    `;

    res.status(201).json({
      message: "Added to wishlist successfully",
      item: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      DELETE FROM wishlist
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
      RETURNING id
    `;
    if (result.length === 0) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }
    res.json({ message: "Removed from wishlist successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
