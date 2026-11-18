-- ========================================================================================
-- SIMOJANG V2 - UNIFIED RBAC, FASILITASI CAT & SERVICE HIERARCHY MIGRATION SCRIPT
-- Single Source of Truth (SSOT) Navigasi, Fasilitasi CAT & Hak Akses Role
-- ========================================================================================
-- Script ini bersifat Idempotent (aman dijalankan berulang tanpa data duplikat).
-- Kompatibel dengan MariaDB 10.4+ / MySQL 8.0+
-- ========================================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------------------
-- 1. TABEL BARU & MODIFIKASI SKEMA: FASILITASI CAT & DOKUMEN PNBP
-- ----------------------------------------------------------------------------------------

-- 1.1 Tabel Pengelola CAT (Whitelist Akses Pengelola CAT)
CREATE TABLE IF NOT EXISTS `cfg_cat_pengelola` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `nip` varchar(30) NOT NULL,
  `nama` varchar(150) DEFAULT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cat_pengelola_nip` (`nip`),
  KEY `idx_cat_pengelola_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cfg_cat_pengelola` (`nip`, `nama`, `keterangan`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
('199707252024211004', 'ALI AL MANSYUR, A.Md.', 'Pengelola Resmi CAT', 1, 'system', NOW(), NOW()),
('198707302008122001', 'WALETTA DINDA MARINA, S.T.', 'Pengelola Resmi CAT', 1, 'system', NOW(), NOW()),
('199612052024211008', 'RIJAL FADILAH, A.Md.Kom.', 'Pengelola Resmi CAT', 1, 'system', NOW(), NOW()),
('199011092022032007', 'NOVA LASTRIANA, S.Kom.', 'Pengelola Resmi CAT', 1, 'system', NOW(), NOW()),
('199506062024212040', 'YANI SRI MULYANTI, A.Md.Ak.', 'Pengelola Resmi CAT', 1, 'system', NOW(), NOW()),
('199509302024212031', 'DINA NURHASANAH, A.Md.', 'Pengelola Resmi CAT', 1, 'system', NOW(), NOW())
ON DUPLICATE KEY UPDATE `nama` = VALUES(`nama`), `keterangan` = VALUES(`keterangan`), `is_active` = 1, `updated_at` = NOW();

-- 1.2 Tabel Laporan & Berita Acara CAT (Snapshot Dokumen & TTE)
CREATE TABLE IF NOT EXISTS `txn_cat_laporan` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uid` varchar(64) NOT NULL,
  `jenis_laporan` varchar(64) NOT NULL DEFAULT 'laporan-pelaksanaan-cat',
  `nomor_dokumen` varchar(150) DEFAULT NULL,
  `judul_laporan` varchar(255) NOT NULL,
  `tanggal_dokumen` date DEFAULT NULL,
  `tanggal_pelaksanaan` date DEFAULT NULL,
  `jenis_tes_id` varchar(64) DEFAULT NULL,
  `seleksi_id` int(11) unsigned DEFAULT NULL,
  `tilok_id` varchar(64) DEFAULT NULL,
  `instansi_id` varchar(255) DEFAULT NULL COMMENT 'Comma separated instansi IDs atau null jika tilok',
  `periode` varchar(10) DEFAULT NULL,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `params_json` longtext DEFAULT NULL COMMENT 'Form parameters: dasar surat, waktu, kota, dll',
  `data_snapshot_json` longtext DEFAULT NULL COMMENT 'Snapshot beku data sesi, peserta hadir/tidak',
  `signers_json` longtext DEFAULT NULL COMMENT 'Snapshot 3 penandatangan (kiri, tengah, kanan) & e-sign data',
  `evidence_json` longtext DEFAULT NULL COMMENT 'Snapshot foto eviden dokumentasi',
  `created_by_nip` varchar(50) DEFAULT NULL,
  `created_by_name` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cat_laporan_uid` (`uid`),
  KEY `idx_cat_laporan_type_status` (`jenis_laporan`,`status`),
  KEY `idx_cat_laporan_scope` (`seleksi_id`,`tilok_id`),
  KEY `idx_cat_laporan_creator` (`created_by_nip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.3 Tabel E-Sign Penandatangan Laporan CAT
CREATE TABLE IF NOT EXISTS `txn_cat_user_signers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_nip` varchar(50) NOT NULL,
  `user_name` varchar(150) DEFAULT NULL,
  `jenis_tes_id` varchar(64) DEFAULT NULL,
  `seleksi_id` int(11) unsigned DEFAULT NULL,
  `tilok_id` varchar(64) DEFAULT NULL,
  `instansi_id` varchar(100) DEFAULT NULL COMMENT 'NULL berarti berlaku untuk seluruh tilok',
  `position_key` varchar(20) NOT NULL DEFAULT 'kanan' COMMENT 'kiri, tengah, kanan',
  `jabatan` varchar(255) DEFAULT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `nip` varchar(50) DEFAULT NULL,
  `pangkat_gol` varchar(100) DEFAULT NULL,
  `instansi_nama` varchar(255) DEFAULT NULL,
  `signature_data` longtext DEFAULT NULL COMMENT 'Base64 image TTE',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cat_user_signers_user_pos` (`user_nip`,`position_key`),
  KEY `idx_cat_user_signers_scope` (`seleksi_id`,`tilok_id`,`instansi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.4 Tabel Jadwal Pelaksanaan Kegiatan CAT (Master Jadwal Tilok)
