import pool from "./connection.js"
import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const files = [path.join(__dirname, "sql", "schema.sql")]

const readFiles = async () => {
    try {
        for (const file of files) {
            const data = fs.readFileSync(file, "utf-8")
            await pool.query(data)
            console.log(`✅ File ${path.basename(file)} berhasil dieksekusi.`);
        }
        console.log("🚀 Semua proses migrasi selesai dilakukan dengan sukses.");
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Query mengalami kegagalan:', err)
        await pool.end()
        process.exit(1)
    }
}

readFiles()