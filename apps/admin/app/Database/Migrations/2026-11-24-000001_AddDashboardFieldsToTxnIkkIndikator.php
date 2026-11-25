<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDashboardFieldsToTxnIkkIndikator extends Migration
{
    public function up()
    {
        $db = \Config\Database::connect();

        if ($db->tableExists('txn_ikk_indikator')) {
            $fields = [];
            
            if (!$db->fieldExists('realisasi_text', 'txn_ikk_indikator')) {
                $fields['realisasi_text'] = [
                    'type'       => 'VARCHAR',
                    'constraint' => 100,
                    'null'       => true,
                    'after'      => 'jumlah_realisasi',
                ];
            }

            if (!$db->fieldExists('capaian_text', 'txn_ikk_indikator')) {
                $fields['capaian_text'] = [
                    'type'       => 'VARCHAR',
                    'constraint' => 100,
                    'null'       => true,
                    'after'      => 'progres_capaian',
                ];
            }

            if (!$db->fieldExists('permasalahan', 'txn_ikk_indikator')) {
                $fields['permasalahan'] = [
                    'type'  => 'TEXT',
                    'null'  => true,
                    'after' => 'penjelasan_capaian',
                ];
            }

            if (!$db->fieldExists('rencana_tindak_lanjut', 'txn_ikk_indikator')) {
                $fields['rencana_tindak_lanjut'] = [
                    'type'  => 'TEXT',
                    'null'  => true,
                    'after' => 'permasalahan',
                ];
            }

            if (!empty($fields)) {
                $this->forge->addColumn('txn_ikk_indikator', $fields);
            }

            // Also modify progres_capaian to allow null and larger range if needed
            $db->query("ALTER TABLE txn_ikk_indikator MODIFY COLUMN progres_capaian DECIMAL(8,2) NULL DEFAULT 0.00");
        }
    }

    public function down()
    {
        $db = \Config\Database::connect();

        if ($db->tableExists('txn_ikk_indikator')) {
            $dropFields = [];
            if ($db->fieldExists('realisasi_text', 'txn_ikk_indikator')) {
                $dropFields[] = 'realisasi_text';
            }
            if ($db->fieldExists('capaian_text', 'txn_ikk_indikator')) {
                $dropFields[] = 'capaian_text';
            }
            if ($db->fieldExists('permasalahan', 'txn_ikk_indikator')) {
                $dropFields[] = 'permasalahan';
            }
            if ($db->fieldExists('rencana_tindak_lanjut', 'txn_ikk_indikator')) {
                $dropFields[] = 'rencana_tindak_lanjut';
            }

            if (!empty($dropFields)) {
                $this->forge->dropColumn('txn_ikk_indikator', $dropFields);
            }
        }
    }
}
