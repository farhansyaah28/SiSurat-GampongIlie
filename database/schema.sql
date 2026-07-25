-- Database untuk SiSurat Gampong
-- Sistem Administrasi Surat Menyurat Desa

CREATE DATABASE IF NOT EXISTS sisurat_gampong;
USE sisurat_gampong;

-- Tabel Users
CREATE TABLE users (
    id_user INT PRIMARY KEY AUTO_INCREMENT,
    nama VARCHAR(150) NOT NULL,
    nik VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('warga', 'operator', 'kepala_desa') NOT NULL,
    status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Jenis Surat
CREATE TABLE jenis_surat (
    id_jenis INT PRIMARY KEY AUTO_INCREMENT,
    nama_jenis VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    template_file VARCHAR(255),
    status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pengajuan Surat
CREATE TABLE pengajuan_surat (
    id_pengajuan INT PRIMARY KEY AUTO_INCREMENT,
    id_user INT NOT NULL,
    id_jenis INT NOT NULL,
    keperluan VARCHAR(255) NOT NULL,
    keterangan TEXT,
    tanggal_pengajuan DATETIME DEFAULT CURRENT_TIMESTAMP,
    tanggal_disetujui DATETIME,
    nomor_surat VARCHAR(50),
    status ENUM('menunggu_verifikasi', 'terverifikasi', 'menunggu_persetujuan', 'disetujui', 'ditolak') DEFAULT 'menunggu_verifikasi',
    file_surat VARCHAR(255),
    catatan_ditolak TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_jenis) REFERENCES jenis_surat(id_jenis) ON DELETE RESTRICT
);

-- Tabel Riwayat Cetak
CREATE TABLE riwayat_cetak (
    id_cetak INT PRIMARY KEY AUTO_INCREMENT,
    id_pengajuan INT NOT NULL,
    tanggal_cetak DATETIME DEFAULT CURRENT_TIMESTAMP,
    jumlah_cetak INT DEFAULT 1,
    status_cetak ENUM('berhasil', 'gagal') DEFAULT 'berhasil',
    dicetak_oleh INT NOT NULL,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pengajuan) REFERENCES pengajuan_surat(id_pengajuan) ON DELETE CASCADE,
    FOREIGN KEY (dicetak_oleh) REFERENCES users(id_user) ON DELETE CASCADE
);

-- Tabel Audit Log
CREATE TABLE audit_log (
    id_log INT PRIMARY KEY AUTO_INCREMENT,
    id_user INT,
    aksi VARCHAR(100),
    deskripsi TEXT,
    tabel_target VARCHAR(50),
    id_target INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE SET NULL
);

-- Insert data jenis surat default
INSERT INTO jenis_surat (nama_jenis, deskripsi) VALUES
('Surat Keterangan Domisili', 'Surat untuk keterangan tempat tinggal'),
('Surat Keterangan Usaha', 'Surat untuk keterangan usaha/badan usaha'),
('Surat Keterangan Penghasilan', 'Surat untuk keterangan penghasilan'),
('Surat Referensi', 'Surat referensi dari kantor desa'),
('Surat Izin Usaha', 'Surat izin untuk menjalankan usaha'),
('Surat Keterangan Keluarga', 'Surat keterangan status keluarga'),
('Surat Keterangan Tidak Memiliki Hutang Pajak', 'Surat STNPPT'),
('Surat Permohonan Tanah', 'Surat permohonan untuk tanah');

-- Create indexes untuk performa
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nik ON users(nik);
CREATE INDEX idx_pengajuan_user ON pengajuan_surat(id_user);
CREATE INDEX idx_pengajuan_jenis ON pengajuan_surat(id_jenis);
CREATE INDEX idx_pengajuan_status ON pengajuan_surat(status);
CREATE INDEX idx_pengajuan_tanggal ON pengajuan_surat(tanggal_pengajuan);
CREATE INDEX idx_cetak_pengajuan ON riwayat_cetak(id_pengajuan);
CREATE INDEX idx_audit_user ON audit_log(id_user);
