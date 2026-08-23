import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;
dotenv.config();

const POSTGRES_HOST = process.env.DB_HOST;
const POSTGRES_USER = process.env.DB_USER;
const POSTGRES_PASSWORD = process.env.DB_PASSWORD;
const POSTGRES_DB = process.env.DB_NAME;
const PORT = process.env.PORT;

const pool = new Pool({
  user: POSTGRES_USER,
  host: POSTGRES_HOST,
  database: POSTGRES_DB,
  password: POSTGRES_PASSWORD,
  port: PORT,
  max: 20, // maksimal 20 client
  idleTimeoutMillis: 30000 // client akan keluar dalam waktu 30 detik
});

// pool.query('SELECT NOW()', (err, res) => {
//   if (err) {
//     console.error('❌ ERROR:', err.message);
//     console.error('Code:', err.code);
//     process.exit(1);
//   } else {
//     console.log('✅ BERHASIL CONNECT! Waktu server:', res.rows[0]);
//     process.exit(0);
//   }
// });

// pool.on("error", (err) => {
//   console.error("Error tak terduga di cilent database", err.message)
// })

export default pool