require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./src/routes/auth");
const productRoutes = require("./src/routes/products");
const categoryRoutes = require("./src/routes/categories");
const cartRoutes = require("./src/routes/cart");
const wishlistRoutes = require("./src/routes/wishlist");
const orderRoutes = require("./src/routes/orders");
const reviewRoutes = require("./src/routes/reviews");
const adminRoutes = require("./src/routes/admin");
const flashSaleRoutes = require("./src/routes/flash-sales");
const loyaltyRoutes = require("./src/routes/loyalty");

const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", async (req, res) => {
  try {
    const { getSql } = require("./src/config/db");
    const sql = getSql();
    await sql`SELECT 1`;
    res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", error: error.message, timestamp: new Date().toISOString() });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/flash-sales", flashSaleRoutes);
app.use("/api/loyalty", loyaltyRoutes);

app.use(notFound);
app.use(errorHandler);

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

module.exports = app;
