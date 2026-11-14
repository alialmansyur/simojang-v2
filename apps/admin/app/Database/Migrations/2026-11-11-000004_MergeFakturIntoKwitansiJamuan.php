<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class MergeFakturIntoKwitansiJamuan extends Migration
{
    public function up()
    {
        if ($this->db->tableExists('txn_pnbp_documents')) {
            // Hapus data child dari dokumen faktur test sebelum menghapus header
            foreach (['txn_pnbp_doc_items', 'txn_pnbp_doc_personel', 'txn_pnbp_doc_signatures'] as $childTable) {
                if ($this->db->tableExists($childTable)) {
                    $this->db->query(
                        "DELETE FROM `{$childTable}` WHERE `document_id` IN (SELECT `id` FROM `txn_pnbp_documents` WHERE `doc_type` = 'faktur')"
                    );
                }
            }

            $this->db->query("DELETE FROM `txn_pnbp_documents` WHERE `doc_type` = 'faktur'");

            $this->db->query(
                "ALTER TABLE `txn_pnbp_documents` MODIFY COLUMN `doc_type` ENUM('sp','st','nominatif','kwitansi','hadir','kwitansi_jamuan','surat_jalan','hadir_jamuan') NOT NULL DEFAULT 'sp'"
            );
        }

        if ($this->db->tableExists('data_pnbp_doc_types')) {
            $now = date('Y-m-d H:i:s');

            $this->db->table('data_pnbp_doc_types')
                ->where('doc_type', 'faktur')
                ->delete();

            $this->db->table('data_pnbp_doc_types')
                ->where('doc_type', 'kwitansi_jamuan')
                ->update([
                    'title'       => 'Kwitansi & Faktur Jamuan',
                    'short_title' => 'Kwitansi & Faktur',
                    'description' => '1 kesatuan dokumen pembayaran konsumsi: Kwitansi Jamuan di halaman 1 dan Faktur Jamuan di halaman selanjutnya.',
                    'updated_at'  => $now,
                ]);

            $this->db->table('data_pnbp_doc_types')
                ->where('doc_type', 'surat_jalan')
                ->update([
                    'number'     => 7,
                    'updated_at' => $now,
                ]);

            $this->db->table('data_pnbp_doc_types')
                ->where('doc_type', 'hadir_jamuan')
                ->update([
                    'number'     => 8,
                    'updated_at' => $now,
                ]);
        }
    }

    public function down()
    {
        if ($this->db->tableExists('txn_pnbp_documents')) {
            $this->db->query(
                "ALTER TABLE `txn_pnbp_documents` MODIFY COLUMN `doc_type` ENUM('sp','st','nominatif','kwitansi','hadir','kwitansi_jamuan','surat_jalan','faktur','hadir_jamuan') NOT NULL DEFAULT 'sp'"
            );
        }

        if ($this->db->tableExists('data_pnbp_doc_types')) {
            $now = date('Y-m-d H:i:s');

            $this->db->table('data_pnbp_doc_types')
                ->where('doc_type', 'kwitansi_jamuan')
                ->update([
                    'title'       => 'Kwitansi Jamuan',
                    'short_title' => 'Kwitansi Jamuan',
                    'description' => 'Bukti pembayaran resmi kepada penyedia katering untuk belanja jamuan/konsumsi kegiatan.',
                    'updated_at'  => $now,
                ]);

            $this->db->table('data_pnbp_doc_types')
                ->where('doc_type', 'surat_jalan')
                ->update([
                    'number'     => 7,
                    'updated_at' => $now,
                ]);

            $this->db->table('data_pnbp_doc_types')
                ->where('doc_type', 'hadir_jamuan')
                ->update([
                    'number'     => 9,
                    'updated_at' => $now,
                ]);

            $exists = $this->db->table('data_pnbp_doc_types')->where('doc_type', 'faktur')->get()->getRowArray();
            if (!$exists) {
                $this->db->table('data_pnbp_doc_types')->insert([
                    'doc_type'     => 'faktur',
                    'number'       => 8,
                    'title'        => 'Faktur Jamuan (Invoice)',
                    'short_title'  => 'Faktur Jamuan',
                    'category'     => 'Konsumsi & Katering',
                    'category_key' => 'jamuan',
                    'description'  => 'Faktur tagihan belanja makanan/snack dari penyedia katering dengan rincian menu.',
                    'badge_class'  => 'badge-primary',
                    'color'        => '#7c3aed',
                    'bg_light'     => '#f5f3ff',
                    'icon_svg'     => '<svg viewBox="0 0 24 24" aria-hidden="true" style="width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>',
                    'is_status'    => 0,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ]);
            }
        }
    }
}
