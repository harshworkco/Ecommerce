require("dotenv").config();
const postgres = require("postgres");

let sql;
function getSql() {
  if (!sql) {
    const config = {
      ssl: { rejectUnauthorized: false },
      max: 20,
      connect_timeout: 10,
    };

    if (process.env.DATABASE_URL) {
      sql = postgres(process.env.DATABASE_URL, config);
    } else {
      sql = postgres({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || "postgres",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "",
        ...config,
      });
    }
  }
  return sql;
}

async function end() {
  if (sql) {
    await sql.end();
    sql = null;
  }
}

module.exports = { getSql, end };
