# Frontend Qurio

Frontend Qurio dibangun dengan Next.js App Router. Lihat [README utama](../README.md) untuk setup monorepo, environment, dan catatan deploy.

## Pengembangan Lokal

Dari root repository, install dependency tiap aplikasi:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

Salin `frontend/.env.example` menjadi `frontend/.env.local`, lalu isi `NEXT_PUBLIC_API_URL` dengan alamat dasar backend.

Jalankan kedua aplikasi dari root dengan `npm run dev`, atau jalankan frontend saja:

```bash
npm run dev --prefix frontend
```

Frontend tersedia di `http://localhost:3000`.
