import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env"), quiet: true });

if (process.env.NODE_ENV === "production") {
    console.error("[migration] Migrasi otomatis ditolak di production.");
    process.exit(1);
}

const { default: pool } = await import("./connection.js");
const migrationsDir = join(__dirname, "../../db/migrations");

async function ensureMigrationTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function runMigrations() {
    try {
        await ensureMigrationTable();

        const files = fs
            .readdirSync(migrationsDir)
            .filter((file) => file.endsWith(".sql"))
            .sort((first, second) =>
                first.localeCompare(second, undefined, { numeric: true }),
            );

        for (const file of files) {
            const existingMigration = await pool.query(
                "SELECT 1 FROM _migrations WHERE name = $1",
                [file],
            );

            if (existingMigration.rows.length > 0) {
                console.log(`[migration] ${file} sudah dijalankan.`);
                continue;
            }

            const sql = fs.readFileSync(join(migrationsDir, file), "utf-8");
            await pool.query(sql);
            await pool.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
            console.log(`[migration] ${file} berhasil dijalankan.`);
        }

        console.log("[migration] Semua migrasi selesai.");
    } finally {
        await pool.end();
    }
}

runMigrations().catch((error) => {
    console.error("[migration] Proses migrasi gagal:", error.message);
    process.exitCode = 1;
});