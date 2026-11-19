const { getSql } = require("../config/db");

const getActiveFlashSales = async (req, res) => {
  const sql = getSql();

  try {
    const now = new Date().toISOString();
    const result = await sql`
      SELECT fs.*,
             p.name, p.price, p.image_url, p.slug,
             (p.price * (1 - fs.discount_percent / 100.0)) as sale_price
      FROM flash_sales fs
      JOIN products p ON fs.product_id = p.id
      WHERE fs.is_active = TRUE
        AND fs.start_date <= ${now}
        AND fs.end_date >= ${now}
        AND p.is_active = TRUE
      ORDER BY fs.end_date ASC
    `;
    res.json({ flash_sales: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createFlashSale = async (req, res) => {
  const sql = getSql();
  const { product_id, discount_percent, start_date, end_date, max_quantity_per_user } = req.body;

  if (!product_id || !discount_percent || !start_date || !end_date) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const productExists = await sql`SELECT id FROM products WHERE id = ${product_id}`;
    if (productExists.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const result = await sql`
      INSERT INTO flash_sales (product_id, discount_percent, start_date, end_date, max_quantity_per_user)
      VALUES (${product_id}, ${discount_percent}, ${start_date}, ${end_date}, ${max_quantity_per_user || 5})
      RETURNING *
    `;

    res.status(201).json({
      message: "Flash sale created successfully",
      flash_sale: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getActiveFlashSales,
  createFlashSale,
};
