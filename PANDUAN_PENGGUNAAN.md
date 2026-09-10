# 📖 BUKU PANDUAN PENGGUNAAN APPLICATION (USER MANUAL)
## **SiSurat Gampong — Sistem Administrasi Terpadu Gampong Ilie**

---

Selamat datang di **SiSurat Gampong**, platform administrasi pelayanan surat-menyurat digital untuk warga dan aparatur Gampong Ilie, Kecamatan Ulee Kareng, Kota Banda Aceh.

Dokumen ini berisi panduan lengkap tata cara penggunaan aplikasi bagi seluruh peran pengguna (**Warga**, **Operator Desa**, dan **Keuchik / Kepala Desa**).

---

## 📌 DAFTAR ISI
1. [Hak Akses & Peran Pengguna](#1-hak-akses--peran-pengguna)
2. [Panduan untuk Warga](#2-panduan-untuk-warga)
   - [2.1 Cara Login & Unduh Formulir Biodata](#21-cara-login--unduh-formulir-biodata)
   - [2.2 Fitur Lupa Kata Sandi (OTP WhatsApp)](#22-fitur-lupa-kata-sandi-otp-whatsapp)
   - [2.3 Melengkapi Profil Warga (Wajib)](#23-melengkapi-profil-warga-wajib)
   - [2.4 Cara Mengajukan Surat Online](#24-cara-mengajukan-surat-online)
   - [2.5 Memantau Status & Mengunduh PDF Surat](#25-memantau-status--mengunduh-pdf-surat)
3. [Panduan untuk Operator Desa](#3-panduan-untuk-operator-desa)
   - [3.1 Kelola Direktori Penduduk (Tambah, Edit, Hapus)](#31-kelola-direktori-penduduk-tambah-edit-hapus)
   - [3.2 Impor Data Warga Massal (Excel/CSV)](#32-impor-data-warga-massal-excelcsv)
   - [3.3 Buat Surat Atas Nama Warga (On-Behalf)](#33-buat-surat-atas-nama-warga-on-behalf)
   - [3.4 Verifikasi & Validasi Pengajuan Surat](#34-verifikasi--validasi-pengajuan-surat)
   - [3.5 Buku Surat Keluar & Audit Logs](#35-buku-surat-keluar--audit-logs)
4. [Panduan untuk Keuchik / Kepala Desa](#4-panduan-untuk-keuchik--kepala-desa)
   - [4.1 Persetujuan (Approval) & Penolakan Surat](#41-persetujuan-approval--penolakan-surat)
   - [4.2 Sistem Penomoran Surat Otomatis](#42-sistem-penomoran-surat-otomatis)
   - [4.3 Statistik & Laporan Administrasi](#43-statistik--laporan-administrasi)
5. [Tanya Jawab & Troubleshooting (FAQ)](#5-tanya-jawab--troubleshooting-faq)

---

## 1. HAK AKSES & PERAN PENGGUNA

Sistem **SiSurat Gampong** membagi hak akses ke dalam 3 peran utama:

| Peran | Kredensial Login | Wewenang Utama |
| :--- | :--- | :--- |
| **Warga** | NIK & Password | Melengkapi biodata profil, mengajukan surat mandiri, mengunduh PDF surat yang telah disetujui. |
| **Operator** | Username & Password | Mengelola data warga (tambah/hapus/impor), verifikasi berkas pengajuan, membantu buat surat atas nama warga. |
| **Keuchik** | Username & Password | Penyetujuan akhir (approval) surat, penerbitan nomor surat resmi otomatis, pemantauan statistik gampong. |

---

## 2. PANDUAN UNTUK WARGA

### 2.1 Cara Login & Unduh Formulir Biodata
1. Buka halaman utama aplikasi, lalu klik tombol **Masuk** di pojok kanan atas.
2. Masukkan **NIK** dan **Kata Sandi** yang telah didaftarkan oleh Operator Desa.
3. **Penting bagi warga baru yang belum punya akun:**
   - Di bagian bawah halaman login, klik tautan **"Unduh Formulir Biodata"**.
   - Cetak formulir PDF tersebut, isi biodata diri secara manual, dan serahkan ke Kantor Geuchik untuk didaftarkan akunnya oleh Operator.

### 2.2 Fitur Lupa Kata Sandi (OTP WhatsApp)
Jika Anda lupa kata sandi:
1. Klik **"Lupa sandi?"** pada halaman login.
2. Masukkan **NIK** Anda yang terdaftar, lalu klik **Kirim Kode OTP**.
3. Sistem akan mengirimkan **Kode OTP 6-digit** langsung ke WhatsApp Anda.
4. Masukkan kode OTP tersebut beserta kata sandi baru Anda untuk memperbarui kata sandi.

### 2.3 Melengkapi Profil Warga (Wajib)
> ⚠️ **Syarat Utama Pengajuan Surat:** Warga **wajib melengkapi biodata profil** terlebih dahulu sebelum diperbolehkan membuat surat online.

1. Setelah login, jika profil Anda belum lengkap, sistem akan menampilkan kartu peringatan.
2. Klik tombol **Edit Profil** dan lengkapi data berikut:
   - Tempat & Tanggal Lahir
   - Jenis Kelamin
   - Agama
   - Status Perkawinan
   - Pekerjaan
   - Alamat Lengkap
3. Klik **Simpan Profil**.

### 2.4 Cara Mengajukan Surat Online
1. Pilih menu **Buat Surat** pada dashboard warga.
2. Pilih jenis surat yang dibutuhkan (misal: *Surat Keterangan Usaha*, *Surat Keterangan Domisili*, *Surat Keterangan Kurang Mampu*, dll).
3. Isi **Keperluan Pengajuan** (contoh: *"Untuk persyaratan pengajuan KUR Bank"*).
4. Lengkapi kolom data khusus yang diminta oleh jenis surat tersebut.
5. Unggah **Dokumen Pendukung** (seperti Foto KTP/KK/Surat Pengantar RT) pada kolom lampiran berkas.
6. Klik **Kirim Pengajuan Surat**.

### 2.5 Memantau Status & Mengunduh PDF Surat
1. Buka menu **Riwayat Pengajuan**.
2. Anda dapat melihat status pengajuan surat secara realtime:
   - 🟡 **Menunggu Verifikasi**: Berkas sedang diperiksa oleh Operator Desa.
   - 🔵 **Terverifikasi**: Berkas lengkap dan sedang menunggu persetujuan Keuchik.
   - 🟢 **Disetujui**: Surat telah disetujui dan diterbitkan nomor resminya.
   - 🔴 **Ditolak**: Surat ditolak (alasan/catatan penolakan dapat dibaca pada detail).
3. Untuk surat bernilai 🟢 **Disetujui**, klik tombol **Unduh PDF** untuk mengunduh dokumen surat resmi berformat PDF lengkap dengan tanda tangan digital dan QR Code validasi.

---

## 3. PANDUAN UNTUK OPERATOR DESA

### 3.1 Kelola Direktori Penduduk (Tambah, Edit, Hapus)
1. Pilih menu **Direktori Warga**.
2. **Tambah Warga Baru (Manual):**
   - Klik tombol **+ Tambah Warga**.
   - Masukkan NIK (16 digit) dan Nama Lengkap (NIK tidak boleh ganda).
   - Kata sandi awal (*default*) akan dibuat otomatis oleh sistem untuk diberikan kepada warga.
3. **Edit & Reset Sandi Warga:**
   - Klik tombol **Edit** pada baris warga untuk memperbarui profil mereka.
   - Gunakan fitur **Reset Password** jika warga lupa kata sandi dan butuh bantuan operator.
4. **Hapus Akun Warga:**
   - Klik tombol **Hapus** (ikon tempat sampah) jika warga telah pindah atau data ganda. Sistem akan meminta konfirmasi aman sebelum menghapus.

### 3.2 Impor Data Warga Massal (Excel/CSV)
1. Di halaman **Direktori Warga**, klik tombol **Impor Excel/CSV**.
2. Unduh *template* Excel yang disediakan.
3. Isi data warga (Kolom wajib: `nik`, `nama`).
4. Unggah berkas Excel/CSV tersebut ke dalam modal impor. Sistem akan secara otomatis memvalidasi duplikasi NIK dan mendaftarkan akun warga secara massal.

### 3.3 Buat Surat Atas Nama Warga (On-Behalf)
Jika ada warga lansia atau warga yang datang langsung ke kantor desa tanpa membawa HP:
1. Operator dapat membuka menu **Verifikasi / Buat Surat**.
2. Gunakan fitur **Buat Surat Atas Nama Warga**.
3. Cari NIK atau Nama warga yang bersangkutan.
4. Isi jenis surat, keperluan, dan unggah lampiran atas nama warga tersebut.

### 3.4 Verifikasi & Validasi Pengajuan Surat
1. Buka menu **Daftar Verifikasi Surat**.
2. Klik **Lihat Detail** pada pengajuan warga yang berstatus *Menunggu Verifikasi*.
3. Periksa keabsahan data teks dan berkas lampiran pendukung.
4. Pilih tindakan:
   - **Verifikasi (Teruskan ke Keuchik)**: Jika berkas lengkap.
   - **Tolak Pengajuan**: Masukkan alasan penolakan agar warga dapat memperbaikinya.

### 3.5 Buku Surat Keluar & Audit Logs
- **Buku Surat Keluar**: Menampilkan rekapitulasi seluruh surat resmi yang telah disetujui, dilengkapi filter jenis surat dan tanggal penerbitan.
- **Audit Logs**: Memantau seluruh rekam jejak aktivitas keamanan sistem (siapa yang menambah warga, mengubah data, mereset password, atau menyetujui surat).

---

## 4. PANDUAN UNTUK KEUCHIK / KEPALA DESA

### 4.1 Persetujuan (Approval) & Penolakan Surat
1. Keuchik login menggunakan akun pimpinan.
2. Pada dashboard utama, Keuchik dapat melihat daftar pengajuan surat yang berstatus **Terverifikasi**.
3. Klik **Tinjau Surat** untuk melihat draf surat dan berkas warga.
4. Klik **Setujui Surat** untuk menerbitkan surat secara resmi, atau **Tolak** jika ada kekeliruan.

### 4.2 Sistem Penomoran Surat Otomatis
Sistem **SiSurat Gampong** menggunakan penomoran surat otomatis yang cerdas:
- Format Nomor Surat: `[Nomor_Urut]/[Kode_Jenis_Surat]/GI-UK/[Tahun]`
  - Contoh: `079/KU/GI-UK/2026` (*Surat Keterangan Usaha ke-79 di tahun 2026*).
- Nomor urut dijamin **selalu berurutan dan unik (bebas dari duplikasi)** karena menggunakan kalkulasi angka maksimum di database.

### 4.3 Statistik & Laporan Administrasi
Keuchik dapat memantau ringkasan statistik harian, bulanan, dan tahunan mengenai:
- Total Surat Diterbitkan
- Jenis Surat Paling Sering Diajukan
- Jumlah Penduduk Terdaftar di Gampong

---

## 5. TANYA JAWAB & TROUBLESHOOTING (FAQ)

**Q: Mengapa warga tidak bisa klik tombol pengajuan surat?**
> **A:** Warga tersebut belum melengkapi data biodata profilnya (seperti tempat/tanggal lahir/alamat). Minta warga untuk mengisi profil melalui modal **Edit Profil** terlebih dahulu.

**Q: Apakah foto KTP wajib diunggah saat mendaftarkan akun warga baru?**
> **A:** Tidak perlu. Foto KTP/KK diunggah secara dinamis oleh warga sendiri pada kolom **Dokumen Pendukung** hanya saat mengajukan surat yang membutuhkan berkas tersebut.

**Q: Bagaimana jika NIK warga sudah terdaftar saat mau buat akun baru?**
> **A:** NIK bersifat unik 16-digit. Jika muncul peringatan *"NIK sudah terdaftar"*, gunakan fitur pencarian pada Direktori Warga untuk mengecek akun yang sudah ada.

**Q: Apakah berkas PDF Surat aman dari pemalsuan?**
> **A:** Ya. Setiap dokumen PDF yang diunduh dilengkapi dengan nomor surat resmi terenkripsi dan Kode QR verifikasi keabsahan dokumen gampong.

---

## 6. CARA MENJALANKAN LOKAL (UNTUK DEVELOPER / PENGUJIAN)
Bagi Anda atau pihak lain yang ingin mengoperasikan aplikasi ini secara lokal di komputer lain dari awal:
1. Silakan ikuti panduan instalasi lengkap di berkas **[README.md](README.md)**.
2. **Langkah Ringkas:**
   - **Kloning Repositori:**  
     `git clone https://github.com/farhansyaah28/SiSurat-GampongIlie.git`
   - **Konfigurasi Backend:**  
     Masuk ke folder `backend`, jalankan `npm install`, buat file `.env` (isi `DATABASE_URL` PostgreSQL & `PORT=3000`).
   - **Inisialisasi Database:**  
     Impor berkas SQL dari `database/schema_postgres.sql` lalu jalankan `node scripts/setup_clean_accounts.js` untuk membuat akun default operator (`operator` / `password123`) & geuchik (`geuchik` / `password123`).
   - **Jalankan Aplikasi:**  
     Jalankan backend dengan `node app.js` di folder `backend`, lalu buka `frontend/index.html` menggunakan Live Server (port 5500).

---
*© 2026 Pemerintah Gampong Ilie — Platform Administrasi Terpadu Modern.*