CREATE TABLE IF NOT EXISTS `txn_cat_jadwal` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uid` varchar(64) NOT NULL,
  `jenis_periode_id` int(11) unsigned DEFAULT NULL,
  `jenis_tes_id` int(11) unsigned NOT NULL,
  `seleksi_id` int(11) unsigned NOT NULL,
  `tilok_id` int(11) unsigned NOT NULL,
  `instansi_id` varchar(50) DEFAULT NULL,
  `nama_jadwal` varchar(255) DEFAULT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `st_status` enum('menunggu','terhubung') NOT NULL DEFAULT 'menunggu',
  `st_document_id` bigint(20) unsigned DEFAULT NULL,
  `nomor_st` varchar(120) DEFAULT NULL,
  `tanggal_st` date DEFAULT NULL,
  `status` enum('draft','aktif','selesai','batal') NOT NULL DEFAULT 'aktif',
  `catatan` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cat_jadwal_uid` (`uid`),
  KEY `idx_cat_jadwal_hierarchy` (`jenis_tes_id`,`seleksi_id`,`tilok_id`),
  KEY `idx_cat_jadwal_dates` (`tanggal_mulai`,`tanggal_selesai`),
  KEY `idx_cat_jadwal_st_status` (`st_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.5 Tabel Pemetaan Instansi pada Jadwal CAT
CREATE TABLE IF NOT EXISTS `txn_cat_jadwal_instansi` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `jadwal_id` bigint(20) unsigned NOT NULL,
  `instansi_id` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cat_jadwal_instansi` (`jadwal_id`,`instansi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.6 Tabel Petugas Tim Kerja CAT Lapangan
CREATE TABLE IF NOT EXISTS `txn_cat_tim` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `jadwal_id` bigint(20) unsigned NOT NULL,
  `pegawai_id` int(11) unsigned DEFAULT NULL,
  `nip` varchar(30) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `pangkat_gol` varchar(100) DEFAULT NULL,
  `jabatan` varchar(255) DEFAULT NULL,
  `peran` enum('Koordinator','IT','Pengawas') NOT NULL DEFAULT 'Pengawas',
  `st_document_id` bigint(20) unsigned DEFAULT NULL,
  `nomor_st` varchar(120) DEFAULT NULL,
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_selesai` date DEFAULT NULL,
  `catatan` varchar(255) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cat_tim_jadwal_peran` (`jadwal_id`,`peran`),
  KEY `idx_cat_tim_nip` (`nip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.7 Penyesuaian Kolom Status Batal pada Jadwal CAT (Idempotent jika tabel sudah ada versi lama)
ALTER TABLE `txn_cat_jadwal` MODIFY COLUMN `status` ENUM('draft','aktif','selesai','batal') NOT NULL DEFAULT 'aktif';

-- 1.8 Penyesuaian Dokumen PNBP CAT (Upload, Personel Eksternal & Relasi Jadwal)
ALTER TABLE `txn_pnbp_documents` ADD COLUMN IF NOT EXISTS `jadwal_id` BIGINT(20) UNSIGNED NULL DEFAULT NULL AFTER `instansi_id`;
ALTER TABLE `txn_pnbp_documents` ADD COLUMN IF NOT EXISTS `source_mode` ENUM('builder','upload') NOT NULL DEFAULT 'builder' AFTER `status`;
ALTER TABLE `txn_pnbp_documents` ADD COLUMN IF NOT EXISTS `original_filename` VARCHAR(255) NULL DEFAULT NULL AFTER `pdf_file_path`;
ALTER TABLE `txn_pnbp_doc_personel` ADD COLUMN IF NOT EXISTS `is_external` TINYINT(1) NOT NULL DEFAULT 0 AFTER `nip`;
ALTER TABLE `txn_pnbp_doc_personel` ADD COLUMN IF NOT EXISTS `instansi_asal` VARCHAR(255) NULL DEFAULT NULL AFTER `nama`;

-- 1.9 Penyesuaian Kolom Digital Document Management System (DMS)
ALTER TABLE `txn_dms_entry`
  ADD COLUMN IF NOT EXISTS `skor_arsip` DECIMAL(5,2) NULL DEFAULT 0.00 AFTER `total`,
  ADD COLUMN IF NOT EXISTS `keterangan` VARCHAR(50) NULL DEFAULT 'Lengkap' AFTER `skor_arsip`,
  ADD COLUMN IF NOT EXISTS `total_pns` INT(11) NULL DEFAULT 0 AFTER `keterangan`,
  ADD COLUMN IF NOT EXISTS `status_cpns` INT(11) NULL DEFAULT 0 AFTER `total_pns`,
  ADD COLUMN IF NOT EXISTS `status_pns` INT(11) NULL DEFAULT 0 AFTER `status_cpns`,
  ADD COLUMN IF NOT EXISTS `jumlah_sangat_lengkap` INT(11) NULL DEFAULT 0 AFTER `status_pns`,
  ADD COLUMN IF NOT EXISTS `jumlah_lengkap` INT(11) NULL DEFAULT 0 AFTER `jumlah_sangat_lengkap`,
  ADD COLUMN IF NOT EXISTS `jumlah_cukup_lengkap` INT(11) NULL DEFAULT 0 AFTER `jumlah_lengkap`,
  ADD COLUMN IF NOT EXISTS `jumlah_kurang_lengkap` INT(11) NULL DEFAULT 0 AFTER `jumlah_cukup_lengkap`;

-- 1.10 Normalisasi Data & Skema Pegawai Internal (Statistik Internal)
UPDATE `data_pegawai` SET `status_pegawai_id` = '1' WHERE UPPER(TRIM(`status_pegawai_id`)) = 'PNS' OR `status_pegawai_id` = '1';
UPDATE `data_pegawai` SET `status_pegawai_id` = '2' WHERE UPPER(TRIM(`status_pegawai_id`)) = 'PPPK' OR `status_pegawai_id` = '2';
UPDATE `data_pegawai` SET `status_pegawai_id` = '3' WHERE UPPER(TRIM(`status_pegawai_id`)) IN ('PPPK PW', 'PPPK-PW', 'PARUH WAKTU') OR `status_pegawai_id` = '3' OR `status_pegawai_id` LIKE '%PW%';
UPDATE `data_pegawai` SET `status_pegawai_id` = '4' WHERE UPPER(TRIM(`status_pegawai_id`)) = 'PPNPN' OR `status_pegawai_id` = '4';
UPDATE `data_pegawai` SET `status_pegawai_id` = '5' WHERE UPPER(TRIM(`status_pegawai_id`)) = 'MAGANG' OR `status_pegawai_id` = '5';
UPDATE `data_pegawai` SET `status_pegawai_id` = NULL WHERE `status_pegawai_id` NOT REGEXP '^[0-9]+$';
ALTER TABLE `data_pegawai` MODIFY COLUMN `status_pegawai_id` INT(11) NULL DEFAULT NULL;
UPDATE `data_pegawai` SET `pangkat_id` = NULL WHERE `pangkat_id` = 0;
UPDATE `data_pegawai` SET `menikah` = 'Belum Menikah' WHERE TRIM(`menikah`) = 'Belum Kawin';
UPDATE `data_pegawai` SET `menikah` = 'Duda / Janda' WHERE TRIM(`menikah`) IN ('Janda', 'Janda / Duda', 'Duda');
UPDATE `data_pegawai` SET `menikah` = NULL WHERE TRIM(`menikah`) = '';
UPDATE `data_pegawai` SET `gender` = '1' WHERE LOWER(TRIM(`gender`)) IN ('l', 'lk', 'pria', 'laki-laki');
UPDATE `data_pegawai` SET `gender` = '2' WHERE LOWER(TRIM(`gender`)) IN ('p', 'pr', 'wanita', 'perempuan');

-- 1.11 Penyelarasan Dokumen PNBP CAT (Hapus Faktur & Konsolidasi ke Kwitansi Jamuan)
UPDATE `txn_pnbp_documents` SET `doc_type` = 'kwitansi_jamuan' WHERE `doc_type` = 'faktur';
ALTER TABLE `txn_pnbp_documents` MODIFY COLUMN `doc_type` ENUM('sp','st','nominatif','kwitansi','hadir','kwitansi_jamuan','surat_jalan','hadir_jamuan') NOT NULL;

-- 1.12 Perbaikan Tabel Legacy Pembinaan Disiplin & Pengaduan (Mengatasi Galat MariaDB Error 4078 UUID cast)
DROP TABLE IF EXISTS `txn_pembinaan_disiplin`;
CREATE TABLE IF NOT EXISTS `txn_pembinaan_disiplin` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) NOT NULL DEFAULT uuid(),
  `period` varchar(50) DEFAULT NULL,
  `period_date` date DEFAULT NULL,
  `period_start_date` date DEFAULT NULL,
  `period_end_date` date DEFAULT NULL,
  `instansi_id` bigint(20) NOT NULL DEFAULT 0,
  `jenis_kegiatan` enum('SOSIALISASI','ASISTENSI','PENDAMPINGAN') NOT NULL,
  `media_id` bigint(20) DEFAULT NULL,
  `media_url` text NOT NULL,
  `jumlah_konsultasi` int(11) DEFAULT 0,
  `keterangan` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `instansi_id` (`instansi_id`) USING BTREE,
  KEY `media_id` (`media_id`) USING BTREE,
  KEY `idx_txn_pembinaan_disiplin_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `txn_pembinaan_pengaduan`;
CREATE TABLE IF NOT EXISTS `txn_pembinaan_pengaduan` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) NOT NULL DEFAULT uuid(),
  `period` varchar(50) DEFAULT NULL,
  `period_date` date DEFAULT NULL,
  `period_start_date` date DEFAULT NULL,
  `period_end_date` date DEFAULT NULL,
  `instansi_id` bigint(20) NOT NULL DEFAULT 0,
  `media_id` bigint(20) NOT NULL DEFAULT 0,
  `media_url` text NOT NULL,
  `jumlah_pengaduan` int(11) DEFAULT 0,
  `tanggal` date NOT NULL,
  `keterangan` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `instansi_id` (`instansi_id`) USING BTREE,
  KEY `media_id` (`media_id`) USING BTREE,
  KEY `idx_txn_pembinaan_pengaduan_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------------------------------------------------------------------
-- 2. ALTER TABLE: Penambahan Kolom Hierarki pada Tabel Layanan & Tim Kerja
-- ----------------------------------------------------------------------------------------

-- 2.1 auth_permissions
ALTER TABLE `auth_permissions` ADD COLUMN IF NOT EXISTS `is_external` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_order`;

-- 2.2 data_timkerja
ALTER TABLE `data_timkerja` ADD COLUMN IF NOT EXISTS `permission_id` BIGINT UNSIGNED NULL DEFAULT NULL AFTER `is_show`;

-- 2.3 data_timkerja_layanan
ALTER TABLE `data_timkerja_layanan` ADD COLUMN IF NOT EXISTS `parent_id` BIGINT(20) NULL DEFAULT NULL AFTER `timkerja_id`;
ALTER TABLE `data_timkerja_layanan` ADD COLUMN IF NOT EXISTS `is_subservice` TINYINT(1) NOT NULL DEFAULT 0 AFTER `parent_id`;
ALTER TABLE `data_timkerja_layanan` ADD COLUMN IF NOT EXISTS `level_id` TINYINT(4) NOT NULL DEFAULT 2 AFTER `parent_id`;
ALTER TABLE `data_timkerja_layanan` ADD COLUMN IF NOT EXISTS `permission_id` BIGINT UNSIGNED NULL DEFAULT NULL AFTER `level_id`;
ALTER TABLE `data_timkerja_layanan` ADD COLUMN IF NOT EXISTS `is_maintenance` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_show`;
ALTER TABLE `data_timkerja_layanan` ADD COLUMN IF NOT EXISTS `maintenance_msg` VARCHAR(255) NULL DEFAULT NULL AFTER `is_maintenance`;
ALTER TABLE `data_timkerja_layanan` ADD COLUMN IF NOT EXISTS `maintenance_updated_at` DATETIME NULL DEFAULT NULL AFTER `maintenance_msg`;
ALTER TABLE `data_timkerja_layanan` ADD COLUMN IF NOT EXISTS `maintenance_updated_by` INT(11) NULL DEFAULT NULL AFTER `maintenance_updated_at`;

-- ----------------------------------------------------------------------------------------
-- 3. PEMBERSIHAN & NORMALISASI: data_timkerja_layanan
-- ----------------------------------------------------------------------------------------
DELETE FROM `data_timkerja_layanan` WHERE `level_id` = 4 OR `id` IN (53, 54, 55, 56, 57, 58);

-- Update level_id & is_subservice
UPDATE `data_timkerja_layanan` SET `level_id` = 2, `is_subservice` = 0 WHERE `parent_id` IS NULL;
UPDATE `data_timkerja_layanan` SET `level_id` = 3, `is_subservice` = 1 WHERE `parent_id` IS NOT NULL;

-- ----------------------------------------------------------------------------------------
-- 4. MASTER MENU SISTEM: auth_permissions
-- ----------------------------------------------------------------------------------------

-- 4.1 Nonaktifkan menu legacy lama (is_show = 0)
UPDATE `auth_permissions` 
SET `is_show` = 0 
WHERE `id` IN (7, 45, 47, 48, 49, 50, 51, 52, 60, 96, 97);

-- 4.2 Menu Utama Root (Depth 0)
INSERT INTO `auth_permissions` (`id`, `name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`) VALUES
(94, 'Home', 'dashboard', 'bi bi-grid-fill', NULL, 1, 1, 0),
(95, 'Kalender Kantor', 'calendar-event', 'bi bi-calendar', NULL, 1, 2, 0),
(57, 'Tim Kerja', 'timkerja', 'bi bi-chat-quote-fill', NULL, 1, 3, 0),
(98, 'Galeri Kegiatan', 'activity-gallery', 'bi bi-camera-fill', NULL, 1, 5, 0),
(100, 'Layanan Eksternal', '#', 'bi bi-box-arrow-up-right', NULL, 1, 10, 1),
(500, 'Pengaturan & Referensi', '#', 'bi bi-gear-fill', NULL, 1, 999, 0)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), `url` = VALUES(`url`), `icon` = VALUES(`icon`), 
    `parent_id` = VALUES(`parent_id`), `is_show` = VALUES(`is_show`), 
    `is_order` = VALUES(`is_order`), `is_external` = VALUES(`is_external`);

