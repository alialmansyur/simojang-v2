<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class EnhancePnbpDocumentsForBuilderAndUpload extends Migration
{
    public function up()
    {
        if ($this->db->tableExists('txn_pnbp_documents')) {
            if (!$this->db->fieldExists('source_mode', 'txn_pnbp_documents')) {
                $this->db->query(
                    "ALTER TABLE `txn_pnbp_documents` ADD COLUMN `source_mode` ENUM('builder','upload') NOT NULL DEFAULT 'builder' AFTER `status`"
                );
            }
            if (!$this->db->fieldExists('original_filename', 'txn_pnbp_documents')) {
                $this->db->query(
                    "ALTER TABLE `txn_pnbp_documents` ADD COLUMN `original_filename` VARCHAR(255) NULL DEFAULT NULL AFTER `pdf_file_path`"
                );
            }
        }

        if ($this->db->tableExists('txn_pnbp_doc_personel')) {
            if (!$this->db->fieldExists('is_external', 'txn_pnbp_doc_personel')) {
                $this->db->query(
                    "ALTER TABLE `txn_pnbp_doc_personel` ADD COLUMN `is_external` TINYINT(1) NOT NULL DEFAULT 0 AFTER `nip`"
                );
            }
            if (!$this->db->fieldExists('instansi_asal', 'txn_pnbp_doc_personel')) {
                $this->db->query(
                    "ALTER TABLE `txn_pnbp_doc_personel` ADD COLUMN `instansi_asal` VARCHAR(255) NULL DEFAULT NULL AFTER `nama`"
                );
            }
        }

        if ($this->db->tableExists('data_pnbp_doc_types')) {
            $now = date('Y-m-d H:i:s');
            $this->db->table('data_pnbp_doc_types')
                ->whereIn('doc_type', ['sp', 'st', 'nominatif', 'kwitansi', 'hadir', 'kwitansi_jamuan', 'surat_jalan', 'hadir_jamuan'])
                ->update([
                    'is_status'  => 1,
                    'updated_at' => $now,
                ]);
        }
    }

    public function down()
    {
        if ($this->db->tableExists('txn_pnbp_documents')) {
            if ($this->db->fieldExists('original_filename', 'txn_pnbp_documents')) {
                $this->db->query("ALTER TABLE `txn_pnbp_documents` DROP COLUMN `original_filename`");
            }
            if ($this->db->fieldExists('source_mode', 'txn_pnbp_documents')) {
                $this->db->query("ALTER TABLE `txn_pnbp_documents` DROP COLUMN `source_mode`");
            }
        }

        if ($this->db->tableExists('txn_pnbp_doc_personel')) {
            if ($this->db->fieldExists('instansi_asal', 'txn_pnbp_doc_personel')) {
                $this->db->query("ALTER TABLE `txn_pnbp_doc_personel` DROP COLUMN `instansi_asal`");
            }
            if ($this->db->fieldExists('is_external', 'txn_pnbp_doc_personel')) {
                $this->db->query("ALTER TABLE `txn_pnbp_doc_personel` DROP COLUMN `is_external`");
            }
        }
    }
}
