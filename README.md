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
    <li><a href="#keputusan-teknis">Keputusan Teknis</a></li>
    <li><a href="#teknologi">Teknologi</a></li>
    <li><a href="#menjalankan-secara-lokal">Menjalankan Secara Lokal</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#struktur-proyek">Struktur Proyek</a></li>
    <li><a href="#batasan-yang-diketahui">Batasan yang Diketahui</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#kontak">Kontak</a></li>
  </ol>
</details>

## Tentang Proyek

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
- Guru dapat membuat sesi mode interaktif atau quiz, mengatur kapasitas kelas, menerbitkan aktivitas, dan mengakhiri sesi.
- Murid bergabung dengan kode sesi dan nama/nomor absen tanpa membuat akun; jawaban, pertanyaan, dan aktivitas sesi diperbarui real-time.

**Analitik yang transparan**

- Analitik Quiz menyediakan ringkasan kelas, kehadiran per sesi, skor per sesi, topik sulit, serta partisipasi, skor, dan status perhatian siswa.
- Setiap kartu angka punya popover **"Cara menghitung"** yang menjelaskan rumus, cakupan data, dan ambang batasnya.
- Analitik interaksi dan Quiz tersedia pada halaman terpisah. Analitik Quiz hanya menghitung sesi Quiz yang memiliki jawaban yang sudah dinilai.
- Aturan **"Perlu Perhatian"** menggabungkan ambang skor dan kehadiran dengan syarat jumlah sesi yang dijelaskan di UI.
- Ambang batas disimpan di konfigurasi metrik backend dan disinkronkan ke frontend.
- Ekspor laporan ke **PDF**.

**Keamanan dasar**

- Password di-hash dengan bcrypt, autentikasi JWT, header keamanan dengan Helmet, dan CORS dibatasi ke asal yang diizinkan.

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Demo

- **Aplikasi:** https://qurioapp.vercel.app
- **Akun guru demo:** `guru@qurio.test` / `password123`
- Murid: buka halaman utama, lalu masukkan kode sesi yang dibuat guru.

Data demo berisi 30 siswa, 4 sesi Quiz, dan 4 sesi interaktif (polling, word cloud, tanya jawab). Beberapa siswa sengaja dibuat berpola berbeda (nilai rendah, jarang hadir, baru bergabung) supaya daftar **Perlu Perhatian** dan **Perlu Dipantau** langsung terlihat di dashboard analitik.

> Backend berjalan di layanan gratis. Permintaan pertama setelah lama tidak dipakai bisa terasa lambat.

| Dashboard analitik                                | Sesi live                                   |
| ------------------------------------------------- | ------------------------------------------- |
| ![Analitik](docs/images/screenshot-analytics.png) | ![Sesi](docs/images/screenshot-session.png) |

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Arsitektur

```mermaid
flowchart LR
  subgraph Client[Browser]
    T[Guru]
    S[Murid]
  end

  subgraph Frontend[Next.js App Router - Vercel]
    W[Workspace guru<br/>Sesi, aktivitas, analitik]
    P[Halaman murid<br/>Gabung dan ikut aktivitas]
    API[API client<br/>REST]
    WS[Socket.IO client]
    PDF[Ekspor laporan PDF]
  end

  subgraph Backend[Express dan Socket.IO - Railway]
    MW[CORS, Helmet, JSON, logging]
    AUTH[Auth dan role middleware<br/>JWT / cookie]
    ROUTES[REST routes]
    CTRL[Controllers<br/>Auth, sesi, poll, jawaban,<br/>Q&A, wordcloud, analitik]
    SOCKET[Socket.IO rooms<br/>session:id dan teacher:id]
  end

  DB[(PostgreSQL - Neon)]

  T --> W
  S --> P
  W --> API
  P --> API
  W --> WS
  P --> WS
  W --> PDF
  API -->|HTTPS / JSON| MW
  MW --> ROUTES
  ROUTES -->|Endpoint guru| AUTH
  ROUTES -->|Endpoint publik / opsional| CTRL
  AUTH --> CTRL
  CTRL <-->|SQL| DB
  WS <-->|WebSocket| SOCKET
  CTRL -->|Emit perubahan data| SOCKET
```