-- 4.3 Layanan Eksternal (Depth 1, Parent ID 100)
INSERT INTO `auth_permissions` (`id`, `name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`) VALUES
(101, 'Dashboard Executive', 'https://kanreg3.id/dashboard-executive/', 'bi bi-speedometer2', 100, 1, 1, 1),
(102, 'Dashboard Simanja', 'https://kanreg3.id/simanja-dashboard/', 'bi bi-graph-up', 100, 1, 2, 1),
(103, 'Sikasep', 'https://kanreg3.id/sikasep/login', 'bi bi-shield-check', 100, 1, 3, 1),
(104, 'Simanja', 'https://kanreg3.id/simanja/', 'bi bi-briefcase', 100, 1, 4, 1),
(105, 'Siwaregtilu', 'https://kanreg3.id/siwaregtilu/', 'bi bi-globe2', 100, 1, 5, 1),
(106, 'Siolin', 'https://kanreg3.id/siolin/', 'bi bi-layers', 100, 1, 6, 1)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), `url` = VALUES(`url`), `icon` = VALUES(`icon`), 
    `parent_id` = VALUES(`parent_id`), `is_show` = VALUES(`is_show`), 
    `is_order` = VALUES(`is_order`), `is_external` = VALUES(`is_external`);

-- 4.4 6 Tim Kerja Kanreg III (Depth 1, Parent ID 57)
INSERT INTO `auth_permissions` (`id`, `name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`) VALUES
(201, 'Tim Kerja Pengangkatan dan Mutasi', 'timkerja/pnm', 'bi bi-person-check', 57, 1, 1, 0),
(202, 'Tim Kerja Status dan Pemberhentian', 'timkerja/snp', 'bi bi-shield-exclamation', 57, 1, 2, 0),
(203, 'Tim Kerja Pembinaan Manajemen ASN', 'timkerja/pmasn', 'bi bi-award', 57, 1, 3, 0),
(204, 'Tim Kerja Pengawasan dan Pengendalian', 'timkerja/pnp', 'bi bi-file-earmark-check', 57, 1, 4, 0),
(205, 'Tim Kerja Sistem Informasi dan Digitalisasi', 'timkerja/sidigi', 'bi bi-cpu', 57, 1, 5, 0),
(206, 'Bagian Tata Usaha Kanreg', 'timkerja/tu', 'bi bi-building', 57, 1, 6, 0)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), `url` = VALUES(`url`), `icon` = VALUES(`icon`), 
    `parent_id` = VALUES(`parent_id`), `is_show` = VALUES(`is_show`), 
    `is_order` = VALUES(`is_order`), `is_external` = VALUES(`is_external`);

UPDATE `data_timkerja` SET `permission_id` = 201 WHERE `id` = 1;
UPDATE `data_timkerja` SET `permission_id` = 202 WHERE `id` = 2;
UPDATE `data_timkerja` SET `permission_id` = 203 WHERE `id` = 3;
UPDATE `data_timkerja` SET `permission_id` = 204 WHERE `id` = 4;
UPDATE `data_timkerja` SET `permission_id` = 205 WHERE `id` = 5;
UPDATE `data_timkerja` SET `permission_id` = 206 WHERE `id` = 6;

-- 4.5 Layanan Tim Kerja (Depth 2, Parent ID 201-206)
INSERT INTO `auth_permissions` (`id`, `name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`) VALUES
-- PNM (Parent 201)
(301, 'Verifikasi dan validasi penyusunan kebutuhan pegawai ASN', 'layanan/1', 'bi bi-grid', 201, 1, 1, 0),
(302, 'Penetapan NIP CPNS / NI PPPK', 'apps-tapnip', 'bi bi-grid', 201, 1, 2, 0),
(303, 'Pindah Instansi', 'apps-pi', 'bi bi-grid', 201, 1, 3, 0),
(304, 'Pencantuman Gelar', 'apps-pg', 'bi bi-grid', 201, 1, 4, 0),
(305, 'Peninjauan Masa Kerja', 'apps-pmk', 'bi bi-grid', 201, 1, 5, 0),
(306, 'Kenaikan Pangkat', 'apps-kp', 'bi bi-grid', 201, 1, 6, 0),
-- SNP (Parent 202)
(307, 'Cuti Diluar Tanggungan Negara', 'apps-cltn', 'bi bi-grid', 202, 1, 7, 0),
(308, 'Pengaktifan kembali sebagai ASN', 'apps-asn-aktif', 'bi bi-grid', 202, 1, 8, 0),
(309, 'Pengangkatan CPNS menjadi PNS yang melebihi ketentuan', 'apps-cpns-pns', 'bi bi-grid', 202, 1, 9, 0),
(310, 'Penetapan Pertek Pensiun PNS dan Janda / Dudanya', 'apps-pertek-pensiun', 'bi bi-grid', 202, 1, 10, 0),
(311, 'Penetapan SK Pensiun Janda/Duda Pensiunan PNS', 'apps-sk-pensiun', 'bi bi-grid', 202, 1, 11, 0),
(312, 'Pendaftaran Keluarga Bagi Pensiunan PNS yang Menikah Kembali', 'apps-regis-pensiun', 'bi bi-grid', 202, 1, 12, 0),
-- PMASN (Parent 203)
(313, 'Manajemen Talenta', 'apps-mt', 'bi bi-grid', 203, 1, 13, 0),
(314, 'Pembinaan Kinerja dan Penghargaan', 'apps-pembinaan-kinerja', 'bi bi-grid', 203, 1, 14, 0),
(315, 'Pengembangan Kompetensi', 'apps-pembinaan-kompetensi-karier', 'bi bi-grid', 203, 1, 15, 0),
(316, 'Pembinaan Disiplin, Budaya Kerja, dan Citra Institusi', 'apps-pembinaan-disiplin-budaya-citra', 'bi bi-grid', 203, 1, 16, 0),
(339, 'Penilaian kompetensi', 'apps-kompetensi', 'bi bi-grid', 203, 1, 39, 0),
(340, 'Penilaian Karier', 'apps-karier', 'bi bi-grid', 203, 1, 40, 0),
-- PNP (Parent 204)
(317, 'Penyelesaian Permasalahan Manajemen ASN', 'layanan/17', 'bi bi-grid', 204, 1, 17, 0),
(318, 'Pengawasan Sistem Merit', 'apps-merit', 'bi bi-grid', 204, 1, 18, 0),
(319, 'Pengukuran Indeks NSPK/Indeks Merit', 'apps-nspk', 'bi bi-grid', 204, 1, 19, 0),
(320, 'Pengawasan Penerapan Netralitas, Disiplin, Kode Etik dan Perilaku', 'apps-wasdal', 'bi bi-grid', 204, 1, 20, 0),
-- SIDIGI (Parent 205)
(321, 'Penyajian Statistik Data Kepegawaian secara periodik', 'apps-statistik', 'bi bi-grid', 205, 1, 21, 0),
(322, 'Peremajaan Data ASN', 'apps-pdm', 'bi bi-grid', 205, 1, 22, 0),
(323, 'Pendampingan Peningkatan Kualitas Data ASN', 'apps-dispa', 'bi bi-grid', 205, 1, 23, 0),
(324, 'Pendampingan Integrasi SIASN dengan SIMPEG Instansi Daerah', 'apps-integrasi', 'bi bi-grid', 205, 1, 24, 0),
(325, 'Pengelolaan dokumen arsip kepegawaian', 'apps-takah', 'bi bi-grid', 205, 1, 25, 0),
(326, 'Digitalisasi arsip kepegawaian', 'apps-dms', 'bi bi-grid', 205, 1, 26, 0),
(327, 'Pengelolaan sistem/infrastruktur dan keamanan informasi', 'apps-infra', 'bi bi-grid', 205, 1, 27, 0),
(328, 'Fasilitasi Seleksi Menggunakan Metode Computer Assisted Test', 'apps-cat', 'bi bi-grid', 205, 1, 28, 0),
(342, 'Dokumen Seleksi PNBP', 'apps-pnbp', 'bi bi-grid', 205, 1, 42, 0),
-- TU (Parent 206)
(329, 'Pagu & Realisasi Anggaran', 'apps-anggaran', 'bi bi-grid', 206, 1, 29, 0),
(330, 'Hasil Survey IKM', 'apps-ikm', 'bi bi-grid', 206, 1, 30, 0),
(331, 'Kehumasan & Publikasi', 'apps-humas', 'bi bi-grid', 206, 1, 31, 0),
(332, 'Pengelolaan Persuratan', 'apps-surat', 'bi bi-grid', 206, 1, 32, 0),
(333, 'Pelayanan Konsultasi', 'apps-konsultasi', 'bi bi-grid', 206, 1, 33, 0),
(334, 'Analisa Kinerja Pelaksanaan Anggaran', 'apps-ikpa', 'bi bi-grid', 206, 1, 34, 0),
(335, 'Statistik Kepegawaian Internal', 'apps-statistik-internal', 'bi bi-grid', 206, 1, 35, 0),
(336, 'Manajemen E-Kinerja', 'apps-ekin', 'bi bi-grid', 206, 1, 36, 0),
(337, 'Manajemen Asset', 'apps-manage-assets', 'bi bi-grid', 206, 1, 37, 0),
(338, 'Manajemen Proyek', 'apps-manage-project', 'bi bi-grid', 206, 1, 38, 0),
(341, 'Informasi Barang Hilang & Ditemukan', 'apps-lost-and-found', 'bi bi-grid', 206, 1, 41, 0),
(343, 'Manajemen Capaian IKK', 'apps-ikk', 'bi bi-grid', 206, 1, 43, 0)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), `url` = VALUES(`url`), `icon` = VALUES(`icon`), 
    `parent_id` = VALUES(`parent_id`), `is_show` = VALUES(`is_show`), 
    `is_order` = VALUES(`is_order`), `is_external` = VALUES(`is_external`);

