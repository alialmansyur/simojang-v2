-- ====================================================================
-- MIGRATION: LAYANAN MANAJEMEN RUANGAN (TATA USAHA)
-- SIMOJANG BKN KANREG III BANDUNG
-- ====================================================================

USE `simojang`;

-- --------------------------------------------------------------------
-- 1. TABEL: data_ruangan
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `data_ruangan` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `uid` CHAR(36) NOT NULL DEFAULT (UUID()),
  `kantor` ENUM('Kantor Regional III BKN', 'UPT BKN Serang', 'UPT BKN Bandung') NOT NULL DEFAULT 'Kantor Regional III BKN',
  `kode_ruangan` VARCHAR(50) DEFAULT NULL,
  `nama_ruangan` VARCHAR(150) NOT NULL,
  `lantai` VARCHAR(50) DEFAULT NULL,
  `kapasitas` INT(11) NOT NULL DEFAULT 0,
  `spesifikasi` TEXT DEFAULT NULL COMMENT 'JSON atau daftar fasilitas/spesifikasi (AC, Proyektor, Sound, Mic, TV, dll)',
  `foto` VARCHAR(255) DEFAULT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `status` ENUM('Tersedia', 'Digunakan', 'Pemeliharaan', 'Nonaktif') NOT NULL DEFAULT 'Tersedia',
  `created_by` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid_ruangan_unique` (`uid`),
  KEY `idx_ruangan_kantor` (`kantor`),
  KEY `idx_ruangan_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. ALTER TABEL data_assets: TAMBAH ruangan_id & FOREIGN KEY
-- --------------------------------------------------------------------
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'simojang' 
      AND TABLE_NAME = 'data_assets' 
      AND COLUMN_NAME = 'ruangan_id'
);

