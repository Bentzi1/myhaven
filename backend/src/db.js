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

const migrationDirectoryPath = path.join(
  __dirname,
  "..",
  "db",
  "migrations"
);

function createChecksum(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function listMigrationFiles() {
  const entries = await fs.readdir(migrationDirectoryPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
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
  const connection = await mysql.createConnection({
    ...dbConfig,
    multipleStatements: true
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) NOT NULL,
        checksum CHAR(64) NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    const [appliedRows] = await connection.query(`
      SELECT filename, checksum
      FROM schema_migrations
      ORDER BY filename ASC
    `);
    const appliedMigrations = new Map(
      appliedRows.map((row) => [row.filename, row.checksum])
    );

    const migrationFiles = await listMigrationFiles();

    for (const filename of migrationFiles) {
      const migrationPath = path.join(migrationDirectoryPath, filename);
      const sql = await fs.readFile(migrationPath, "utf8");
      const checksum = createChecksum(sql);
      const appliedChecksum = appliedMigrations.get(filename);

      if (appliedChecksum) {
        if (appliedChecksum !== checksum) {
          throw new Error(
            `Migration ${filename} was modified after it was applied. ` +
              `Expected checksum ${appliedChecksum} but found ${checksum}.`
          );
        }

        continue;
      }

      await connection.query(sql);
      await connection.query(
        `
          INSERT INTO schema_migrations (
            filename,
            checksum,
            applied_at
          )
          VALUES (?, ?, UTC_TIMESTAMP())
        `,
        [filename, checksum]
      );
    }
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
