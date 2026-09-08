import dotenv from "dotenv"
import pg from "pg"

dotenv.config({ quiet: true })

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL?.trim()

const databaseConfig = databaseUrl
    ? { connectionString: databaseUrl }
    : {
        user: process.env.PGUSER || process.env.DB_USER,
        host: process.env.PGHOST || process.env.DB_HOST,
        database: process.env.PGDATABASE || process.env.DB_NAME,
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
        port: Number(process.env.PGPORT || process.env.DB_PORT) || 5432
    }

const pool = new Pool({
    ...databaseConfig,
    max: 20, // maksimal 20 koneksi paralel
    idleTimeoutMillis: 30000 // koneksi idle keluar setelah 30 detik
})

// Penting: mencegah server crash bila ada error tak terduga dari koneksi DB
pool.on("error", (err) => {
    console.error("⚠️  Error tak terduga pada pool database:", err.message)
})

export default pool