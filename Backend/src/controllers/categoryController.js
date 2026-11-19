const { getSql } = require("../config/db");

const getAllCategories = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.name
    `;
    res.json({ categories: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createCategory = async (req, res) => {
  const sql = getSql();
  const { name, description, image_url } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  try {
    const result = await sql`
      INSERT INTO categories (name, slug, description, image_url)
      VALUES (${name}, ${slug}, ${description || null}, ${image_url || null})
      RETURNING *
    `;

    res.status(201).json({
      message: "Category created successfully",
      category: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCategory = async (req, res) => {
  const sql = getSql();
  const allowedFields = ["name", "description", "image_url", "is_active"];

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

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  try {
    const result = await sql`
      UPDATE categories
      SET ${sql(updates, ...Object.keys(updates))}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category: result[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const sql = getSql();

  try {
    const result = await sql`
      UPDATE categories
      SET is_active = FALSE
      WHERE id = ${req.params.id}
      RETURNING id
    `;
    if (result.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
