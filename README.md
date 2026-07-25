# SiSurat Gampong

Sistem administrasi surat menyurat desa (SiSurat Gampong) — backend minimal siap dijalankan.

## Persiapan
1. Install dependencies (di folder `backend`):

```bash
cd backend
npm install
```

2. Konfigurasi .env (salin `.env` dan ubah sesuai lingkungan Anda).
3. Import `database/schema.sql` ke MySQL Anda dan pastikan kredensial `.env` cocok.

## Menjalankan server

```bash
cd backend
npm run dev
```

API tersedia di `http://localhost:3000/api` dan `GET /health` untuk pengecekan.

## Next steps
- Implementasi upload file dan generator PDF.
- Buat frontend sederhana (React / Vue) untuk formulir pengajuan.
- Tambah validasi lebih ketat dan tests.

## Frontend demo
Folder `frontend` berisi `index.html` demo minimal untuk registrasi, login, dan pengajuan.

## Tests
Ada test simple untuk health check. Untuk menjalankan test:

```bash
cd backend
npm install
npm test
```

Catatan: test bersifat integrasi ringan dan membutuhkan modul dev `jest` dan `supertest`.

## Docker (MySQL + Backend)
Untuk memudahkan pengujian lokal, Anda dapat menjalankan MySQL + backend menggunakan Docker Compose. File `docker-compose.yml` sudah disediakan.

1. Pastikan Docker & Docker Compose terpasang.
2. Jalankan:

```bash
docker compose up --build
```

3. Akses aplikasi di `http://localhost:3000` (frontend dan API di-serve oleh backend).

Notes:
- Default MySQL password di-compose adalah `examplepassword`. Untuk lingkungan produksi, ubah ini.
- `database/schema.sql` akan di-import otomatis saat container MySQL pertama kali dijalankan.
- Jika ingin membuat akun admin setelah container berjalan:

```bash
docker compose exec app node scripts/seedAdmin.js
```


## Seed admin
Jalankan script untuk membuat akun admin awal:

```bash
cd backend
node scripts/seedAdmin.js
```

Gunakan `.env` untuk menyesuaikan `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, dan `SEED_ADMIN_NIK`.
