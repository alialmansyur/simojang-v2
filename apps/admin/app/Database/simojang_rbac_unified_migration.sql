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

-- 1.4 Tabel Petugas Tim Kerja CAT Lapangan
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

-- 1.5 Tabel Pemetaan Instansi pada Jadwal CAT
CREATE TABLE IF NOT EXISTS `txn_cat_jadwal_instansi` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `jadwal_id` bigint(20) unsigned NOT NULL,
  `instansi_id` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cat_jadwal_instansi` (`jadwal_id`,`instansi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.6 Penyesuaian Kolom Status Batal pada Jadwal CAT
ALTER TABLE `txn_cat_jadwal` MODIFY COLUMN `status` ENUM('draft','aktif','selesai','batal') NOT NULL DEFAULT 'aktif';

-- 1.7 Penyesuaian Dokumen PNBP CAT (Upload & Personel Eksternal)
ALTER TABLE `txn_pnbp_documents` ADD COLUMN IF NOT EXISTS `source_mode` ENUM('builder','upload') NOT NULL DEFAULT 'builder' AFTER `status`;
ALTER TABLE `txn_pnbp_documents` ADD COLUMN IF NOT EXISTS `original_filename` VARCHAR(255) NULL DEFAULT NULL AFTER `pdf_file_path`;
ALTER TABLE `txn_pnbp_doc_personel` ADD COLUMN IF NOT EXISTS `is_external` TINYINT(1) NOT NULL DEFAULT 0 AFTER `nip`;
ALTER TABLE `txn_pnbp_doc_personel` ADD COLUMN IF NOT EXISTS `instansi_asal` VARCHAR(255) NULL DEFAULT NULL AFTER `nama`;

-- 1.8 Penyesuaian Kolom Digital Document Management System (DMS)
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
TRUNCATE TABLE `data_support_mt`;
INSERT INTO `data_support_mt` (`id`, `step_name`, `description`, `percentage`, `sort_order`) VALUES
(1, 'Sudah Pengisian Jabatan', 'Instansi telah melakukan pengisian jabatan berbasis manajemen talenta', 100, 1),
(2, 'Sudah Mendapat rekomendasi', 'Instansi telah mendapatkan rekomendasi penerapan manajemen talenta', 75, 2),
(3, 'Sudah ekspose', 'Instansi telah melaksanakan ekspose kesiapan manajemen talenta', 50, 3),
(4, 'Siap Ekspose', 'Instansi telah siap untuk melaksanakan ekspose manajemen talenta', 25, 4);

ALTER TABLE `txn_mt_detail` MODIFY COLUMN `description` VARCHAR(255) NULL DEFAULT NULL;
DELETE FROM `txn_mt_detail`;
DELETE FROM `txn_mt`;

INSERT INTO `txn_mt` (`id`, `uid`, `action`, `period`, `period_date`, `instansi_id`, `rw_mt_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, UUID(), 'import', '2026-01', '2026-01-15', 6100, 1, 'system', NOW(), NOW()),
(2, UUID(), 'import', '2026-01', '2026-01-15', 6108, 1, 'system', NOW(), NOW()),
(3, UUID(), 'import', '2026-01', '2026-01-15', 6117, 1, 'system', NOW(), NOW()),
(4, UUID(), 'import', '2026-01', '2026-01-15', 6104, 2, 'system', NOW(), NOW()),
(5, UUID(), 'import', '2026-01', '2026-01-15', 6101, 2, 'system', NOW(), NOW()),
(6, UUID(), 'import', '2026-01', '2026-01-15', 6112, 2, 'system', NOW(), NOW()),
(7, UUID(), 'import', '2026-01', '2026-01-15', 6103, 2, 'system', NOW(), NOW()),
(8, UUID(), 'import', '2026-01', '2026-01-15', 6113, 1, 'system', NOW(), NOW()),
(9, UUID(), 'import', '2026-01', '2026-01-15', 6110, 1, 'system', NOW(), NOW()),
(10, UUID(), 'import', '2026-01', '2026-01-15', 6115, 1, 'system', NOW(), NOW()),
(11, UUID(), 'import', '2026-01', '2026-01-15', 6105, 1, 'system', NOW(), NOW()),
(12, UUID(), 'import', '2026-01', '2026-01-15', 6114, 1, 'system', NOW(), NOW()),
(13, UUID(), 'import', '2026-01', '2026-01-15', 6116, 1, 'system', NOW(), NOW()),
(14, UUID(), 'import', '2026-01', '2026-01-15', 6118, 1, 'system', NOW(), NOW()),
(15, UUID(), 'import', '2026-01', '2026-01-15', 6106, 3, 'system', NOW(), NOW()),
(16, UUID(), 'import', '2026-01', '2026-01-15', 6107, 2, 'system', NOW(), NOW()),
(17, UUID(), 'import', '2026-01', '2026-01-15', 6102, 2, 'system', NOW(), NOW()),
(18, UUID(), 'import', '2026-01', '2026-01-15', 6109, 1, 'system', NOW(), NOW()),
(19, UUID(), 'import', '2026-01', '2026-01-15', 6111, 1, 'system', NOW(), NOW()),
(20, UUID(), 'import', '2026-01', '2026-01-15', 6171, 1, 'system', NOW(), NOW()),
(21, UUID(), 'import', '2026-01', '2026-01-15', 6179, 2, 'system', NOW(), NOW()),
(22, UUID(), 'import', '2026-01', '2026-01-15', 6175, 2, 'system', NOW(), NOW()),
(23, UUID(), 'import', '2026-01', '2026-01-15', 6172, 1, 'system', NOW(), NOW()),
(24, UUID(), 'import', '2026-01', '2026-01-15', 6177, 3, 'system', NOW(), NOW()),
(25, UUID(), 'import', '2026-01', '2026-01-15', 6174, 1, 'system', NOW(), NOW()),
(26, UUID(), 'import', '2026-01', '2026-01-15', 6176, 1, 'system', NOW(), NOW()),
(27, UUID(), 'import', '2026-01', '2026-01-15', 6173, 1, 'system', NOW(), NOW()),
(28, UUID(), 'import', '2026-01', '2026-01-15', 6178, 1, 'system', NOW(), NOW()),
(29, UUID(), 'import', '2026-01', '2026-01-15', 6200, 1, 'system', NOW(), NOW()),
(30, UUID(), 'import', '2026-01', '2026-01-15', 6203, 3, 'system', NOW(), NOW()),
(31, UUID(), 'import', '2026-01', '2026-01-15', 6202, 3, 'system', NOW(), NOW()),
(32, UUID(), 'import', '2026-01', '2026-01-15', 6201, 2, 'system', NOW(), NOW()),
(33, UUID(), 'import', '2026-01', '2026-01-15', 6204, 1, 'system', NOW(), NOW()),
(34, UUID(), 'import', '2026-01', '2026-01-15', 6272, 1, 'system', NOW(), NOW()),
(35, UUID(), 'import', '2026-01', '2026-01-15', 6273, 1, 'system', NOW(), NOW()),
(36, UUID(), 'import', '2026-01', '2026-01-15', 6271, 1, 'system', NOW(), NOW()),
(37, UUID(), 'import', '2026-01', '2026-01-15', 6274, 3, 'system', NOW(), NOW());

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

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================================================
-- END OF SCRIPT - MIGRATION COMPLETED SUCCESSFULLY
-- ========================================================================================
