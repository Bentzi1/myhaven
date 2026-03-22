const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");
const { defaultPolicyVersion } = require("./policyContent");

const defaultHost =
  process.env.MYSQL_HOST || (process.env.DEVCONTAINER_ROLE ? "db" : "127.0.0.1");

const dbConfig = {
  host: defaultHost,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "myhaven",
  password: process.env.MYSQL_PASSWORD || "myhaven",
  database: process.env.MYSQL_DATABASE || "myhaven"
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const migrationPath = path.join(
  __dirname,
  "..",
  "db",
  "migrations",
  "001_initial_auth_schema.sql"
);

function createChecksum(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function checkDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

async function ensureDatabaseSchema() {
  const sql = await fs.readFile(migrationPath, "utf8");
  const connection = await mysql.createConnection({
    ...dbConfig,
    multipleStatements: true
  });

  try {
    await connection.query(sql);
  } finally {
    await connection.end();
  }

  const tosChecksum = createChecksum(defaultPolicyVersion.termsOfService.join("\n"));
  const privacyChecksum = createChecksum(defaultPolicyVersion.privacyHighlights.join("\n"));

  await pool.query(
    `
      INSERT INTO policy_versions (
        version_label,
        tos_checksum,
        privacy_checksum,
        is_active,
        published_at
      )
      VALUES (?, ?, ?, 1, UTC_TIMESTAMP())
      ON DUPLICATE KEY UPDATE
        tos_checksum = VALUES(tos_checksum),
        privacy_checksum = VALUES(privacy_checksum)
    `,
    [defaultPolicyVersion.versionLabel, tosChecksum, privacyChecksum]
  );

  await pool.query(
    `
      UPDATE policy_versions
      SET is_active = CASE WHEN version_label = ? THEN 1 ELSE 0 END
    `,
    [defaultPolicyVersion.versionLabel]
  );
}

async function getActivePolicyVersion() {
  const [rows] = await pool.query(
    `
      SELECT id, version_label, published_at
      FROM policy_versions
      WHERE is_active = 1
      ORDER BY published_at DESC, id DESC
      LIMIT 1
    `
  );

  return rows[0] || null;
}

module.exports = {
  checkDatabaseConnection,
  dbConfig,
  ensureDatabaseSchema,
  getActivePolicyVersion,
  pool
};
