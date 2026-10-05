<a id="readme-top"></a>

[![Next.js][Next.js]][Next-url]
[![React][React.js]][React-url]
[![TypeScript][TypeScript]][TS-url]
[![Tailwind][Tailwind]][Tailwind-url]
[![Express][Express]][Express-url]
[![Socket.IO][Socket.io]][Socket-url]
[![PostgreSQL][Postgres]][Postgres-url]

<br />
<div align="center">
  <a href="https://qurioapp.vercel.app">
    <img src="frontend/public/Qurio-Cropped.svg" alt="Logo Qurio" height="64">
  </a>

  <h3 align="center">Qurio</h3>

  <p align="center">
    <strong>Transparansi Intelektual Murid</strong>
    <br />
    Platform interaksi kelas real-time dengan analitik yang bisa dijelaskan: guru tahu siapa yang butuh perhatian, dan tahu <em>mengapa</em> angkanya begitu.
    <br />
    <br />
    <a href="https://qurioapp.vercel.app"><strong>Coba Demo »</strong></a>
    &middot;
    <a href="https://github.com/yugata-dev/Qurio_App/issues">Laporkan Bug</a>
    &middot;
    <a href="https://github.com/yugata-dev/Qurio_App/issues">Usulkan Fitur</a>
  </p>
</div>

<details>
  <summary>Daftar Isi</summary>
  <ol>
    <li><a href="#tentang-proyek">Tentang Proyek</a></li>
    <li><a href="#fitur-utama">Fitur Utama</a></li>
    <li><a href="#demo">Demo</a></li>
    <li><a href="#arsitektur">Arsitektur</a></li>
    <li><a href="#teknologi">Teknologi</a></li>
    <li><a href="#menjalankan-secara-lokal">Menjalankan Secara Lokal</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#struktur-proyek">Struktur Proyek</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#kontak">Kontak</a></li>
  </ol>
</details>

## Tentang Proyek

<!-- GANTI: screenshot utama (landing atau dashboard) -->

![Tampilan Qurio](docs/images/screenshot-hero.png)

Di kelas, pertanyaan guru sering dijawab oleh segelintir murid yang sama. Sisanya diam, dan guru tidak punya cara cepat untuk tahu siapa yang paham dan siapa yang tertinggal.

**Qurio** memberi guru ruang interaksi real-time (polling, kuis, tanya jawab, word cloud) dan mengubah hasilnya menjadi analitik per kelas dan per murid. Yang membedakan: setiap angka di dashboard punya penjelasan _cara menghitung_ yang bisa dibuka langsung di layar, sehingga guru tidak perlu menebak dari mana angka itu berasal.

Murid bergabung tanpa akun, cukup memasukkan kode sesi.

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Fitur Utama

**Interaksi kelas real-time**

- **Polling**: pilihan ganda dengan hasil langsung terlihat.
- **Kuis**: soal dengan jawaban benar, dinilai otomatis.
- **Tanya Jawab**: murid bertanya dan memberi suara pada pertanyaan teman.
- **Word Cloud**: kumpulan kata dari kelas, diperbarui langsung.
- Murid masuk lewat kode sesi, tanpa registrasi.

**Analitik yang transparan**

- Ringkasan kehadiran dan nilai per kelas, per sesi, dan per murid.
- Setiap kartu angka punya popover **"Cara menghitung"** yang menjelaskan rumus, cakupan data, dan ambang batasnya.
- Aturan **"Perlu Perhatian"** ditulis terang: nilai di bawah ambang dengan jumlah sesi minimum, atau kehadiran rendah.
- Ambang batas disimpan di satu berkas konfigurasi, bukan tersebar di kode.
- Ekspor laporan ke **PDF**.

**Keamanan dasar**

- Password di-hash dengan bcrypt, autentikasi JWT, header keamanan dengan Helmet, dan CORS dibatasi ke asal yang diizinkan.

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Demo

- **Aplikasi:** https://qurioapp.vercel.app
- **Akun guru demo:** `guru@qurio.test` / `password123`
- Murid: buka halaman utama, lalu masukkan kode sesi yang dibuat guru.

> Backend berjalan di layanan gratis. Permintaan pertama setelah lama tidak dipakai bisa terasa lambat.

<!-- GANTI: tambahkan 2-4 screenshot / GIF -->

| Dashboard analitik                                | Sesi live                                   |
| ------------------------------------------------- | ------------------------------------------- |
| ![Analitik](docs/images/screenshot-analytics.png) | ![Sesi](docs/images/screenshot-session.png) |

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Arsitektur

