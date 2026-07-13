# Thrifting E-Commerce Backend (NestJS + Supabase + JWT)

Backend API untuk platform e-commerce pakaian thrift (preloved) yang dibangun dengan menggunakan **NestJS**, **Supabase PostgreSQL** via **Prisma ORM**, dan sistem autentikasi **JWT** kustom.

---

## Fitur Utama

- **Autentikasi JWT**: Register dan login Admin toko secara aman.
- **Manajemen Produk (CRUD)**:
  - Manajemen detail produk (nama, kategori, ukuran, deskripsi, kondisi, harga, foto).
  - Terintegrasi dengan **Supabase Storage** untuk mengunggah media gambar produk.
  - Penanganan stok tunggal (thrift): jika produk dibeli, statusnya berubah menjadi `SOLD_OUT`.
- **Sistem Checkout / Order**:
  - Menggunakan transaksi database (`prisma.$transaction`) untuk memastikan konsistensi data dan **mencegah pembelian ganda (race-condition)** pada item thrift.

---

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma ORM (v7.x) dengan Driver Adapter PostgreSQL (`pg` & `@prisma/adapter-pg`)
- **Autentikasi**: Passport JWT & bcrypt
- **Penyimpanan Gambar**: Supabase Storage Bucket (`thrift-images`)

---

## Langkah Instalasi & Penggunaan

### 1. Prasyarat
Pastikan Anda sudah menginstal Node.js (v20+) dan NPM di komputer Anda.

### 2. Konfigurasi Lingkungan (`.env`)
Salin berkas `.env.example` menjadi `.env` lalu lengkapi kredensial database & Supabase Anda:
```bash
cp .env.example .env
```
Isi variabel berikut di dalam `.env`:
- `DATABASE_URL`: String koneksi PostgreSQL dari proyek Supabase Anda.
- `JWT_SECRET`: Kunci rahasia untuk tanda tangan JWT.
- `SUPABASE_URL` & `SUPABASE_KEY`: Kredensial API Supabase Anda (direkomendasikan menggunakan Service Role Key untuk akses upload storage).

### 3. Instalasi Dependensi
Jalankan perintah berikut untuk mengunduh semua library yang diperlukan:
```bash
npm install
```

### 4. Sinkronisasi Skema Database
Push skema Prisma ke database Supabase Anda:
```bash
npx prisma db push
```

### 5. Jalankan Server Pengembangan
Jalankan aplikasi secara lokal di komputer Anda:
```bash
# Mode watch (auto-reload)
npm run start:dev
```
Aplikasi akan berjalan di port `3000` (atau sesuai konfigurasi env) di alamat: `http://localhost:3000`.

### 6. Dokumentasi API (Swagger)
Setelah server berjalan, Anda dapat mengakses Swagger UI interaktif untuk melihat seluruh rute dan dokumentasi API di:
`http://localhost:3000/docs`

---

## Pemeliharaan Kode (Linting & Formatting)

- **Format Kode** (Prettier):
  ```bash
  npm run format
  ```
- **Lint Kode** (ESLint):
  ```bash
  npm run lint
  ```

---

## Pengujian (Testing)

Proyek ini dikembangkan dengan pendekatan **TDD (Test-Driven Development)** yang sangat ketat untuk menghindari bug fatal.

### 1. Menjalankan Unit & Integration Test
Untuk menguji modul secara terisolasi (mock-based):
```bash
npm run test
```

### 2. Menjalankan E2E Integration Test
Untuk menguji rute API secara penuh (berinteraksi langsung dengan database Supabase aktif):
```bash
npm run test:e2e
```

### 3. Pengujian Manual
Gunakan berkas HTTP Client [api_tests.http](api_tests.http) untuk menembak endpoint backend secara langsung dari editor (misal menggunakan ekstensi *REST Client* di VS Code).

---

## Lisensi
Proyek ini tidak memiliki lisensi.
