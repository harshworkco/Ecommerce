const { getSql } = require("../config/db");

const createOrder = async (req, res) => {
  const sql = getSql();
  const {
    shipping_address,
    billing_address,
    payment_method,
    notes,
    loyalty_points_used = 0,
  } = req.body;

  if (!shipping_address || !payment_method) {
    return res.status(400).json({
      message: "Shipping address and payment method are required",
    });
  }

  try {
    const cartResult = await sql`
      SELECT c.id, c.quantity, p.id as product_id, p.name as product_name,
             COALESCE(p.discount_price, p.price) as price, p.price as list_price,
             p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ${req.user.id} AND p.is_active = TRUE
    `;

    if (cartResult.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let subtotal = 0;
    for (const item of cartResult) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.product_name}`,
        });
      }
      subtotal += item.price * item.quantity;
    }

    const tax = Math.round((subtotal * 0.1) * 100) / 100;
    const shipping_cost = subtotal > 100 ? 0 : 10;

    let discount_amount = 0;
    const pointsToDeduct = parseInt(loyalty_points_used) || 0;
    if (pointsToDeduct > 0) {
      const userResult = await sql`SELECT loyalty_points FROM users WHERE id = ${req.user.id}`;
      if (pointsToDeduct > userResult[0].loyalty_points) {
        return res.status(400).json({ message: "Insufficient loyalty points" });
      }
      discount_amount = pointsToDeduct / 20;
    }

    const total = subtotal + tax + shipping_cost - discount_amount;

    const orderNumber = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    let createdOrderId = null;

    await sql.begin(async (sql) => {
      const orderResult = await sql`
        INSERT INTO orders (
          user_id, order_number, total, subtotal, tax, shipping_cost,
          discount_amount, loyalty_points_used, shipping_address,
          billing_address, payment_method, notes, status, payment_status
        ) VALUES (
          ${req.user.id}, ${orderNumber}, ${total}, ${subtotal}, ${tax},
          ${shipping_cost}, ${discount_amount}, ${pointsToDeduct},
          ${shipping_address}, ${billing_address || null}, ${payment_method},
          ${notes || null}, ${"pending"}, ${"pending"}
        )
        RETURNING *
      `;

      const order = orderResult[0];
      createdOrderId = order.id;

      for (const item of cartResult) {
        const unitPrice = item.price;
        const itemTotal = unitPrice * item.quantity;
        await sql`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total)
          VALUES (${order.id}, ${item.product_id}, ${item.product_name}, ${item.quantity}, ${unitPrice}, ${itemTotal})
        `;
        await sql`
          UPDATE products SET stock = stock - ${item.quantity} WHERE id = ${item.product_id}
        `;
      }

      const pointsEarned = Math.floor(total / 10);
      await sql`
        UPDATE users
        SET loyalty_points = loyalty_points + ${pointsEarned} - ${pointsToDeduct}
        WHERE id = ${req.user.id}
      `;

      await sql`
        INSERT INTO loyalty_transactions (user_id, type, points, description, order_id)
        VALUES (${req.user.id}, ${"earn"}, ${pointsEarned}, ${`Points earned for order ${orderNumber}`}, ${order.id})
      `;

      if (pointsToDeduct > 0) {
        await sql`
          INSERT INTO loyalty_transactions (user_id, type, points, description, order_id)
          VALUES (${req.user.id}, ${"redeem"}, ${-pointsToDeduct}, ${`Points redeemed for order ${orderNumber}`}, ${order.id})
        `;
      }

      await sql`DELETE FROM cart WHERE user_id = ${req.user.id}`;
    });

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: createdOrderId,
        order_number: orderNumber,
        subtotal,
        tax,
        shipping_cost,
        discount_amount,
        total,
        loyalty_points_earned: Math.floor(total / 10),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMyOrders = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT * FROM orders
      WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC
    `;
    res.json({ orders: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOrderById = async (req, res) => {
  const sql = getSql();

  try {
    const orderResult = await sql`
      SELECT * FROM orders
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
    if (orderResult.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const itemsResult = await sql`
      SELECT * FROM order_items WHERE order_id = ${req.params.id}
    `;

    res.json({
      order: { ...orderResult[0], items: itemsResult },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  const sql = getSql();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const result = await sql`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${status ? sql`WHERE o.status = ${status}` : sql``}
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    res.json({ orders: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const sql = getSql();
  const { status, payment_status } = req.body;

  if (!status && !payment_status) {
    return res.status(400).json({
      message: "Status or payment status is required",
    });
  }

  const allowedStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }
  if (payment_status && !allowedPaymentStatuses.includes(payment_status)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }

  try {
    let result;
    if (status && payment_status) {
      result = await sql`
        UPDATE orders
        SET status = ${status}, payment_status = ${payment_status},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${req.params.id}
        RETURNING *
      `;
    } else if (status) {
      result = await sql`
        UPDATE orders
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${req.params.id}
        RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE orders
        SET payment_status = ${payment_status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${req.params.id}
        RETURNING *
      `;
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated successfully",
      order: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