SET @sql = IF(
    @col_exists = 0,
    'ALTER TABLE `data_assets` ADD COLUMN `ruangan_id` INT(11) DEFAULT NULL AFTER `lokasi`, ADD CONSTRAINT `fk_assets_ruangan` FOREIGN KEY (`ruangan_id`) REFERENCES `data_ruangan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;',
    'SELECT "Column ruangan_id already exists in data_assets" AS status;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------------------
-- 3. REGISTRASI auth_permissions (PARENT: 206 - Bagian Tata Usaha Kanreg)
-- --------------------------------------------------------------------
INSERT INTO `auth_permissions` (`name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`)
SELECT 'Manajemen Ruangan', 'apps-manage-ruangan', 'bi bi-door-open', 206, 1, 39, 0
WHERE NOT EXISTS (
    SELECT 1 FROM `auth_permissions` WHERE `url` = 'apps-manage-ruangan' AND `parent_id` = 206
);

SET @perm_id = (SELECT `id` FROM `auth_permissions` WHERE `url` = 'apps-manage-ruangan' LIMIT 1);

-- --------------------------------------------------------------------
-- 4. REGISTRASI data_timkerja_layanan (TIMKERJA_ID: 6 - Tata Usaha)
-- --------------------------------------------------------------------
INSERT INTO `data_timkerja_layanan` (`timkerja_id`, `parent_id`, `level_id`, `permission_id`, `is_subservice`, `nama_layanan`, `deskripsi`, `alias`, `url`, `is_show`, `is_maintenance`)
SELECT 6, NULL, 2, @perm_id, 0, 'Manajemen Ruangan', 'Pengelolaan data ruangan kantor, fasilitas, kapasitas, foto, dan inventaris aset BMN di dalamnya.', 'Ruangan', 'apps-manage-ruangan', 1, 0
WHERE NOT EXISTS (
    SELECT 1 FROM `data_timkerja_layanan` WHERE `url` = 'apps-manage-ruangan' AND `timkerja_id` = 6
);

-- --------------------------------------------------------------------
-- 5. ASSIGN HAK AKSES auth_role_permissions (ADM & USR)
-- --------------------------------------------------------------------
-- Role 1: Administrator (Full Access)
INSERT INTO `auth_role_permissions` (`role_id`, `permission_id`, `is_create`, `is_read`, `is_update`, `is_delete`)
SELECT 1, @perm_id, 1, 1, 1, 1
WHERE NOT EXISTS (
    SELECT 1 FROM `auth_role_permissions` WHERE `role_id` = 1 AND `permission_id` = @perm_id
);

-- Role 2: User Pegawai / Tata Usaha (Full CRUD for TU module management)
INSERT INTO `auth_role_permissions` (`role_id`, `permission_id`, `is_create`, `is_read`, `is_update`, `is_delete`)
SELECT 2, @perm_id, 1, 1, 1, 1
WHERE NOT EXISTS (
    SELECT 1 FROM `auth_role_permissions` WHERE `role_id` = 2 AND `permission_id` = @perm_id
);

-- --------------------------------------------------------------------
-- 6. SEED DATA SAMPLE RUANGAN TATA USAHA (3 KANTOR)
-- --------------------------------------------------------------------
INSERT INTO `data_ruangan` (`kantor`, `kode_ruangan`, `nama_ruangan`, `lantai`, `kapasitas`, `spesifikasi`, `deskripsi`, `status`)
SELECT 'Kantor Regional III BKN', 'K3-AULA-01', 'Aula Papandayan Utama', 'Lantai 1', 200, 'AC Standing (4 unit), Proyektor Laser 5000 Lumens, Sound System & Wireless Mic, Podium, Smart Lighting, Panggung', 'Aula utama untuk pelantikan, seminar, rapat koordinasi pimpinan, dan kegiatan dinas berskala besar.', 'Tersedia'
WHERE NOT EXISTS (SELECT 1 FROM `data_ruangan` WHERE `kode_ruangan` = 'K3-AULA-01');

INSERT INTO `data_ruangan` (`kantor`, `kode_ruangan`, `nama_ruangan`, `lantai`, `kapasitas`, `spesifikasi`, `deskripsi`, `status`)
SELECT 'Kantor Regional III BKN', 'K3-RP-02', 'Ruang Rapat Tangkuban Parahu', 'Lantai 2', 30, 'AC Split (2 unit), Smart TV 65 Inch, Video Conference Camera, Whiteboard Magnetik, Meja Konferensi O-Shape', 'Ruang rapat formal untuk koordinasi tim kerja dan rapat pimpinan.', 'Tersedia'
WHERE NOT EXISTS (SELECT 1 FROM `data_ruangan` WHERE `kode_ruangan` = 'K3-RP-02');

INSERT INTO `data_ruangan` (`kantor`, `kode_ruangan`, `nama_ruangan`, `lantai`, `kapasitas`, `spesifikasi`, `deskripsi`, `status`)
SELECT 'Kantor Regional III BKN', 'K3-CAT-01', 'Ruang Fasilitasi CAT Kanreg', 'Lantai 3', 100, 'PC Client CAT (100 unit), Server CAT, AC Central, CCTV Monitoring, Metal Detector, UPS Central', 'Ruangan ujian Computer Assisted Test (CAT) untuk seleksi CASN dan kedinasan.', 'Tersedia'
WHERE NOT EXISTS (SELECT 1 FROM `data_ruangan` WHERE `kode_ruangan` = 'K3-CAT-01');

INSERT INTO `data_ruangan` (`kantor`, `kode_ruangan`, `nama_ruangan`, `lantai`, `kapasitas`, `spesifikasi`, `deskripsi`, `status`)
SELECT 'UPT BKN Serang', 'SRG-RP-01', 'Ruang Rapat UPT BKN Serang', 'Lantai 1', 25, 'AC Split, Smart TV 55 Inch, Whiteboard, High Speed WiFi, Sound Mic Wireless', 'Ruang pertemuan dan koordinasi pelayanan kepegawaian wilayah Banten.', 'Tersedia'
WHERE NOT EXISTS (SELECT 1 FROM `data_ruangan` WHERE `kode_ruangan` = 'SRG-RP-01');

INSERT INTO `data_ruangan` (`kantor`, `kode_ruangan`, `nama_ruangan`, `lantai`, `kapasitas`, `spesifikasi`, `deskripsi`, `status`)
SELECT 'UPT BKN Bandung', 'BDG-RP-01', 'Ruang Rapat UPT BKN Bandung', 'Lantai 1', 20, 'AC Split, Projector EPSON, Meja Rapat Kayu Jati, Kursi Ergonomis', 'Ruang rapat operasional tim pelayanan UPT Bandung.', 'Tersedia'
WHERE NOT EXISTS (SELECT 1 FROM `data_ruangan` WHERE `kode_ruangan` = 'BDG-RP-01');
