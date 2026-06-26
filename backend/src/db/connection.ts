import knex from "knex";
import fs from "fs";
import path from "path";

const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
});

export async function runMigrations() {
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await db.raw(sql);
  console.log("[migration] Schema executado com sucesso");
}

export default db;
