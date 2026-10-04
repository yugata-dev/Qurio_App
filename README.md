# Qurio

Qurio adalah aplikasi untuk membantu guru memahami partisipasi dan pemahaman murid. Fokus produk: **Transparansi Intelektual Murid**.

## Fitur

- Kuis interaktif dan polling kelas.
- Word Cloud dan tanya jawab langsung.
- Analitik kehadiran, skor, aktivitas, dan topik sulit.
- Ekspor laporan analitik CSV dan PDF.

## Teknologi

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Recharts.
- Backend: Node.js, Express, Socket.IO, PostgreSQL.
- Frontend dapat di-deploy ke Vercel; backend dijalankan sebagai service terpisah.

## Struktur

```text
frontend/                 Aplikasi Next.js
backend/                  API Express, Socket.IO, migrasi dan seed development
docs/                     Dokumentasi dan Postman globals
postman/                  Postman globals
.github/instructions/     Instruksi kontribusi untuk workspace
vercel.json               Konfigurasi build frontend dari root monorepo
```

## Prasyarat

- Node.js dan npm yang kompatibel dengan versi dependency di setiap `package.json`.
- PostgreSQL untuk backend.

## Menjalankan Lokal

Dari root repository, install dependency:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

Salin template environment dan isi placeholder pada file lokal. Jangan commit file hasil salinan:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Variabel frontend:

| Nama                  | Fungsi                                  |
| --------------------- | --------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL dasar backend yang dipakai browser. |

Variabel backend:

| Nama                                                      | Fungsi                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`                                            | URL koneksi PostgreSQL; gunakan ini atau konfigurasi `DB_*`.    |
| `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT` | Parameter koneksi PostgreSQL saat `DATABASE_URL` tidak dipakai. |
| `PORT`, `SERVER_PORT`                                     | Port HTTP; `PORT` diprioritaskan.                               |
| `NODE_ENV`                                                | Mode runtime, misalnya development atau production.             |
| `FRONTEND_URL`                                            | Daftar origin frontend yang diizinkan, dipisahkan koma.         |
| `JWT_SECRET`                                              | Kunci acak berentropi tinggi untuk tanda tangan JWT.            |

Satu-satunya runner migrasi berada di `backend/src/config/database/migrate.js`. Jalankan migrasi di lingkungan non-production:

```bash
npm run migrate --prefix backend
```

Jalankan frontend dan backend bersama-sama dari root:

```bash
npm run dev
```

Frontend tersedia di `http://localhost:3000`; backend menggunakan port dari konfigurasi environment. Untuk menjalankan satu aplikasi, gunakan `npm run dev --prefix frontend` atau `npm run dev --prefix backend`.

### Seed Data Demo

Generator data demo tidak disertakan di repository publik. Salinan lokal lama, bila ada, tetap diabaikan Git dan hanya boleh digunakan pada database development yang boleh dihapus.

## Deploy

### Frontend

Konfigurasi `vercel.json` menganggap root repository sebagai Root Directory Vercel dan menjalankan install/build pada `frontend/`. Atur `NEXT_PUBLIC_API_URL` di environment project Vercel.

### Backend

Deploy backend sebagai service terpisah. Atur variabel database, `JWT_SECRET`, `NODE_ENV`, port, dan `FRONTEND_URL` pada environment service tersebut.

**Catatan migrasi:** migrasi tidak berjalan otomatis saat server start. Runner menolak `NODE_ENV=production`; siapkan prosedur rilis migrasi production yang terkontrol sebelum mengaktifkan backend production. Jangan mengubah mode production menjadi development untuk melewati guard.
