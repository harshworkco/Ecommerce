const { getSql } = require("../config/db");

const getAllProducts = async (req, res) => {
  const sql = getSql();
  const {
    page = 1,
    limit = 20,
    category,
    search,
    minPrice,
    maxPrice,
    sort = "created_at",
    order = "DESC",
    featured,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const validSorts = ["created_at", "name", "price", "stock"];
  const validOrders = ["ASC", "DESC"];
  const sortField = validSorts.includes(sort) ? sort : "created_at";
  const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : "DESC";

  try {
    const result = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             COALESCE((
               SELECT ROUND(AVG(r.rating)::numeric, 1)::float8
               FROM reviews r WHERE r.product_id = p.id
             ), 0) as average_rating,
             COALESCE((
               SELECT COUNT(*)::int FROM reviews r WHERE r.product_id = p.id
             ), 0) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      ${category ? sql`AND c.slug = ${category}` : sql``}
      ${search ? sql`AND (p.name ILIKE ${`%${search}%`} OR p.description ILIKE ${`%${search}%`})` : sql``}
      ${minPrice ? sql`AND p.price >= ${minPrice}` : sql``}
      ${maxPrice ? sql`AND p.price <= ${maxPrice}` : sql``}
      ${featured === "true" ? sql`AND p.is_featured = TRUE` : sql``}
      ORDER BY p.${sql.unsafe(sortField)} ${sql.unsafe(sortOrder)}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      ${category ? sql`AND c.slug = ${category}` : sql``}
      ${search ? sql`AND (p.name ILIKE ${`%${search}%`} OR p.description ILIKE ${`%${search}%`})` : sql``}
      ${minPrice ? sql`AND p.price >= ${minPrice}` : sql``}
      ${maxPrice ? sql`AND p.price <= ${maxPrice}` : sql``}
      ${featured === "true" ? sql`AND p.is_featured = TRUE` : sql``}
    `;

    const total = parseInt(countResult[0].total);

    res.json({
      products: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductById = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${req.params.id}
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = await sql`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${req.params.id}
      ORDER BY r.created_at DESC
    `;

    const product = result[0];
    product.reviews = reviews;
    product.review_count = reviews.length;
    product.average_rating =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) /
              reviews.length
            ).toFixed(1)
          )
        : 0;

    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createProduct = async (req, res) => {
  const sql = getSql();
  const {
    category_id,
    name,
    description,
    short_description,
    price,
    discount_price,
    stock,
    sku,
    image_url,
    images,
    is_featured,
    weight,
    dimensions,
  } = req.body;

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  try {
    const result = await sql`
      INSERT INTO products (
        category_id, name, slug, description, short_description, price,
        discount_price, stock, sku, image_url, images, is_featured,
        weight, dimensions
      ) VALUES (
        ${category_id || null},
        ${name},
        ${slug},
        ${description || null},
        ${short_description || null},
        ${price},
        ${discount_price || null},
        ${stock || 0},
        ${sku || null},
        ${image_url || null},
        ${images || []},
        ${is_featured || false},
        ${weight || null},
        ${dimensions ? JSON.stringify(dimensions) : null}
      )
      RETURNING *
    `;

    res.status(201).json({
      message: "Product created successfully",
      product: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const sql = getSql();
  const allowedFields = [
    "category_id",
    "name",
    "description",
    "short_description",
    "price",
    "discount_price",
    "stock",
    "sku",
    "image_url",
    "images",
    "is_featured",
    "is_active",
    "weight",
    "dimensions",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (updates.name !== undefined) {
    updates.slug = String(updates.name)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
  if (updates.dimensions && typeof updates.dimensions === "object") {
    updates.dimensions = JSON.stringify(updates.dimensions);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  try {
    const result = await sql`
      UPDATE products
      SET ${sql(updates, ...Object.keys(updates))}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`DELETE FROM products WHERE id = ${req.params.id} RETURNING id`;
    if (result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getFeaturedProducts = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             COALESCE((
               SELECT ROUND(AVG(r.rating)::numeric, 1)::float8
               FROM reviews r WHERE r.product_id = p.id
             ), 0) as average_rating,
             COALESCE((
               SELECT COUNT(*)::int FROM reviews r WHERE r.product_id = p.id
             ), 0) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE AND p.is_featured = TRUE
      LIMIT 8
    `;
    res.json({ products: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
};
