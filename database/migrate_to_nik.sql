-- MIGRATION SCRIPT: MENGUBAH PRIMARY KEY USERS MENJADI NIK (POSTGRESQL / SUPABASE)
-- Menjaga keutuhan data yang sudah ada (tidak menghapus data lama)

BEGIN;

-- 1. Hapus constraint foreign key lama (jika ada)
ALTER TABLE IF EXISTS pengajuan_surat DROP CONSTRAINT IF EXISTS pengajuan_surat_id_user_fkey;
ALTER TABLE IF EXISTS riwayat_cetak DROP CONSTRAINT IF EXISTS riwayat_cetak_dicetak_oleh_fkey;
ALTER TABLE IF EXISTS audit_log DROP CONSTRAINT IF EXISTS audit_log_id_user_fkey;

-- 2. Tambah kolom nik baru ke tabel pengajuan_surat, audit_log, dan riwayat_cetak
ALTER TABLE pengajuan_surat ADD COLUMN IF NOT EXISTS nik VARCHAR(20);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS nik VARCHAR(20);
ALTER TABLE riwayat_cetak ADD COLUMN IF NOT EXISTS dicetak_oleh_nik VARCHAR(20);

-- 3. Migrasikan data relasional: isi kolom nik baru berdasarkan id_user lama dari tabel users
UPDATE pengajuan_surat ps
SET nik = u.nik
FROM users u
WHERE ps.id_user = u.id_user;

UPDATE audit_log al
SET nik = u.nik
FROM users u
WHERE al.id_user = u.id_user;

UPDATE riwayat_cetak rc
SET dicetak_oleh_nik = u.nik
FROM users u
WHERE rc.dicetak_oleh = u.id_user;

-- 4. Set kolom nik menjadi NOT NULL (untuk tabel yang wajib ada user)
ALTER TABLE pengajuan_surat ALTER COLUMN nik SET NOT NULL;
ALTER TABLE riwayat_cetak ALTER COLUMN dicetak_oleh_nik SET NOT NULL;

-- 5. Hapus kolom id_user dan dicetak_oleh yang lama
ALTER TABLE pengajuan_surat DROP COLUMN IF EXISTS id_user;
ALTER TABLE audit_log DROP COLUMN IF EXISTS id_user;
ALTER TABLE riwayat_cetak DROP COLUMN IF EXISTS dicetak_oleh;

-- 6. Ganti nama kolom dicetak_oleh_nik menjadi dicetak_oleh di tabel riwayat_cetak
ALTER TABLE riwayat_cetak RENAME COLUMN dicetak_oleh_nik TO dicetak_oleh;

-- 7. Ubah Primary Key pada tabel users
-- Hapus Primary Key lama (biasanya bernama users_pkey)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
-- Hapus kolom id_user lama
ALTER TABLE users DROP COLUMN IF EXISTS id_user;
-- Daftarkan nik sebagai Primary Key baru
ALTER TABLE users ADD PRIMARY KEY (nik);

-- 8. Buat constraint foreign key baru dengan ON UPDATE CASCADE
ALTER TABLE pengajuan_surat
  ADD CONSTRAINT pengajuan_surat_nik_fkey
  FOREIGN KEY (nik) REFERENCES users(nik)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE riwayat_cetak
  ADD CONSTRAINT riwayat_cetak_dicetak_oleh_fkey
  FOREIGN KEY (dicetak_oleh) REFERENCES users(nik)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_nik_fkey
  FOREIGN KEY (nik) REFERENCES users(nik)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- 9. Ubah tipe data id_target di tabel audit_log agar bisa menampung NIK (string)
ALTER TABLE audit_log ALTER COLUMN id_target TYPE VARCHAR(50);

-- 10. Perbarui Index performa
DROP INDEX IF EXISTS idx_users_nik;
DROP INDEX IF EXISTS idx_pengajuan_user;
DROP INDEX IF EXISTS idx_audit_user;

CREATE INDEX idx_pengajuan_user ON pengajuan_surat(nik);
CREATE INDEX idx_audit_user ON audit_log(nik);

-- 11. Pastikan kolom-kolom profil tambahan ada di tabel users (jika belum terbuat)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pekerjaan VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_perkawinan VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS agama VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_ktp TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS no_hp VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP;

COMMIT;
