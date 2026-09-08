# Instructions for AI Coding Assistants (AGENTS.md)

## 1. Project Context & Scope

- **Project Type**: Hanya Frontend Application.
- **Framework**: Next.js 16 (React 19) menggunakan TypeScript.
- **Scope Limit**: Hanya fokus pada frontend, backend hanya jika perlu

---

## 2. Tech Stack & Dependencies Overview

Gunakan stack berikut sebagai acuan utama saat menulis kode:

- **Framework & Core**: Next.js 16 (App Router), React 19, React DOM, TypeScript.
- **HTTP Client**: Axios (untuk integrasi REST API ke backend Railway).
- **Real-Time Communication**: Socket.io-client (untuk fitur real-time / WebSockets).
- **Form Management**: React Hook Form (untuk pengelolaan state formulir dan validasi).
- **UI Components & Icons**:
  - `@base-ui/react` & `shadcn` (Base komponen UI).
  - `@tabler/icons-react` (Ikon utama).
- **Styling & Utilities**:
  - `class-variance-authority` (cva), `clsx`, dan `tailwind-merge` (dipakai untuk pembentukan utility `cn()` pada Tailwind CSS).
  - `tw-animate-css` (animasi berbasis Tailwind).

---

## 3. Environment Variables

Aplikasi terhubung ke backend Railway menggunakan variabel lingkungan berikut:

- `NEXT_PUBLIC_API_URL`: Mengarah ke URL API Backend Railway.
  - **Aturan**:
    - Akses variabel ini menggunakan `process.env.NEXT_PUBLIC_API_URL`.
    - Gunakan `NEXT_PUBLIC_API_URL` sebagai `baseURL` utama saat membuat konfigurasi instance Axios.
    - Sediakan nilai cadangan (fallback) ke `http://localhost:5000/api` atau untuk pengembangan lokal.

---

## 4. Coding Standards & Guidelines

### A. TypeScript & Types

- Gunakan tipe data TypeScript yang ketat (_strict typing_).
- Hindari penggunaan tipe `any`. Selalu buat `interface` atau `type` untuk respons API, properti komponen (props), dan state.

### B. Styling & UI Components

- Gunakan Tailwind CSS untuk penataan gaya (styling).
- Gunakan helper `cn()` (kombinasi `clsx` dan `tailwind-merge`) untuk penggabungan kelas kondisional pada komponen UI.
- Manfaatkan ekosistem Shadcn UI dan `@base-ui/react` untuk menjaga konsistensi antarmuka.

### C. API & Real-time Integration

- Selalu bungkus permintaan Axios di dalam fungsi `async/await` dengan blok `try-catch` yang proper.
- Untuk integrasi Socket.io, pastikan koneksi dikelola dengan baik di dalam siklus hidup komponen (misalnya `useEffect`) dan selalu lakukan pembersihan (_cleanup/disconnect_) saat komponen di-unmount.
