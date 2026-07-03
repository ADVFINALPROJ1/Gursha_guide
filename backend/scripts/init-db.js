const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize the database");
  }

  const schemaPath = path.join(__dirname, "..", "..", "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  await client.query(schemaSql);
  await client.end();

  console.log("Database schema initialized");
}

initDatabase().catch((error) => {
  console.error("Database initialization failed:", error);
  process.exit(1);
});
