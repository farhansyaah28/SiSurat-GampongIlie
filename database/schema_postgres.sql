-- Database untuk SiSurat Gampong (PostgreSQL/Supabase Version)
-- Sistem Administrasi Surat Menyurat Desa

-- 1. Buat ENUM Types
CREATE TYPE user_role AS ENUM ('warga', 'operator', 'kepala_desa');
CREATE TYPE user_status AS ENUM ('aktif', 'nonaktif');
CREATE TYPE pengajuan_status AS ENUM ('menunggu_verifikasi', 'terverifikasi', 'menunggu_persetujuan', 'disetujui', 'ditolak');
CREATE TYPE cetak_status AS ENUM ('berhasil', 'gagal');

-- 2. Tabel Users
CREATE TABLE users (
    nik VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'aktif',
    no_hp VARCHAR(20),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(20),
    pekerjaan VARCHAR(100),
    status_perkawinan VARCHAR(50),
    agama VARCHAR(50),
    alamat TEXT,
    foto_ktp TEXT,
    reset_otp VARCHAR(6),
    reset_otp_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Jenis Surat
CREATE TABLE jenis_surat (
    id_jenis SERIAL PRIMARY KEY,
    nama_jenis VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    template_file VARCHAR(255),
    status user_status DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Pengajuan Surat
CREATE TABLE pengajuan_surat (
    id_pengajuan SERIAL PRIMARY KEY,
    nik VARCHAR(20) NOT NULL,
    id_jenis INT NOT NULL,
    keperluan VARCHAR(255) NOT NULL,
    keterangan TEXT,
    tanggal_pengajuan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tanggal_disetujui TIMESTAMP,
    nomor_surat VARCHAR(50),
    status pengajuan_status DEFAULT 'menunggu_verifikasi',
    file_surat VARCHAR(255),
    lampiran_file TEXT,
    lampiran_kk TEXT,
    catatan_ditolak TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nik) REFERENCES users(nik) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_jenis) REFERENCES jenis_surat(id_jenis) ON DELETE RESTRICT
);

-- 5. Tabel Riwayat Cetak
CREATE TABLE riwayat_cetak (
    id_cetak SERIAL PRIMARY KEY,
    id_pengajuan INT NOT NULL,
    tanggal_cetak TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jumlah_cetak INT DEFAULT 1,
    status_cetak cetak_status DEFAULT 'berhasil',
    dicetak_oleh VARCHAR(20) NOT NULL,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pengajuan) REFERENCES pengajuan_surat(id_pengajuan) ON DELETE CASCADE,
    FOREIGN KEY (dicetak_oleh) REFERENCES users(nik) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 6. Tabel Audit Log
CREATE TABLE audit_log (
    id_log SERIAL PRIMARY KEY,
    nik VARCHAR(20),
    aksi VARCHAR(100),
    deskripsi TEXT,
    tabel_target VARCHAR(50),
    id_target VARCHAR(50),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nik) REFERENCES users(nik) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 7. Trigger Function untuk update timestamp otomatis (ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pengajuan_surat_updated_at
    BEFORE UPDATE ON pengajuan_surat
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert data jenis surat default
INSERT INTO jenis_surat (nama_jenis, deskripsi) VALUES
('Surat Keterangan Domisili', 'Surat untuk keterangan tempat tinggal'),
('Surat Keterangan Usaha', 'Surat untuk keterangan usaha/badan usaha'),
('Surat Keterangan Penghasilan', 'Surat untuk keterangan penghasilan'),
('Surat Referensi', 'Surat referensi dari kantor desa'),
('Surat Izin Usaha', 'Surat izin untuk menjalankan usaha'),
('Surat Keterangan Keluarga', 'Surat keterangan status keluarga'),
('Surat Keterangan Tidak Memiliki Hutang Pajak', 'Surat STNPPT'),
('Surat Permohonan Tanah', 'Surat permohonan untuk tanah');

-- 9. Indexes untuk optimasi performa
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pengajuan_user ON pengajuan_surat(nik);
CREATE INDEX idx_pengajuan_jenis ON pengajuan_surat(id_jenis);
CREATE INDEX idx_pengajuan_status ON pengajuan_surat(status);
CREATE INDEX idx_pengajuan_tanggal ON pengajuan_surat(tanggal_pengajuan);
CREATE INDEX idx_cetak_pengajuan ON riwayat_cetak(id_pengajuan);
CREATE INDEX idx_audit_user ON audit_log(nik);
