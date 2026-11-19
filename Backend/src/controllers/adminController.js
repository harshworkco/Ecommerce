const { getSql } = require("../config/db");

const getDashboardStats = async (req, res) => {
  const sql = getSql();

  try {
    const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;
    const totalProducts = await sql`SELECT COUNT(*) as count FROM products`;
    const totalOrders = await sql`SELECT COUNT(*) as count FROM orders`;
    const totalRevenue = await sql`
      SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE payment_status = 'paid'
    `;
    const lowStock = await sql`
      SELECT COUNT(*) as count FROM products WHERE stock <= 10 AND is_active = TRUE
    `;
    const recentOrders = await sql`
      SELECT o.*, u.name as user_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

    res.json({
      stats: {
        total_users: parseInt(totalUsers[0].count),
        total_products: parseInt(totalProducts[0].count),
        total_orders: parseInt(totalOrders[0].count),
        total_revenue: parseFloat(totalRevenue[0].revenue),
        low_stock_items: parseInt(lowStock[0].count),
      },
      recent_orders: recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllProductsAdmin = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `;
    res.json({ products: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT id, name, email, role, loyalty_points, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    res.json({ users: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllProductsAdmin,
  getAllUsers,
};