UPDATE `data_timkerja_layanan` SET `permission_id` = (300 + `id`) WHERE `level_id` = 2;

-- 4.6 Sub-Layanan Hub (Depth 3, Parent ID 328, 329, 335)
INSERT INTO `auth_permissions` (`id`, `name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`) VALUES
-- Fasilitasi CAT (Parent 328)
(444, 'Rekap Data Sesi CAT', 'apps-cat-rekap', 'bi bi-diagram-2', 328, 1, 44, 0),
(445, 'Rekapitulasi Capaian CAT', 'apps-cat-rekapitulasi', 'bi bi-diagram-2', 328, 1, 45, 0),
(446, 'Laporan & Berita Acara CAT', 'apps-cat-laporan', 'bi bi-diagram-2', 328, 1, 46, 0),
(447, 'Pengelola Layanan CAT', 'apps-cat-pengelola', 'bi bi-diagram-2', 328, 1, 47, 0),
-- Pagu & Realisasi Anggaran (Parent 329)
(448, 'Master Data Anggaran', 'apps-anggaran-master', 'bi bi-diagram-2', 329, 1, 48, 0),
(449, 'Realisasi Anggaran', 'apps-anggaran-realisasi', 'bi bi-diagram-2', 329, 1, 49, 0),
-- Statistik Kepegawaian Internal (Parent 335)
(450, 'Data Pegawai Internal', 'apps-statistik-internal-pegawai', 'bi bi-diagram-2', 335, 1, 50, 0),
(451, 'Peta Jabatan & Bezzeting', 'apps-statistik-internal-peta', 'bi bi-diagram-2', 335, 1, 51, 0),
(452, 'Master Data Kepegawaian', 'apps-statistik-internal-master', 'bi bi-diagram-2', 335, 1, 52, 0)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), `url` = VALUES(`url`), `icon` = VALUES(`icon`), 
    `parent_id` = VALUES(`parent_id`), `is_show` = VALUES(`is_show`), 
    `is_order` = VALUES(`is_order`), `is_external` = VALUES(`is_external`);

-- 4.6.1 Seeding Sub-Layanan Hierarki pada data_timkerja_layanan (9 Sub-Layanan Hub)
INSERT INTO `data_timkerja_layanan` (`id`, `uuid`, `timkerja_id`, `parent_id`, `level_id`, `permission_id`, `is_subservice`, `nama_layanan`, `deskripsi`, `alias`, `url`, `is_count`, `is_show`, `is_maintenance`) VALUES
(44, UUID(), 5, 28, 3, 444, 1, 'Rekap Data Sesi CAT', 'Input, monitoring, dan sinkronisasi sesi ujian CAT serta presensi peserta.', 'CAT-REKAP', 'apps-cat-rekap', 0, 1, 0),
(45, UUID(), 5, 28, 3, 445, 1, 'Rekapitulasi Capaian CAT', 'Matriks ringkasan capaian kehadiran, kelulusan, dan evaluasi CAT per instansi.', 'CAT-REKAPITULASI', 'apps-cat-rekapitulasi', 0, 1, 0),
(46, UUID(), 5, 28, 3, 446, 1, 'Laporan & Berita Acara CAT', 'Pembuatan laporan pelaksanaan CAT, berita acara profiling ASN, formulir sarpras, dan TTE.', 'CAT-LAPORAN', 'apps-cat-laporan', 0, 1, 0),
(47, UUID(), 5, 28, 3, 447, 1, 'Pengelola Layanan CAT', 'Manajemen jadwal seleksi, penugasan tim kerja lapangan, dokumen PNBP, dan master data CAT.', 'CAT-PENGELOLA', 'apps-cat-pengelola', 0, 1, 0),
(48, UUID(), 6, 29, 3, 448, 1, 'Master Data Anggaran', 'Pengelolaan pagu anggaran DIPA, akun belanja, pohon anggaran, dan komponen program.', 'ANGGARAN-MASTER', 'apps-anggaran-master', 0, 1, 0),
(49, UUID(), 6, 29, 3, 449, 1, 'Realisasi Anggaran', 'Pencatatan realisasi pencairan anggaran DIPA, persentase serapan, dan sisa pagu belanja.', 'ANGGARAN-REALISASI', 'apps-anggaran-realisasi', 0, 1, 0),
(50, UUID(), 6, 35, 3, 450, 1, 'Data Pegawai Internal', 'Pengelolaan profil ASN Kanreg III, pemantauan BUP pensiun, status keaktifan, dan impor Excel.', 'STATISTIK-PEGAWAI-INT', 'apps-statistik-internal-pegawai', 0, 1, 0),
(51, UUID(), 6, 35, 3, 451, 1, 'Peta Jabatan & Bezzeting', 'Analisis kebutuhan formasi riil pegawai terisi (bezzeting), kelas jabatan, dan lowongan.', 'STATISTIK-PETA-JABATAN', 'apps-statistik-internal-peta', 0, 1, 0),
(52, UUID(), 6, 35, 3, 452, 1, 'Master Data Kepegawaian', 'Konfigurasi 8 tabel referensi kepegawaian internal (Pendidikan, Unit SK, Jenis Jabatan, Agama, dll).', 'STATISTIK-MASTER-DATA', 'apps-statistik-internal-master', 0, 1, 0)
ON DUPLICATE KEY UPDATE
    `timkerja_id` = VALUES(`timkerja_id`), `parent_id` = VALUES(`parent_id`),
    `level_id` = VALUES(`level_id`), `permission_id` = VALUES(`permission_id`),
    `is_subservice` = VALUES(`is_subservice`), `nama_layanan` = VALUES(`nama_layanan`),
    `deskripsi` = VALUES(`deskripsi`), `alias` = VALUES(`alias`), `url` = VALUES(`url`),
    `is_show` = VALUES(`is_show`);

UPDATE `data_timkerja_layanan` SET `permission_id` = (400 + `id`) WHERE `level_id` = 3;