- **Alur guru:** guru mendaftar atau login melalui `/api/users`. JWT dibaca dari header `Authorization` atau cookie HttpOnly. Middleware membatasi pembuatan dan pengelolaan sesi, aktivitas, serta analitik untuk guru.
- **Alur murid:** murid bergabung menggunakan kode sesi melalui endpoint publik, kemudian mengirim jawaban atau aktivitas tanpa akun. Polling, kuis, Q&A, dan word cloud menggunakan endpoint sesuai jenis aktivitas.
- **REST API:** `/api/users` menangani autentikasi; `/api/sessions` menangani sesi dan keikutsertaan; `/api/polls` menangani aktivitas; `/api/responses` menangani jawaban; `/api/questions` menangani Q&A; `/api/wordcloud` menangani kiriman dan hasil word cloud; `/api/analytics` menyediakan metrik guru.
- **Real-time:** client bergabung ke ruang `session:<id>` atau `teacher:<id>`. Controller memancarkan perubahan seperti `poll_vote_updated`, `question_created`, `wordcloud_updated`, dan notifikasi sesi agar tampilan terkait dapat diperbarui tanpa memuat ulang.
- **Data dan analitik:** PostgreSQL menyimpan akun, sesi, opsi poll, jawaban, peserta, pertanyaan, suara Q&A, serta hitungan word cloud. Analitik Quiz memakai data jawaban yang sudah dinilai; definisi dan ambangnya bersumber dari `backend/src/config/analytics-metrics.json`, lalu disalin ke frontend melalui skrip sinkronisasi.
- **Ekspor:** laporan PDF dibuat di frontend dari data analitik yang dimuat aplikasi.

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Keputusan Teknis

**Analitik yang bisa dipertanggungjawabkan.** Setiap angka punya definisi tertulis (rumus, cakupan data, ambang batas) di satu berkas konfigurasi, `backend/src/config/analytics-metrics.json`. Backend, UI popover "Cara menghitung", dan ekspor PDF memakai definisi yang sama. Skrip `verify:metrics` menghitung ulang angka langsung dari PostgreSQL, membandingkannya dengan hasil API, dan memastikan selisihnya nol. Dokumentasi lengkap: [`docs/ANALYTICS_METRICS.md`](docs/ANALYTICS_METRICS.md).

**Real-time lewat Socket.IO.** Client masuk ke ruang `session:<id>` (murid dan guru) atau `teacher:<id>` (notifikasi guru). Controller menyimpan perubahan ke database lebih dulu, baru memancarkan event (`poll_vote_updated`, `question_created`, `wordcloud_updated`, `session_ended`, dan lainnya), sehingga tampilan tidak pernah menampilkan data yang belum tersimpan.

**Konsistensi data di level database.** Perubahan status aktivitas memakai transaksi dan `SELECT ... FOR UPDATE`, sehingga dalam satu sesi hanya satu aktivitas yang berstatus _published_ pada satu waktu. Indeks unik mencegah satu peserta menjawab dua kali pada aktivitas yang sama.

**Murid tanpa akun.** Identitas murid dibatasi pada satu sesi: kode sesi, nama, dan nomor absen. ID peserta disimpan di browser, sehingga murid yang terputus dan masuk kembali dari perangkat yang sama dikenali sebagai peserta yang sama. Nomor absen yang sudah dipakai peserta lain di sesi itu ditolak.

**Data demo yang dapat diulang.** `npm run seed` membuat data demo secara deterministik (seed acak tetap), terpisah per mode sesi: sesi Quiz hanya berisi soal bernilai, sesi interaktif hanya berisi aktivitas tanpa nilai.

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
5. (Opsional) Isi data demo dan periksa angka analitik
   ```sh
   npm run seed --prefix backend
   npm run verify:metrics --prefix backend
   ```
   Perintah `seed` memakai akun guru `guru@qurio.test` / `password123`. Gunakan `npm run seed:reset --prefix backend` untuk **mengosongkan semua tabel** lalu mengisi ulang, dan variabel `QUIZ_SESSIONS=4` atau `8` untuk memilih jumlah sesi Quiz.
6. Jalankan backend dan frontend (dua terminal)
   ```sh
   npm run dev --prefix backend
   npm run dev --prefix frontend
   ```
