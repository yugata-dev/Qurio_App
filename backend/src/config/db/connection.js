import dotenv from "dotenv"
import pg from "pg"

dotenv.config({ quiet: true })

const { Pool } = pg

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.PORT) || 5432,
    max: 20, // maksimal 20 koneksi paralel
    idleTimeoutMillis: 30000 // koneksi idle keluar setelah 30 detik
})

// Penting: mencegah server crash bila ada error tak terduga dari koneksi DB
pool.on("error", (err) => {
    console.error("⚠️  Error tak terduga pada pool database:", err.message)
})

export default pool