-- 4.7 Sub-Menu Hub Pengaturan & Referensi (Depth 1, Parent ID 500)
INSERT INTO `auth_permissions` (`id`, `name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`) VALUES
(59, 'Pengaturan', 'settings', 'bi bi-sliders', 500, 1, 1, 0),
(61, 'Referensi', 'settings/referensi', 'bi bi-table', 500, 1, 2, 0)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), `url` = VALUES(`url`), `icon` = VALUES(`icon`), 
    `parent_id` = VALUES(`parent_id`), `is_show` = VALUES(`is_show`), 
    `is_order` = VALUES(`is_order`), `is_external` = VALUES(`is_external`);

-- 4.8 Sub-Layanan Pengaturan Hub (Depth 2, Parent ID 59 - Tepat 5 Layanan Sesuai Kartu Hub)
INSERT INTO `auth_permissions` (`id`, `name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`) VALUES
(99, 'Manajemen Pengguna & Pegawai', 'settings/users', 'bi bi-people', 59, 1, 1, 0),
(55, 'Manajemen Role & Struktur Menu', 'settings/roles', 'bi bi-shield-check', 59, 1, 2, 0),
(53, 'Manajemen Layanan & Hak Akses', 'settings/services', 'bi bi-layers', 59, 1, 3, 0),
(58, 'Pengaturan Sistem & Email SMTP', 'settings/system', 'bi bi-sliders', 59, 1, 4, 0),
(56, 'Log Audit & Aktivitas Sistem', 'settings/audit', 'bi bi-file-earmark-text', 59, 1, 5, 0)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), `url` = VALUES(`url`), `icon` = VALUES(`icon`), 
    `parent_id` = VALUES(`parent_id`), `is_show` = VALUES(`is_show`), 
    `is_order` = VALUES(`is_order`), `is_external` = VALUES(`is_external`);

-- ----------------------------------------------------------------------------------------
-- 5. SEEDING HAK AKSES RBAC: auth_role_permissions
-- ----------------------------------------------------------------------------------------

-- 5.1 Role 1: Administrator (ADM) -> Full CRUD (Akses ke Seluruh Menu)
INSERT INTO `auth_role_permissions` (`role_id`, `permission_id`, `is_create`, `is_read`, `is_update`, `is_delete`, `created_at`, `updated_at`)
SELECT 1, p.id, 1, 1, 1, 1, NOW(), NOW()
FROM `auth_permissions` p
WHERE p.is_show = 1
ON DUPLICATE KEY UPDATE 
    `is_create` = 1, `is_read` = 1, `is_update` = 1, `is_delete` = 1, `updated_at` = NOW();

-- 5.2 Role 2: User Pegawai (USR) -> Read Access ke Menu Utama, Eksternal, Tim Kerja & Layanan
-- (Setting & Referensi tidak diberikan akses / dicabut)
INSERT INTO `auth_role_permissions` (`role_id`, `permission_id`, `is_create`, `is_read`, `is_update`, `is_delete`, `created_at`, `updated_at`)
SELECT 2, p.id, 0, 1, 0, 0, NOW(), NOW()
FROM `auth_permissions` p
WHERE p.is_show = 1 
  AND p.id NOT IN (500, 59, 61, 99, 55, 53, 58, 56)
  AND (p.parent_id IS NULL OR p.parent_id NOT IN (500, 59, 61))
ON DUPLICATE KEY UPDATE 
    `is_create` = 0, `is_read` = 1, `is_update` = 0, `is_delete` = 0, `updated_at` = NOW();

-- Pastikan hak akses Pengaturan & Referensi tercabut untuk Role USR
DELETE FROM `auth_role_permissions` 
WHERE `role_id` = 2 
  AND `permission_id` IN (
      500, 59, 61, 99, 55, 53, 58, 56,
      62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 93
  );

-- ----------------------------------------------------------------------------------------
-- 6. NORMALISASI TAHAPAN PROGRES & SEEDING DATA MT (37 INSTANSI JABAR & BANTEN)
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `data_support_mt` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `step_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `percentage` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `txn_mt` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uid` varchar(50) NOT NULL DEFAULT uuid(),
  `action` varchar(8) NOT NULL DEFAULT 'create',
  `period` varchar(30) DEFAULT NULL,
  `period_date` date DEFAULT NULL,
  `instansi_id` bigint(20) NOT NULL DEFAULT 0,
  `rw_mt_id` int(11) NOT NULL,
  `created_by` varchar(30) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `instansi_id` (`instansi_id`) USING BTREE,
  KEY `idx_txn_mt_created` (`created_at`),
  KEY `idx_txn_mt_rw_mt_id` (`rw_mt_id`),
  KEY `idx_txn_mt_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `txn_mt_detail` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `mt_id` bigint(20) DEFAULT NULL,
  `activity_type` varchar(30) NOT NULL DEFAULT '0',
  `rw_mt_id` bigint(20) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `mt_id` (`mt_id`),
  KEY `rw_mt_id` (`rw_mt_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELETE FROM `data_support_mt`;
INSERT INTO `data_support_mt` (`id`, `step_name`, `description`, `percentage`, `sort_order`) VALUES
(1, 'Sudah Pengisian Jabatan', 'Instansi telah melakukan pengisian jabatan berbasis manajemen talenta', 100, 1),
(2, 'Sudah Mendapat rekomendasi', 'Instansi telah mendapatkan rekomendasi penerapan manajemen talenta', 75, 2),
(3, 'Sudah ekspose', 'Instansi telah melaksanakan ekspose kesiapan manajemen talenta', 50, 3),
(4, 'Siap Ekspose', 'Instansi telah siap untuk melaksanakan ekspose manajemen talenta', 25, 4);

ALTER TABLE `txn_mt_detail` MODIFY COLUMN `description` VARCHAR(255) NULL DEFAULT NULL;
DELETE FROM `txn_mt_detail`;
DELETE FROM `txn_mt`;

