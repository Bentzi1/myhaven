const mysql = require("mysql2/promise");

const defaultHost =
  process.env.MYSQL_HOST || (process.env.DEVCONTAINER_ROLE ? "db" : "127.0.0.1");

const pool = mysql.createPool({
  host: defaultHost,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "myhaven",
  password: process.env.MYSQL_PASSWORD || "myhaven",
  database: process.env.MYSQL_DATABASE || "myhaven",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = {
  checkDatabaseConnection,
  pool
};
