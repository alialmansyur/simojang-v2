-- ========================================================================================
-- SIMOJANG V2 - UNIFIED RBAC & SERVICE HIERARCHY MIGRATION SCRIPT
-- Single Source of Truth (SSOT) Navigasi & Hak Akses Berbasis Role (MariaDB / MySQL)
-- ========================================================================================
-- Script ini bersifat Idempotent (aman dijalankan berulang tanpa data duplikat).
-- ========================================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------------------
-- 1. ALTER TABLE: Penambahan Kolom Hierarki pada Tabel Layanan & Tim Kerja
-- ----------------------------------------------------------------------------------------

-- data_timkerja
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'data_timkerja' AND column_name = 'permission_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `data_timkerja` ADD COLUMN `permission_id` BIGINT UNSIGNED NULL DEFAULT NULL AFTER `is_show`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- data_timkerja_layanan: parent_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'data_timkerja_layanan' AND column_name = 'parent_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `data_timkerja_layanan` ADD COLUMN `parent_id` BIGINT(20) NULL DEFAULT NULL AFTER `timkerja_id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- data_timkerja_layanan: is_subservice
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'data_timkerja_layanan' AND column_name = 'is_subservice');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `data_timkerja_layanan` ADD COLUMN `is_subservice` TINYINT(1) NOT NULL DEFAULT 0 AFTER `parent_id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- data_timkerja_layanan: level_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'data_timkerja_layanan' AND column_name = 'level_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `data_timkerja_layanan` ADD COLUMN `level_id` TINYINT(4) NOT NULL DEFAULT 2 AFTER `parent_id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- data_timkerja_layanan: permission_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'data_timkerja_layanan' AND column_name = 'permission_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `data_timkerja_layanan` ADD COLUMN `permission_id` BIGINT UNSIGNED NULL DEFAULT NULL AFTER `level_id`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------------------------------------
-- 2. PEMBERSIHAN DATA: Bersihkan data eksternal (level 4) dari data_timkerja_layanan
-- ----------------------------------------------------------------------------------------
DELETE FROM `data_timkerja_layanan` WHERE `level_id` = 4 OR `id` IN (53, 54, 55, 56, 57, 58);

-- Update level_id & is_subservice untuk sub-layanan hub di data_timkerja_layanan
UPDATE `data_timkerja_layanan` SET `level_id` = 2, `is_subservice` = 0 WHERE `parent_id` IS NULL;
UPDATE `data_timkerja_layanan` SET `level_id` = 3, `is_subservice` = 1 WHERE `parent_id` IS NOT NULL;

-- ----------------------------------------------------------------------------------------
-- 3. MASTER MENU SISTEM: auth_permissions
-- ----------------------------------------------------------------------------------------

-- 3.1 Nonaktifkan menu legacy lama (is_show = 0)
UPDATE `auth_permissions` 
SET `is_show` = 0 
WHERE `id` IN (7, 45, 47, 48, 49, 50, 51, 52, 60, 96, 97);

-- 3.2 Menu Utama Root (Depth 0)
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

-- 3.3 Layanan Eksternal (Depth 1, Parent ID 100)
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

-- 3.4 6 Tim Kerja Kanreg III (Depth 1, Parent ID 57)
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

-- 3.5 Layanan Tim Kerja (Depth 2, Parent ID 201-206)
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

-- 3.6 Sub-Layanan Hub (Depth 3, Parent ID 328, 329, 335)
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

-- 3.7 Sub-Menu Hub Pengaturan & Referensi (Depth 1, Parent ID 500)
INSERT INTO `auth_permissions` (`id`, `name`, `url`, `icon`, `parent_id`, `is_show`, `is_order`, `is_external`) VALUES
(59, 'Pengaturan', 'settings', 'bi bi-sliders', 500, 1, 1, 0),
(61, 'Referensi', 'settings/referensi', 'bi bi-table', 500, 1, 2, 0)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), `url` = VALUES(`url`), `icon` = VALUES(`icon`), 
    `parent_id` = VALUES(`parent_id`), `is_show` = VALUES(`is_show`), 
    `is_order` = VALUES(`is_order`), `is_external` = VALUES(`is_external`);

-- 3.8 Sub-Layanan Pengaturan Hub (Depth 2, Parent ID 59 - Tepat 5 Layanan Sesuai Kartu Hub)
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
-- 4. SEEDING HAK AKSES RBAC: auth_role_permissions
-- ----------------------------------------------------------------------------------------

-- 4.1 Role 1: Administrator (ADM) -> Full CRUD (Akses ke Seluruh Menu)
INSERT INTO `auth_role_permissions` (`role_id`, `permission_id`, `is_create`, `is_read`, `is_update`, `is_delete`, `created_at`, `updated_at`)
SELECT 1, p.id, 1, 1, 1, 1, NOW(), NOW()
FROM `auth_permissions` p
WHERE p.is_show = 1
ON DUPLICATE KEY UPDATE 
    `is_create` = 1, `is_read` = 1, `is_update` = 1, `is_delete` = 1, `updated_at` = NOW();

-- 4.2 Role 2: User Pegawai (USR) -> Read Access ke Menu Utama, Eksternal, Tim Kerja & Layanan
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

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================================================
-- END OF SCRIPT - MIGRATION COMPLETED SUCCESSFULLY
-- ========================================================================================