```mermaid
flowchart LR
    U[Guru & Murid<br/>Browser] -->|HTTPS| V[Next.js<br/>Vercel]
    V -->|REST + WebSocket| R[Express + Socket.IO<br/>Railway]
    R -->|SQL| N[(PostgreSQL<br/>Neon)]
```

- **Frontend** (Next.js App Router) menampilkan UI dan menerima update real-time lewat Socket.IO.
- **Backend** (Express 5) menyediakan REST API (`/api/users`, `/api/sessions`, `/api/polls`, `/api/questions`, `/api/wordcloud`, `/api/analytics`) dan mengirim event ke ruang sesi.
- **Database** (PostgreSQL) menyimpan pengguna, sesi, poll, jawaban, pertanyaan, partisipan, dan hitungan word cloud. Skema dikelola lewat migrasi SQL berurutan.

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Teknologi

| Lapisan  | Teknologi                                                                |
| -------- | ------------------------------------------------------------------------ |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Tabler Icons, jsPDF |
| Backend  | Node.js, Express 5, Socket.IO, JWT, bcrypt, Helmet                       |
| Database | PostgreSQL (Neon)                                                        |
| Hosting  | Vercel (frontend), Railway (backend), Neon (database)                    |

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Menjalankan Secara Lokal

### Prasyarat

- Node.js 20 atau lebih baru
- PostgreSQL (lokal atau akun Neon gratis)

### Instalasi

1. Clone repo
   ```sh
   git clone https://github.com/yugata-dev/Qurio_App.git
   cd Qurio_App
   ```
2. Pasang dependensi
   ```sh
   npm install --prefix backend
   npm install --prefix frontend
   ```
3. Siapkan environment

   ```sh
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

   Isi minimal:

   | Berkas                | Variabel              | Contoh                                           |
   | --------------------- | --------------------- | ------------------------------------------------ |
   | `backend/.env`        | `DATABASE_URL`        | `postgresql://user:pass@host/db?sslmode=require` |
   | `backend/.env`        | `JWT_SECRET`          | string acak panjang                              |
   | `backend/.env`        | `FRONTEND_URL`        | `http://localhost:3000`                          |
   | `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:5000`                          |

4. Jalankan migrasi database
   ```sh
   npm run migrate --prefix backend
   ```
5. Jalankan backend dan frontend (dua terminal)
   ```sh
   npm run dev --prefix backend
   npm run dev --prefix frontend
   ```
6. Buka http://localhost:3000

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Deployment

| Layanan     | Pengaturan                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**  | Root Directory `frontend`; variabel `NEXT_PUBLIC_API_URL` = URL backend                                                                  |
| **Railway** | Root Directory `backend`; variabel `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL` = URL Vercel (tanpa `/` di akhir) |
| **Neon**    | Jalankan migrasi `backend/src/db/migrations/001` sampai `004` secara berurutan                                                           |

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Struktur Proyek

```
Qurio_App/
├── frontend/          # Next.js (App Router)
│   ├── app/           # halaman: landing, auth, workspace, play
│   ├── components/    # komponen UI
│   └── lib/           # api client, ekspor PDF, konfigurasi metrik
├── backend/           # Express + Socket.IO
│   ├── src/routes/
│   ├── src/controllers/
│   └── src/db/migrations/
├── docs/              # dokumentasi (termasuk definisi metrik analitik)
└── postman/           # koleksi uji API
```

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Roadmap

- [x] Polling, kuis, tanya jawab, word cloud real-time
- [x] Analitik per kelas, sesi, dan murid dengan penjelasan cara menghitung
- [x] Ekspor laporan PDF
- [x] Deploy: Vercel + Railway + Neon
- [ ] Penyempurnaan ekspor PDF agar sama persis dengan tampilan layar
- [ ] Tes otomatis untuk perhitungan analitik
- [ ] Domain kustom
- [ ] Mode gelap penuh

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Kontak

Yugata - [Gmail](yugata.dv@gmail.com) - <!-- GANTI --> [LinkedIn](www.linkedin.com/in/yugata-halimawan-82a612400)

Tautan proyek: https://github.com/yugata-dev/Qurio_App

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

[Next.js]: https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TS-url]: https://www.typescriptlang.org/
[Tailwind]: https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Express]: https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[Socket.io]: https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white
[Socket-url]: https://socket.io/
[Postgres]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[Postgres-url]: https://www.postgresql.org/