7. Buka http://localhost:3000

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
├── frontend/                         # Next.js App Router dan UI
│   ├── app/
│   │   ├── (auth)/                    # login/page.tsx dan register/page.tsx
│   │   ├── (workspace)/
│   │   │   ├── analytics/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx             # ringkasan analitik
│   │   │   │   ├── interactive/page.tsx # analitik aktivitas interaktif
│   │   │   │   └── quiz/page.tsx        # analitik performa Quiz
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx             # dashboard guru
│   │   │   │   ├── createsessions/page.tsx # pembuatan sesi
│   │   │   │   └── session/[id]/       # detail sesi dan pembuatan aktivitas
│   │   │   │       ├── page.tsx
│   │   │   │       ├── create-poll/page.tsx # form aktivitas
│   │   │   │       └── poll/[pollId]/
│   │   │   │           ├── qa/page.tsx
│   │   │   │           └── wordcloud/page.tsx
│   │   │   └── sessions/               # daftar sesi
│   │   │       └── page.tsx
│   │   ├── play/[id]/page.tsx           # halaman murid untuk bergabung/bermain
│   │   ├── privasi/page.tsx             # kebijakan privasi
│   │   ├── syarat/page.tsx              # syarat penggunaan
│   │   ├── globals.css                 # gaya global
│   │   ├── layout.tsx                  # layout aplikasi
│   │   └── page.tsx                    # halaman utama
│   ├── components/
│   │   ├── ui/                         # komponen dasar UI
│   │   ├── AccessForm.tsx               # form akses sesi
│   │   ├── CopyButton.tsx
│   │   ├── LegalPlaceholder.tsx
│   │   ├── QuizView.tsx                 # tampilan aktivitas Quiz
│   │   ├── SettingsModal.tsx            # pengaturan
│   │   └── ThemeProvider.tsx            # penyedia tema
│   ├── context/AuthContext.tsx         # state autentikasi
│   ├── lib/
│   │   ├── api.tsx                      # REST API client dan tipe data
│   │   ├── analytics-metrics.json       # salinan definisi metrik
│   │   ├── analytics-selection.ts       # pemilihan/filter analitik
│   │   ├── export-pdf.ts                # ekspor laporan PDF
│   │   ├── smart-search.ts              # utilitas pencarian
│   │   ├── db.ts                        # database browser
│   │   └── utils.ts                     # utilitas umum
│   ├── scripts/test-export-pdf.mjs     # pemeriksaan ekspor PDF
│   ├── types/jspdf.d.ts                # deklarasi tipe jsPDF
│   └── public/                         # aset statis
├── backend/
│   ├── server.js                       # Express, middleware, REST, Socket.IO
│   ├── src/
│   │   ├── config/
│   │   │   ├── database/               # koneksi dan runner migrasi
│   │   │   └── analytics-metrics.json  # sumber definisi/ambang metrik
│   │   ├── controllers/                # auth, sesi, peserta, poll, jawaban,
│   │   │                               # pertanyaan, wordcloud, analitik
│   │   ├── db/migrations/              # 001–004: skema dan perubahan skema
│   │   ├── middlewares/                # autentikasi dan pembatasan role
│   │   └── routes/                     # auth, sesi, poll, jawaban, Q&A,
│   │                                   # wordcloud, analitik
│   └── scripts/                        # seed, sinkronisasi, dan verifikasi metrik
├── docs/
│   ├── ANALYTICS_METRICS.md            # rumus, cakupan, ambang, dan audit metrik
│   └── images/                         # gambar dokumentasi
├── package.json                        # skrip development gabungan
└── README.md
```

File konfigurasi project seperti `frontend/package.json`, `frontend/next.config.ts`, `backend/package.json`, dan `backend/.env` berada di masing-masing direktori aplikasi. Salinan definisi metrik frontend berada di `frontend/lib/analytics-metrics.json` dan diperbarui dari konfigurasi backend.

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Batasan yang Diketahui

- Identitas murid berbasis nama dan nomor absen per sesi, bukan akun. Karena itu, analitik per murid memakai nama yang dinormalisasi; dua murid dengan nama sama dapat tergabung.
- "Kehadiran" berarti murid menjawab minimal satu soal Quiz yang dinilai, bukan daftar hadir manual.
- Nilai dan status perhatian per murid hanya tersedia untuk sesi Quiz. Sesi interaktif tidak memiliki nilai.
- Backend memakai paket gratis, jadi permintaan pertama setelah lama menganggur bisa lambat.
- Pengujian otomatis baru mencakup verifikasi metrik analitik dan ekspor PDF.

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Roadmap

- [x] Polling, kuis, tanya jawab, word cloud real-time
- [x] Analitik per kelas, sesi, dan murid dengan penjelasan cara menghitung
- [x] Ekspor laporan PDF
- [x] Deploy: Vercel + Railway + Neon
- [ ] Integrasi AI untuk analitik dan pembuatan soal otomatis (rencana)
- [ ] Dashboard Siswa
- [ ] Domain profesional

<p align="right">(<a href="#readme-top">kembali ke atas</a>)</p>

## Kontak

Yugata Halimawan - [yugata.dv@gmail.com](mailto:yugata.dv@gmail.com) - [LinkedIn](https://www.linkedin.com/in/yugata-halimawan-82a612400)

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
