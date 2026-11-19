const { getSql } = require("../config/db");

const getCart = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT c.id, c.quantity, c.created_at,
             p.id as product_id, p.name, p.price, p.discount_price,
             p.stock, p.image_url, p.slug
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ${req.user.id} AND p.is_active = TRUE
      ORDER BY c.created_at DESC
    `;

    let total = 0;
    const items = result.map((item) => {
      const unitPrice = item.discount_price || item.price;
      const itemTotal = unitPrice * item.quantity;
      total += itemTotal;
      return {
        ...item,
        unit_price: unitPrice,
        total_price: itemTotal,
        in_stock: item.stock > 0,
        available_quantity: item.stock,
      };
    });

    res.json({
      items,
      total,
      item_count: items.reduce((sum, i) => sum + i.quantity, 0),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addToCart = async (req, res) => {
  const sql = getSql();
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const productResult = await sql`
      SELECT id, stock, is_active FROM products WHERE id = ${product_id}
    `;

    if (productResult.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = productResult[0];
    if (!product.is_active) {
      return res.status(400).json({ message: "Product is not available" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available in stock`,
      });
    }

    const existing = await sql`
      SELECT id, quantity FROM cart
      WHERE user_id = ${req.user.id} AND product_id = ${product_id}
    `;

    let result;
    if (existing.length > 0) {
      const newQty = existing[0].quantity + quantity;
      if (product.stock < newQty) {
        return res.status(400).json({
          message: `Only ${product.stock} items available in stock`,
        });
      }
      result = await sql`
        UPDATE cart
        SET quantity = ${newQty}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
    } else {
      result = await sql`
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES (${req.user.id}, ${product_id}, ${quantity})
        RETURNING *
      `;
    }

    res.status(201).json({
      message: "Added to cart successfully",
      cart_item: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCartItem = async (req, res) => {
  const sql = getSql();
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }

  try {
    const cartItem = await sql`
      SELECT c.id, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.id = ${req.params.id} AND c.user_id = ${req.user.id}
    `;

    if (cartItem.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (cartItem[0].stock < quantity) {
      return res.status(400).json({
        message: `Only ${cartItem[0].stock} items available in stock`,
      });
    }

    await sql`
      UPDATE cart
      SET quantity = ${quantity}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id}
    `;

    res.json({ message: "Cart item updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      DELETE FROM cart
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
      RETURNING id
    `;
    if (result.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.json({ message: "Removed from cart successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const clearCart = async (req, res) => {
  const sql = getSql();

  try {
    await sql`DELETE FROM cart WHERE user_id = ${req.user.id}`;
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
