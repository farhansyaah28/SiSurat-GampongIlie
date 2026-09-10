# 🏛️ SiSurat Gampong — Sistem Administrasi Terpadu Gampong Ilie

Aplikasi pelayanan surat-menyurat digital untuk warga dan aparatur Gampong Ilie berbasis Web dengan autentikasi JWT, penomoran surat otomatis, verifikasi QR Code, dan notifikasi WhatsApp.

---

## 🚀 PANDUAN CARA MENJALANKAN DI KOMPUTER LOKAL (LOCAL SETUP)

Panduan ini ditujukan bagi siapa saja yang ingin menjalankan dan menguji aplikasi **SiSurat Gampong** di komputer lokal dari awal.

---

### 📋 1. PRASYARAT SISTEM (PREREQUISITES)

Sebelum memulai, pastikan perangkat komputer Anda sudah terpasang:
1. **Node.js** (Versi 18.x atau lebih baru) & `npm`  
   👉 [Unduh Node.js di sini](https://nodejs.org/)
2. **Git**  
   👉 [Unduh Git di sini](https://git-scm.com/)
3. **Database PostgreSQL** (Lokal PostgreSQL atau Supabase Cloud Database)
4. **Code Editor** (Disarankan menggunakan **VS Code**)

---

### 📥 2. KLON REPOSITORI (CLONE REPOSITORY)

Buka Terminal / Command Prompt / Git Bash, lalu jalankan perintah:

```bash
git clone https://github.com/farhansyaah28/SiSurat-GampongIlie.git
cd SiSurat-GampongIlie
```

---

### ⚙️ 3. KONFIGURASI BACKEND

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Install seluruh dependensi pustaka Node.js:
   ```bash
   npm install
   ```
3. Buat file konfigurasinya bernama `.env` di dalam folder `backend/`:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://postgres:password_db_anda@localhost:5432/sisurat_gampong
   JWT_SECRET=super_secret_jwt_key_sisurat_2026
   FONNTE_TOKEN=token_whatsapp_anda_opsional
   ```
   > 💡 *Catatan:* Jika tidak memiliki `FONNTE_TOKEN`, notifikasi OTP WhatsApp akan secara otomatis berjalan dalam mode **Simulasi Console Log** (aman untuk pengujian lokal).

---

### 🗄️ 4. PERSIAPAN DATABASE (POSTGRESQL)

1. Buat database baru bernama `sisurat_gampong` di PostgreSQL Anda.
2. Impor struktur tabel database dari file skema yang tersedia:
   - Jalankan query dari berkas `database/schema_postgres.sql` pada tool database Anda (pgAdmin / DBeaver / psql).
3. **Instalasi Akun Bawaan (Default Seed Accounts):**
   Jalankan script untuk membuat akun awal Aparatur Desa & Keuchik:
   ```bash
   node scripts/setup_clean_accounts.js
   ```

   **🔑 Kredensial Default Akun Bawaan:**
   - **Operator Desa:**
     - Username: `operator` / Password: `password123`
   - **Keuchik / Kepala Desa:**
     - Username: `geuchik` / Password: `password123`

---

### ▶️ 5. MENJALANKAN SERVER BACKEND

Di dalam folder `backend`, jalankan server API:

```bash
npm start
# atau
node app.js
```

Jika berhasil, terminal akan menampilkan pesan:
```text
✓ Database connected successfully (PostgreSQL/Supabase)
🚀 Server running on port 3000
```

---

### 🌐 6. MENJALANKAN FRONTEND

Aplikasi Frontend dibuat menggunakan **Vanilla HTML, CSS (TailwindCSS CDN), dan JavaScript**.

Ada 2 cara mudah untuk menjalankannya:

#### Cara A: Menggunakan VS Code "Live Server" (Direkomendasikan)
1. Buka folder proyek `SiSurat-GampongIlie` di VS Code.
2. Install ekstensi **Live Server** di VS Code.
3. Buka file `frontend/index.html`, lalu klik kanan dan pilih **"Open with Live Server"** (biasanya berjalan di `http://127.0.0.1:5500`).
4. Frontend akan secara otomatis mendeteksi backend di `http://localhost:3000/api`.

#### Cara B: Menggunakan Package `serve` (Node.js)
Dari terminal utama proyek:
```bash
npx serve frontend -p 5500
```
Lalu buka peramban (*browser*) Anda di alamat: `http://localhost:5500`

---

## 🛠️ ALUR PENGUJIAN FITUR (TESTING FLOW)

1. **Buka Halaman Utama:** `http://localhost:5500/index.html`
2. **Login Aparatur Desa:**
   - Klik **Masuk** -> Login dengan Username `operator` / Password `password123`.
   - Buka menu **Direktori Warga** -> Klik **+ Tambah Warga** untuk membuat akun warga baru (misal NIK: `1171010101010001`, Nama: `Budi Santoso`).
   - Catat Password Bawaan yang dibuatkan oleh sistem untuk warga tersebut.
3. **Login Sebagai Warga:**
   - Logout dari akun Operator -> Login menggunakan NIK & Password warga baru tersebut.
   - Sistem akan meminta warga melengkapi biodata profil terlebih dahulu.
   - Setelah profil disimpan, buka menu **Buat Surat** dan ajukan surat.
4. **Verifikasi & Approval:**
   - Login kembali sebagai **Operator** untuk memverifikasi berkas.
   - Login sebagai **Geuchik** (`geuchik` / `password123`) untuk memberikan approval akhir & menerbitkan nomor surat resmi.

---

## 📁 STRUKTUR FOLDER PROYEK

```text
SiSurat-GampongIlie/
├── backend/
│   ├── config/          # Konfigurasi Database & Auth
│   ├── controllers/     # Logika Bisnis (Auth, User, Pengajuan Surat)
│   ├── middleware/      # Authentication & Role Authorization
│   ├── models/          # Query Database (User, Pengajuan, AuditLog)
│   ├── routes/          # Endpoint API ExpressJS
│   ├── scripts/         # Script Pengetesan & Seed Accounts
│   └── app.js           # Main Entry Point Express Server
├── database/
│   ├── schema_postgres.sql   # Skema Tabel PostgreSQL
│   └── migrate_to_nik.sql    # Script Migrasi Database
├── frontend/
│   ├── index.html       # Landing Page Utama
│   ├── auth.html        # Halaman Login & OTP
│   ├── app.js           # Logic Frontend Client & API Interceptor
│   ├── daftar-warga.html# Halaman Direktori Penduduk (Operator)
│   └── riwayat.html     # Halaman Monitoring & Surat Warga
├── PANDUAN_PENGGUNAAN.md# User Manual untuk Pengguna Web
└── README.md            # Dokumentasi Developer & Local Setup
```

---

## 📄 LISENSI & HAK CIPTA
© 2026 **Pemerintah Gampong Ilie**, Kecamatan Ulee Kareng, Kota Banda Aceh.  
Seluruh Hak Cipta Dilindungi.
