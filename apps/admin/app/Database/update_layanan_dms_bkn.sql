-- ========================================================
-- MASTER UPDATE SQL: LAYANAN DIGITALISASI ARSIP (DMS)
-- SIMOJANG BKN KANTOR REGIONAL III BANDUNG
-- ========================================================

-- 1. STRUKTUR KOLOM BARU (DDL)
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

-- 2. OPTIMASI INDEKS (PERFORMA QUERY SNAPSHOT & FILTER)
CREATE INDEX IF NOT EXISTS `idx_dms_instansi_latest` ON `txn_dms_entry` (`instansi_id`, `id`);
CREATE INDEX IF NOT EXISTS `idx_dms_skor_ranking` ON `txn_dms_entry` (`skor_arsip`);

-- 3. SEEDING / INSERT 37 DATA RESMI CAPAIAN DMS (BKN PUSAT)
-- Hapus entri grup official lama agar aman/idempoten saat di-run berulang kali
DELETE FROM `txn_dms_entry` WHERE `scema_group` = 'dms_bkn_official';

INSERT INTO `txn_dms_entry` (
  `action`, `scema_group`, `instansi_id`, `period`, `period_date`, `period_start_date`, `period_end_date`, `jenis`, `total`,
  `skor_arsip`, `keterangan`, `total_pns`, `status_cpns`, `status_pns`,
  `jumlah_sangat_lengkap`, `jumlah_lengkap`, `jumlah_cukup_lengkap`, `jumlah_kurang_lengkap`, `created_by`
) VALUES
('upload', 'dms_bkn_official', 6200, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 7843, 100.00, 'Sangat Lengkap', 7843, 7, 7836, 7830, 9, 4, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6273, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 3663, 99.80, 'Sangat Lengkap', 3663, 1, 3662, 3657, 4, 2, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6117, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 4509, 99.40, 'Sangat Lengkap', 4509, 0, 4509, 4434, 75, 0, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6174, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 3488, 97.80, 'Sangat Lengkap', 3488, 1, 3487, 3348, 139, 1, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6271, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 5723, 97.30, 'Sangat Lengkap', 5723, 7, 5716, 5652, 68, 3, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6204, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 8711, 97.00, 'Sangat Lengkap', 8711, 8, 8703, 8055, 656, 0, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6116, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 7193, 96.40, 'Sangat Lengkap', 7193, 3, 7190, 7061, 131, 1, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6177, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 3155, 94.60, 'Sangat Lengkap', 3155, 1, 3154, 2512, 636, 7, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6107, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 7377, 94.60, 'Sangat Lengkap', 7377, 7, 7370, 5932, 1382, 63, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6112, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 5189, 94.30, 'Sangat Lengkap', 5189, 1, 5188, 4559, 572, 55, 3, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6201, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 6963, 93.90, 'Sangat Lengkap', 6963, 3, 6960, 5942, 917, 96, 8, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6103, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 6505, 93.10, 'Sangat Lengkap', 6505, 3, 6502, 5356, 1000, 103, 46, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6171, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 9315, 92.30, 'Sangat Lengkap', 9315, 6, 9309, 6752, 2537, 23, 3, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6111, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 6641, 92.00, 'Sangat Lengkap', 6641, 8, 6633, 4323, 2315, 3, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6178, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 4561, 91.90, 'Sangat Lengkap', 4561, 2, 4559, 3141, 1419, 1, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6115, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 7493, 91.90, 'Sangat Lengkap', 7493, 5, 7488, 5517, 1787, 122, 67, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6110, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 9029, 91.70, 'Sangat Lengkap', 9029, 1, 9028, 5831, 3173, 25, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6172, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 4927, 91.50, 'Sangat Lengkap', 4927, 9, 4918, 3366, 1495, 66, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6176, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 5015, 91.50, 'Sangat Lengkap', 5015, 2, 5013, 3771, 1088, 156, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6105, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 6953, 90.00, 'Lengkap', 6953, 4, 6949, 4894, 1877, 136, 46, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6203, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 6569, 89.70, 'Lengkap', 6569, 76, 6493, 4806, 1550, 192, 21, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6114, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 6934, 88.90, 'Lengkap', 6934, 2, 6932, 3961, 2727, 227, 19, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6109, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 5788, 88.60, 'Lengkap', 5788, 4, 5784, 3473, 2103, 180, 32, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6118, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 2634, 88.60, 'Lengkap', 2634, 0, 2634, 1823, 602, 204, 5, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6179, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 2495, 88.30, 'Lengkap', 2495, 1, 2494, 1468, 909, 118, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6117, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 8766, 87.40, 'Lengkap', 8766, 3, 8763, 5909, 2353, 498, 6, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6175, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 7058, 85.80, 'Lengkap', 7058, 0, 7058, 3555, 3013, 489, 1, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6113, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 7350, 85.10, 'Lengkap', 7350, 1, 7349, 3856, 2693, 801, 0, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6202, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 6752, 84.30, 'Lengkap', 6752, 1, 6751, 3595, 2451, 671, 35, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6274, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 3844, 83.40, 'Lengkap', 3844, 2, 3842, 1921, 1371, 551, 1, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6100, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 24811, 83.30, 'Lengkap', 24811, 11, 24800, 10843, 12022, 1481, 465, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6173, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 2627, 82.90, 'Lengkap', 2627, 2, 2625, 1386, 850, 360, 31, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6272, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 3973, 82.60, 'Lengkap', 3973, 2, 3971, 1661, 2062, 247, 3, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6104, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 8463, 82.10, 'Lengkap', 8463, 1, 8462, 3651, 3891, 864, 57, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6106, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 5289, 82.00, 'Lengkap', 5289, 3, 5286, 2304, 2331, 571, 83, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6101, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 10908, 79.60, 'Lengkap', 10908, 2, 10906, 3762, 5699, 1401, 46, 'BKN Pusat'),
('upload', 'dms_bkn_official', 6102, '2026-11', '2026-11-17', '2026-11-17', '2026-11-17', 'Capaian Digitalisasi Arsip', 6942, 75.00, 'Lengkap', 6942, 6, 6936, 1906, 3780, 1143, 113, 'BKN Pusat');
