<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Seeder untuk penyeragaman seluruh path file upload sesuai standar arsitektur terpusat:
 * - apps/admin/writable/uploads/
 *   ├── public/   (dilayani via URL /media/*)
 *   └── private/  (dilayani via endpoint terproteksi / token)
 *
 * Seeder ini bersifat idempoten dan aman dijalankan berulang kali.
 */
class UploadPathNormalizationSeeder extends Seeder
{
    public function run()
    {
        $db = $this->db;

        // 1. Excel Upload Logs (public/uploads/excel/... atau /var/www/... -> public/excel/...)
        if ($db->tableExists('txn_activity_upload_logs')) {
            $db->query("
                UPDATE `txn_activity_upload_logs`
                SET `path_local` = CONCAT('public/excel/', SUBSTRING_INDEX(REPLACE(`path_local`, '\\\\', '/'), '/', -1))
                WHERE `path_local` IS NOT NULL
                  AND `path_local` != ''
                  AND `path_local` NOT LIKE 'public/excel/%'
            ");
        }

        // 2. Galeri Kegiatan (apps/assets/uploads/gallery -> media/gallery)
        if ($db->tableExists('txn_kegiatan_galeri')) {
            $db->query("
                UPDATE `txn_kegiatan_galeri`
                SET `file_path` = 'media/gallery'
                WHERE `file_path` IS NOT NULL
                  AND TRIM(BOTH '/' FROM REPLACE(`file_path`, '\\\\', '/')) IN (
                      'apps/assets/uploads/gallery',
                      'public/apps/assets/uploads/gallery'
                  )
            ");
        }

        // 3. Barang Hilang / Lost & Found (apps/assets/uploads/lost_and_found/... -> /media/lost_and_found/...)
        if ($db->tableExists('txn_barang_hilang')) {
            $db->query("
                UPDATE `txn_barang_hilang`
                SET `gambar` = CONCAT('/media/lost_and_found/', SUBSTRING_INDEX(REPLACE(`gambar`, '\\\\', '/'), '/', -1))
                WHERE `gambar` IS NOT NULL
                  AND `gambar` != ''
                  AND REPLACE(`gambar`, '\\\\', '/') LIKE '%apps/assets/uploads/lost_and_found/%'
                  AND `gambar` NOT LIKE '/media/lost_and_found/%'
            ");
        }

        // 4. Dokumentasi Progres Proyek (apps/assets/uploads/projects/progress -> media/projects/progress)
        if ($db->tableExists('data_project_progress_logs')) {
            $db->query("
                UPDATE `data_project_progress_logs`
                SET `file_path` = 'media/projects/progress'
                WHERE `file_path` IS NOT NULL
                  AND TRIM(BOTH '/' FROM REPLACE(`file_path`, '\\\\', '/')) IN (
                      'apps/assets/uploads/projects/progress',
                      'public/apps/assets/uploads/projects/progress'
                  )
            ");
        }

        // 5. Avatar Pengguna (/uploads/avatars/... -> /media/avatars/...)
        if ($db->tableExists('auth_users')) {
            $db->query("
                UPDATE `auth_users`
                SET `userimage` = CONCAT('/media/avatars/', SUBSTRING_INDEX(REPLACE(`userimage`, '\\\\', '/'), '/', -1))
                WHERE `userimage` IS NOT NULL
                  AND `userimage` != ''
                  AND LOWER(`userimage`) != 'user.jpg'
                  AND REPLACE(`userimage`, '\\\\', '/') LIKE '%uploads/avatars/%'
                  AND `userimage` NOT LIKE '/media/avatars/%'
            ");
        }

        // 6. Dokumen PNBP CAT (uploads/pnbp/... -> private/pnbp/...)
        if ($db->tableExists('txn_pnbp_documents')) {
            $db->query("
                UPDATE `txn_pnbp_documents`
                SET `pdf_file_path` = CONCAT(
                    'private/pnbp/',
                    SUBSTRING_INDEX(TRIM(LEADING '/' FROM REPLACE(`pdf_file_path`, '\\\\', '/')), 'uploads/pnbp/', -1)
                )
                WHERE `pdf_file_path` IS NOT NULL
                  AND `pdf_file_path` != ''
                  AND TRIM(LEADING '/' FROM REPLACE(`pdf_file_path`, '\\\\', '/')) LIKE 'uploads/pnbp/%'
            ");
        }

        // 7. Tanda Tangan Digital PNBP (uploads/signatures/... -> private/signatures/...)
        if ($db->tableExists('txn_pnbp_doc_signatures')) {
            $db->query("
                UPDATE `txn_pnbp_doc_signatures`
                SET `signature_image_path` = CONCAT(
                    'private/signatures/',
                    SUBSTRING_INDEX(TRIM(LEADING '/' FROM REPLACE(`signature_image_path`, '\\\\', '/')), 'uploads/signatures/', -1)
                )
                WHERE `signature_image_path` IS NOT NULL
                  AND `signature_image_path` != ''
                  AND TRIM(LEADING '/' FROM REPLACE(`signature_image_path`, '\\\\', '/')) LIKE 'uploads/signatures/%'
            ");
        }
    }
}
