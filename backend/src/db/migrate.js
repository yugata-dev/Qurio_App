const pool = require("./connection.js")
const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

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