INSERT INTO `txn_mt` (`id`, `uid`, `action`, `period`, `period_date`, `instansi_id`, `rw_mt_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, UUID(), 'import', '2022', '2022-01-01', 6100, 1, 'system', NOW(), NOW()),
(2, UUID(), 'import', '2024', '2024-01-01', 6108, 1, 'system', NOW(), NOW()),
(3, UUID(), 'import', '2026', '2026-01-01', 6117, 1, 'system', NOW(), NOW()),
(4, UUID(), 'import', '2026', '2026-01-01', 6104, 2, 'system', NOW(), NOW()),
(5, UUID(), 'import', '2026', '2026-01-01', 6101, 2, 'system', NOW(), NOW()),
(6, UUID(), 'import', '2026', '2026-01-01', 6112, 2, 'system', NOW(), NOW()),
(7, UUID(), 'import', '2026', '2026-01-01', 6103, 2, 'system', NOW(), NOW()),
(8, UUID(), 'import', '2025', '2025-01-01', 6113, 1, 'system', NOW(), NOW()),
(9, UUID(), 'import', '2024', '2024-01-01', 6110, 1, 'system', NOW(), NOW()),
(10, UUID(), 'import', '2025', '2025-01-01', 6115, 1, 'system', NOW(), NOW()),
(11, UUID(), 'import', '2023', '2023-01-01', 6105, 1, 'system', NOW(), NOW()),
(12, UUID(), 'import', '2025', '2025-01-01', 6114, 1, 'system', NOW(), NOW()),
(13, UUID(), 'import', '2025', '2025-01-01', 6116, 1, 'system', NOW(), NOW()),
(14, UUID(), 'import', '2024', '2024-01-01', 6118, 1, 'system', NOW(), NOW()),
(15, UUID(), 'import', 'Proses', '2026-01-01', 6106, 3, 'system', NOW(), NOW()),
(16, UUID(), 'import', '2026', '2026-01-01', 6107, 2, 'system', NOW(), NOW()),
(17, UUID(), 'import', '2026', '2026-01-01', 6102, 2, 'system', NOW(), NOW()),
(18, UUID(), 'import', '2022', '2022-01-01', 6109, 1, 'system', NOW(), NOW()),
(19, UUID(), 'import', '2026', '2026-01-01', 6111, 1, 'system', NOW(), NOW()),
(20, UUID(), 'import', '2022', '2022-01-01', 6171, 1, 'system', NOW(), NOW()),
(21, UUID(), 'import', '2026', '2026-01-01', 6179, 2, 'system', NOW(), NOW()),
(22, UUID(), 'import', '2026', '2026-01-01', 6175, 2, 'system', NOW(), NOW()),
(23, UUID(), 'import', '2023', '2023-01-01', 6172, 1, 'system', NOW(), NOW()),
(24, UUID(), 'import', 'Proses', '2026-01-01', 6177, 3, 'system', NOW(), NOW()),
(25, UUID(), 'import', '2025', '2025-01-01', 6174, 1, 'system', NOW(), NOW()),
(26, UUID(), 'import', '2026', '2026-01-01', 6176, 1, 'system', NOW(), NOW()),
(27, UUID(), 'import', '2025', '2025-01-01', 6173, 1, 'system', NOW(), NOW()),
(28, UUID(), 'import', '2025', '2025-01-01', 6178, 1, 'system', NOW(), NOW()),
(29, UUID(), 'import', '2025', '2025-01-01', 6200, 1, 'system', NOW(), NOW()),
(30, UUID(), 'import', 'Proses', '2026-01-01', 6203, 3, 'system', NOW(), NOW()),
(31, UUID(), 'import', 'Proses', '2026-01-01', 6202, 3, 'system', NOW(), NOW()),
(32, UUID(), 'import', '2026', '2026-01-01', 6201, 2, 'system', NOW(), NOW()),
(33, UUID(), 'import', '2024', '2024-01-01', 6204, 1, 'system', NOW(), NOW()),
(34, UUID(), 'import', '2026', '2026-01-01', 6272, 1, 'system', NOW(), NOW()),
(35, UUID(), 'import', '2025', '2025-01-01', 6273, 1, 'system', NOW(), NOW()),
(36, UUID(), 'import', '2022', '2022-01-01', 6271, 1, 'system', NOW(), NOW()),
(37, UUID(), 'import', 'Proses', '2026-01-01', 6274, 3, 'system', NOW(), NOW());

INSERT INTO `txn_mt_detail` (`mt_id`, `activity_type`, `rw_mt_id`, `description`, `created_by`, `created_at`) VALUES
(1, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2022)', 'system', NOW()),
(2, 'import', 1, 'SIMATA BKN • Sudah Implementasi (Rekom: 2024)', 'system', NOW()),
(3, 'import', 1, 'SIMATA BKN • Sudah Implementasi (Rekom: 2026)', 'system', NOW()),
(4, 'import', 2, 'SIMATA BKN • Pemenuhan Data (Rekom: 2026)', 'system', NOW()),
(5, 'import', 2, 'Seleksi Terbuka • Pemenuhan Data (Rekom: 2026)', 'system', NOW()),
(6, 'import', 2, 'Seleksi Terbuka • Pemenuhan Data (Rekom: 2026)', 'system', NOW()),
(7, 'import', 2, 'Seleksi Terbuka • Pemenuhan Data (Rekom: 2026)', 'system', NOW()),
(8, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2025)', 'system', NOW()),
(9, 'import', 1, 'SIMATA BKN • Proses Implementasi (Rekom: 2024)', 'system', NOW()),
(10, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2025)', 'system', NOW()),
(11, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2023)', 'system', NOW()),
(12, 'import', 1, 'SIMATA BKN • Proses Implementasi (Rekom: 2025)', 'system', NOW()),
(13, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2025)', 'system', NOW()),
(14, 'import', 1, 'SIMATA BKN • Sudah Implementasi (Rekom: 2024)', 'system', NOW()),
(15, 'import', 3, 'Seleksi Terbuka • Pemenuhan Data (Rekom: Proses)', 'system', NOW()),
(16, 'import', 2, 'Seleksi Terbuka • Pemenuhan Data (Rekom: 2026)', 'system', NOW()),
(17, 'import', 2, 'SIMATA BKN • Proses Implementasi (Rekom: 2026)', 'system', NOW()),
(18, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2022)', 'system', NOW()),
(19, 'import', 1, 'SIMATA BKN • Sudah Implementasi (Rekom: 2026)', 'system', NOW()),
(20, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2022)', 'system', NOW()),
(21, 'import', 2, 'Seleksi Terbuka • Pemenuhan Data (Rekom: 2026)', 'system', NOW()),
(22, 'import', 2, 'Seleksi Terbuka • Pemenuhan Data (Rekom: 2026)', 'system', NOW()),
(23, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2023)', 'system', NOW()),
(24, 'import', 3, 'Seleksi Terbuka • Pemenuhan Data (Rekom: Proses)', 'system', NOW()),
(25, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2025)', 'system', NOW()),
(26, 'import', 1, 'SIMATA BKN • Sudah Implementasi (Rekom: 2026)', 'system', NOW()),
(27, 'import', 1, 'SIMATA BKN • Sudah Implementasi (Rekom: 2025)', 'system', NOW()),
(28, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2025)', 'system', NOW()),
(29, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2025)', 'system', NOW()),
(30, 'import', 3, 'Seleksi Terbuka • Pemenuhan Data (Rekom: Proses)', 'system', NOW()),
(31, 'import', 3, 'Seleksi Terbuka • Pemenuhan Data (Rekom: Proses)', 'system', NOW()),
(32, 'import', 2, 'SIMATA BKN • Proses Implementasi (Rekom: 2026)', 'system', NOW()),
(33, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2024)', 'system', NOW()),
(34, 'import', 1, 'SIMATA BKN • Pemenuhan Data (Rekom: 2026)', 'system', NOW()),
(35, 'import', 1, 'SIMATA BKN • Sudah Implementasi (Rekom: 2025)', 'system', NOW()),
(36, 'import', 1, 'Sistem Mandiri • Pemenuhan Data (Rekom: 2022)', 'system', NOW()),
(37, 'import', 3, 'Seleksi Terbuka • Pemenuhan Data (Rekom: Proses)', 'system', NOW());

-- ========================================================================================
-- SECTION 7: INJEKSI DATA LAYANAN 16 (PEMBINAAN DISIPLIN, BUDAYA KERJA & CITRA INSTITUSI)
-- Tab: ASISTENSI (Kategori ID 1) & KONSULTASI / PENDAMPINGAN (Kategori ID 2)
-- Sesuai data riil LINK_KEGIATAN_DISIPLIN.xlsx (47 Kegiatan & Relasi Tim Pegawai Pelaksana)
-- ========================================================================================
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `txn_pembinaan_disiplin_budaya_citra_pegawai`;
DELETE FROM `txn_pembinaan_disiplin_budaya_citra`;
ALTER TABLE `txn_pembinaan_disiplin_budaya_citra` AUTO_INCREMENT = 1;
ALTER TABLE `txn_pembinaan_disiplin_budaya_citra_pegawai` AUTO_INCREMENT = 1;

INSERT INTO `txn_pembinaan_disiplin_budaya_citra` (`id`, `layanan_id`, `instansi_id`, `kategori_id`, `period_year`, `period_date`, `source_konsultasi`, `tempat_kegiatan`, `judul_kegiatan`, `no_surat_kegiatan`, `catatan`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 16, '6117', 1, 2026, '2026-02-19', NULL, 'Pemerintah Kab. Bandung Barat', 'Webinar Pepeling ASN Seri 16. ASN: Antara Kehidupan Pribadi dan Tanggung Jawab Profesi', '-', 'Link Laporan: https://1drv.ms/b/c/7bd3b17c0c8bc490/IQA63Eqrc46KS6da4tYvcJX9AS1EtbhtlFDtF7ir2mUbb7E?e=wOEvhb', 'system', 'system', NOW(), NOW()),
(2, 16, '6204', 1, 2026, '2026-02-26', NULL, 'Pemerintah Kab. Tangerang', 'PEMBINAAN PENERAPAN DISIPLIN PPPK PENUH WAKTU DAN PARUH WAKTU DI LINGKUNGAN DINAS LINGKUNGAN HIDUP DAN KEBERSIHAN', '-', 'Link Laporan: https://drive.google.com/drive/folders/1uXEwup9SqtMgMG1t-c9zkp7TTTqZ3DIV', 'system', 'system', NOW(), NOW()),
(3, 16, '3021', 1, 2026, '2026-03-31', NULL, 'Kementerian Pekerjaan Umum dan Perumahan Rakyat', 'Disiplin ASN', '-', 'Link Laporan: https://mega.nz/file/rxpgEZKJ#v_p2ALwYe-UJ7ou7_RMz4CNF8Z_APqoTqoHgpXfq2DA', 'system', 'system', NOW(), NOW()),
(4, 16, '6272', 1, 2026, '2026-04-17', NULL, 'Pemerintah Kota Cilegon', 'Disiplin PNS', '-', 'Link Laporan: https://drive.google.com/file/d/1WplDmiwlhhqdpi_JpXKc4knbb_xTlG1l/view?usp=drive_link', 'system', 'system', NOW(), NOW()),
(5, 16, '6102', 1, 2026, '2026-04-17', NULL, 'Pemerintah Kab. Sukabumi', 'Menjadi ASN Profesional: Dari Hak dan Kewajiban Hingga Disiplin Kerja', '-', 'Link Laporan: https://1drv.ms/b/c/7bd3b17c0c8bc490/IQAhj_iAMXLWSZQlG8mkNSx-AdtCK4BVS9pJVa6uIPkMWHk?e=f7XQBK', 'system', 'system', NOW(), NOW()),
(6, 16, '6204', 1, 2026, '2026-04-27', NULL, 'Pemerintah Kab. Tangerang', 'FGD Penegakan disiplin dan permasalahan kepegawaian', '-', 'Link Laporan: https://drive.google.com/drive/folders/1uXEwup9SqtMgMG1t-c9zkp7TTTqZ3DIV', 'system', 'system', NOW(), NOW()),
(7, 16, '6105', 2, 2026, '2026-01-15', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kab. Karawang | Dokumentasi: https://drive.google.com/drive/folders/1Yvp5bUgDsQOzu8-nOWUiRu-rbWw_dm_W', 'system', 'system', NOW(), NOW()),
(8, 16, '6104', 2, 2026, '2026-01-23', 'WA KANREG', 'Layanan WA KANREG Kanreg III BKN', 'IJIN MENJADI PENGURUSAN BADAN HUKUM', '-', 'Pemohon / Asal: MARIO (ASN KAB. BEKASI) | Dokumentasi: https://drive.google.com/drive/folders/1Eoi3ovPzkK0lpwjwxb9NCgnSeYjM0Cm_', 'system', 'system', NOW(), NOW()),
(9, 16, '6113', 2, 2026, '2026-01-23', 'HELPDESK BKN', 'Layanan HELPDESK BKN Kanreg III BKN', 'DISIPLIN KARENA KETERLAMBATAN PENGISIAN SKP', '-', 'Pemohon / Asal: NIA NURHAYATI (KAB. CIREBON) | Dokumentasi: 16 JANUARI-15 FEBRUARI', 'system', 'system', NOW(), NOW()),
(10, 16, '6178', 2, 2026, '2026-01-27', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'DISIPLIN ASN', '-', 'Pemohon / Asal: Naning Nurnangningsih (ASN KOTA TASIKMALAYA) | Dokumentasi: https://drive.google.com/file/d/1reGTatM9Ohyt0aa0Q-WwPjv9FyiJmvyU/view?usp=drive_link', 'system', 'system', NOW(), NOW()),
(11, 16, '6204', 2, 2026, '2026-01-29', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: BKPSDM Kab. Tangerang | Dokumentasi: https://drive.google.com/drive/folders/1r2VigFaWoq7pXi75k3rObaX8jDGfbf_t', 'system', 'system', NOW(), NOW()),
(12, 16, '6174', 2, 2026, '2026-01-29', 'HELPDESK BKN', 'Layanan HELPDESK BKN Kanreg III BKN', 'DISIPLIN ASN', '-', 'Pemohon / Asal: IRMA RAHMAWATI (ASN KOTA CIREBON) | Dokumentasi: https://drive.google.com/drive/folders/1Eoi3ovPzkK0lpwjwxb9NCgnSeYjM0Cm_', 'system', 'system', NOW(), NOW()),
(13, 16, '6114', 2, 2026, '2026-02-04', 'WA PRIBADI', 'Layanan WA PRIBADI Kanreg III BKN', 'DISIPLIN ASN', '-', 'Pemohon / Asal: YUDHA BKPSDM KAB. KUNINGAN | Dokumentasi: https://drive.google.com/drive/folders/1Eoi3ovPzkK0lpwjwxb9NCgnSeYjM0Cm_', 'system', 'system', NOW(), NOW()),
(14, 16, '6105', 2, 2026, '2026-02-05', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Pemberhentian ASN dan Disiplin ASN', '-', 'Pemohon / Asal: Kab. Karawang | Dokumentasi: https://drive.google.com/drive/folders/1TRFYxq6XqmStbn5QzvyEOKE-6f8yhkHV', 'system', 'system', NOW(), NOW()),
(15, 16, '6177', 2, 2026, '2026-02-05', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kota Cimahi | Dokumentasi: https://drive.google.com/drive/folders/1nREWkiTuEVrRcYqdT3ueflkKDPaQtt-y', 'system', 'system', NOW(), NOW()),
(16, 16, '6113', 2, 2026, '2026-02-05', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Pemberhentian ASN', '-', 'Pemohon / Asal: Tarsudi (ASN Kab. Cirebon) | Dokumentasi: https://drive.google.com/drive/folders/1BNX6PvrhdLsvYS4G-TqAh77DyWtaH7Br', 'system', 'system', NOW(), NOW()),
(17, 16, '6108', 2, 2026, '2026-02-10', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Budaya Kerja dan Citra Institusi', '-', 'Pemohon / Asal: BKPSDM Kab. Bandung | Dokumentasi: https://drive.google.com/drive/folders/1Eoi3ovPzkK0lpwjwxb9NCgnSeYjM0Cm_', 'system', 'system', NOW(), NOW()),
(18, 16, '6102', 2, 2026, '2026-02-10', 'WA', 'Layanan WA Kanreg III BKN', 'DISIPLIN ASN', '-', 'Pemohon / Asal: BKPSDM Kab. Sukabumi | Dokumentasi: https://drive.google.com/drive/folders/1Eoi3ovPzkK0lpwjwxb9NCgnSeYjM0Cm_', 'system', 'system', NOW(), NOW()),
(19, 16, '6201', 2, 2026, '2026-02-10', 'WA', 'Layanan WA Kanreg III BKN', 'DISIPLIN ASN', '-', 'Pemohon / Asal: BKPSDM Kab. Serang | Dokumentasi: https://drive.google.com/drive/folders/1Eoi3ovPzkK0lpwjwxb9NCgnSeYjM0Cm_', 'system', 'system', NOW(), NOW()),
(20, 16, '6117', 2, 2026, '2026-02-19', 'ASISTENSI', 'Layanan Asistensi Kanreg III BKN', 'Asistensi disiplin terkait “Antara Kehidupan Pribadi dan tanggung jawab profesi', '-', 'Pemohon / Asal: BKPSDM Bandung Barat | Dokumentasi: https://drive.google.com/drive/folders/1q7uAGC13skSp2EtxDrj-W45zcfxiHPRG?usp=drive_link', 'system', 'system', NOW(), NOW()),
(21, 16, '3024', 2, 2026, '2026-02-20', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kementerian Kependudukan dan Pembangunan Keluarga / BKKBN Kantor Perwakilan Jawa Barat | Dokumentasi: https://1drv.ms/i/c/7bd3b17c0c8bc490/IQCeIQ3NKaoxQaj7v9tXaaY8AYZs7_PdxRXFeABLGnrJ6XA?e=Qc8id5', 'system', 'system', NOW(), NOW()),
(22, 16, '6109', 2, 2026, '2026-02-20', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Pidana', '-', 'Pemohon / Asal: BKPSDM Kab. Sumedang | Dokumentasi: https://drive.google.com/drive/folders/1xBODg6hToiLMTpavuS5oL2LmQCPoRtQF', 'system', 'system', NOW(), NOW()),
(23, 16, '6118', 2, 2026, '2026-02-24', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Acara TUN', '-', 'Pemohon / Asal: Kab. Pangandaran | Dokumentasi: https://drive.google.com/drive/folders/1xBODg6hToiLMTpavuS5oL2LmQCPoRtQF', 'system', 'system', NOW(), NOW()),
(24, 16, '6105', 2, 2026, '2026-02-24', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: BKPSDM Kab. Karawang | Dokumentasi: https://1drv.ms/i/c/7bd3b17c0c8bc490/IQCMZVaOpVTpTaJtqe_iX5vJARRWiuQXeXbvsWA73-Cl7Jw?e=D0gZYn', 'system', 'system', NOW(), NOW()),
(25, 16, '4024', 2, 2026, '2026-03-26', 'HELPDESK BKN', 'Layanan HELPDESK BKN Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kementerian Pertanahan | Dokumentasi: https://drive.google.com/drive/folders/1tG-jzPQjYQ2q4nLQXiIzG1pci0KMv51M', 'system', 'system', NOW(), NOW()),
(26, 16, '6113', 2, 2026, '2026-04-02', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kab. Cirebon | Dokumentasi: https://1drv.ms/f/c/7bd3b17c0c8bc490/IgCHq2xRK0-HQLqXaB0Id2f7AYJP7LKXIhEVZBo5R-f3wh4?e=xj8ku4', 'system', 'system', NOW(), NOW()),
(27, 16, '6201', 2, 2026, '2026-04-08', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kab. Serang | Dokumentasi: https://1drv.ms/i/c/7bd3b17c0c8bc490/IQB3KXHsvB9ISZfW0IWPpPx4AVNwdQu9iv-DFavfMTBxBFI?e=j3DdXp', 'system', 'system', NOW(), NOW()),
(28, 16, '6105', 2, 2026, '2026-04-08', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kab. Karawang | Dokumentasi: https://1drv.ms/i/c/7bd3b17c0c8bc490/IQDEx6t07AI6QpduGYPPgCUjAczf83_-NcWvwkdQXnTDAgk?e=LVoaes', 'system', 'system', NOW(), NOW()),
(29, 16, '6112', 2, 2026, '2026-04-10', 'WA', 'Layanan WA Kanreg III BKN', 'Pidana', '-', 'Pemohon / Asal: Kab. Ciamis | Dokumentasi: https://drive.google.com/drive/folders/1tG-jzPQjYQ2q4nLQXiIzG1pci0KMv51M', 'system', 'system', NOW(), NOW()),
(30, 16, '6114', 2, 2026, '2026-04-10', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kabupaten Kuningan | Dokumentasi: https://drive.google.com/drive/folders/1tG-jzPQjYQ2q4nLQXiIzG1pci0KMv51M', 'system', 'system', NOW(), NOW()),
(31, 16, '6112', 2, 2026, '2026-04-16', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kab. Ciamis | Dokumentasi: https://drive.google.com/drive/folders/18EAzDgXyYO_7V6vb8AJNEm3PhAIze7kf', 'system', 'system', NOW(), NOW()),
(32, 16, '6105', 2, 2026, '2026-04-21', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Penegakan Disiplin', '-', 'Pemohon / Asal: Kab. Karawang | Dokumentasi: https://drive.google.com/drive/folders/18EAzDgXyYO_7V6vb8AJNEm3PhAIze7kf', 'system', 'system', NOW(), NOW()),
(33, 16, '6114', 2, 2026, '2026-04-24', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin ASN', '-', 'Pemohon / Asal: Kab. Kuningan | Dokumentasi: https://drive.google.com/drive/folders/18EAzDgXyYO_7V6vb8AJNEm3PhAIze7kf', 'system', 'system', NOW(), NOW()),
(34, 16, '6174', 2, 2026, '2026-05-08', 'WA', 'Layanan WA Kanreg III BKN', 'Penegakan Disiplin', '-', 'Pemohon / Asal: Kota Cirebon | Dokumentasi: https://drive.google.com/drive/folders/18EAzDgXyYO_7V6vb8AJNEm3PhAIze7kf', 'system', 'system', NOW(), NOW()),
(35, 16, '6114', 2, 2026, '2026-05-08', 'WA', 'Layanan WA Kanreg III BKN', 'Penegakan Disiplin', '-', 'Pemohon / Asal: Kab. Kuningan | Dokumentasi: https://drive.google.com/drive/folders/18EAzDgXyYO_7V6vb8AJNEm3PhAIze7kf', 'system', 'system', NOW(), NOW()),
(36, 16, '6272', 2, 2026, '2026-05-13', 'WA', 'Layanan WA Kanreg III BKN', 'Izin Perkawinan dan Perceraian bagi PPPK', '-', 'Pemohon / Asal: Kota. Cilegon | Dokumentasi: https://drive.google.com/file/d/1AeMW0OCT9ap-Kr854h3ylvr7q2le1bQs/view?usp=drive_link', 'system', 'system', NOW(), NOW()),
(37, 16, '6105', 2, 2026, '2026-05-19', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Disiplin PNS', '-', 'Pemohon / Asal: Kab. Karawang | Dokumentasi: https://drive.google.com/file/d/1liuEEFMP376ovL02r2Bg7ZKxFnqxaaPj/view?usp=drive_link', 'system', 'system', NOW(), NOW()),
(38, 16, '6171', 2, 2026, '2026-06-04', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Disiplin PNS', '-', 'Pemohon / Asal: ASN Kota Bandung | Dokumentasi: https://drive.google.com/drive/folders/1bjNlFdIemjB00DaMeE9FJWT7LDRZND6b', 'system', 'system', NOW(), NOW()),
(39, 16, '6115', 2, 2026, '2026-06-09', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Penjatuhan Hukdis melalui I-Dis dan Perceraian PNS', '-', 'Pemohon / Asal: Kab. Indramayu | Dokumentasi: https://drive.google.com/file/d/1QxCQIRQ5EW1sHU4a_gxY06g6HQ4gdmK4/view?usp=drive_link', 'system', 'system', NOW(), NOW()),
(40, 16, '6177', 2, 2026, '2026-06-09', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'APS PNS dan Penegakan Disiplin', '-', 'Pemohon / Asal: Kota Cimahi | Dokumentasi: https://drive.google.com/drive/folders/1-lsHcg7O6Bw2ZEB9RK869ckPtl6P4_Bk?usp=drive_link', 'system', 'system', NOW(), NOW()),
(41, 16, '4062', 2, 2026, '2026-06-10', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'perkawinan dan perceraian', '-', 'Pemohon / Asal: Bawaslu Majalengka | Dokumentasi: https://drive.google.com/drive/folders/1bjNlFdIemjB00DaMeE9FJWT7LDRZND6b', 'system', 'system', NOW(), NOW()),
(42, 16, '6172', 2, 2026, '2026-06-30', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'disiplin pns', '-', 'Pemohon / Asal: Kota Bogor | Dokumentasi: https://drive.google.com/drive/folders/13UQ3Q_8D-VSu3sytvyuHatnUo_oCGJdd', 'system', 'system', NOW(), NOW()),
(43, 16, '4007', 2, 2026, '2026-07-09', 'HELPDESK BKN', 'Layanan HELPDESK BKN Kanreg III BKN', 'Cuti dan disiplin', '-', 'Pemohon / Asal: Mahkamah Agung | Dokumentasi: https://drive.google.com/drive/folders/13UQ3Q_8D-VSu3sytvyuHatnUo_oCGJdd', 'system', 'system', NOW(), NOW()),
(44, 16, '6112', 2, 2026, '2026-07-10', 'WA', 'Layanan WA Kanreg III BKN', 'DISIPLIN DAN PIDANA', '-', 'Pemohon / Asal: BKPSDM KAB. CIAMIS | Dokumentasi: https://drive.google.com/drive/folders/13UQ3Q_8D-VSu3sytvyuHatnUo_oCGJdd', 'system', 'system', NOW(), NOW()),
(45, 16, '6273', 2, 2026, '2026-07-28', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Disiplin', '-', 'Pemohon / Asal: Kota Serang | Dokumentasi: https://drive.google.com/drive/folders/154BQWVLMZqYCpWXCNsU6xgtDwkXo-DWz', 'system', 'system', NOW(), NOW()),
(46, 16, '6114', 2, 2026, '2026-10-14', 'WA', 'Layanan WA Kanreg III BKN', 'Disiplin', '-', 'Pemohon / Asal: Kab. Kuningan', 'system', 'system', NOW(), NOW()),
(47, 16, '6106', 2, 2026, '2026-10-29', 'PTSP', 'Layanan PTSP Kanreg III BKN', 'Disiplin', '-', 'Pemohon / Asal: Kab. Purwakarta', 'system', 'system', NOW(), NOW());

INSERT INTO `txn_pembinaan_disiplin_budaya_citra_pegawai` (`txn_id`, `pegawai_id`, `pegawai_nip`, `pegawai_nama`, `created_at`) VALUES
(1, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(2, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(2, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(3, 110, '199606132024211009', 'SATIA GUMELAR, S.I.P.', NOW()),
(4, 109, '199410062024212025', 'ALIEFA OKTAVIANA, S.E.', NOW()),
(5, 114, '198406132010121001', 'BINA DANNY RAMDHAN GANI, SE., M.H.', NOW()),
(5, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(6, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(7, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(7, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(8, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(9, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(10, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(10, 170, '200012132025062006', 'PURRY INTAN PURBANIE, S.H.', NOW()),
(11, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(11, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(12, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(13, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(14, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(14, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(15, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(16, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(17, 102, '197411061999022001', 'RIANTY NOVIASARI, S.Kom.', NOW()),
(17, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(17, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(18, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(19, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(20, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(20, 170, '200012132025062006', 'PURRY INTAN PURBANIE, S.H.', NOW()),
(21, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(22, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(22, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(23, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(23, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(23, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(23, 110, '199606132024211009', 'SATIA GUMELAR, S.I.P.', NOW()),
(23, 109, '199410062024212025', 'ALIEFA OKTAVIANA, S.E.', NOW()),
(24, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(25, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(26, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(27, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(28, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(29, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(30, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(31, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(32, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(32, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(33, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(34, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(35, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(36, 109, '199410062024212025', 'ALIEFA OKTAVIANA, S.E.', NOW()),
(37, 109, '199410062024212025', 'ALIEFA OKTAVIANA, S.E.', NOW()),
(37, 110, '199606132024211009', 'SATIA GUMELAR, S.I.P.', NOW()),
(38, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(38, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(38, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(39, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(39, 170, '200012132025062006', 'PURRY INTAN PURBANIE, S.H.', NOW()),
(40, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(40, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(40, 105, '199206112019021003', 'SUGHRON JAZILA, S.Sos.', NOW()),
(41, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(41, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(42, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(42, 110, '199606132024211009', 'SATIA GUMELAR, S.I.P.', NOW()),
(43, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(44, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(45, 118, '199203112018011003', 'MOHAMAD NUR RAMANDHANU NUGROHO, S.H', NOW()),
(45, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(45, 109, '199410062024212025', 'ALIEFA OKTAVIANA, S.E.', NOW()),
(45, 110, '199606132024211009', 'SATIA GUMELAR, S.I.P.', NOW()),
(46, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW()),
(47, 104, '198407022018011001', 'DEN YANK ZARTHYN, S.H.', NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================================================
-- END OF SCRIPT - MIGRATION COMPLETED SUCCESSFULLY
-- ========================================================================================
