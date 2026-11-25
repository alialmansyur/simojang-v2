<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class UpdateTxnIkkIndikatorToMonthlyLog extends Migration
{
    public function up()
    {
        $db = \Config\Database::connect();

        if ($db->tableExists('txn_ikk_indikator')) {
            // Pastikan ada index fk pada indikator_id sebelum drop unique
            $indexes = $db->query("SHOW INDEX FROM txn_ikk_indikator")->getResultArray();
            $indexNames = array_column($indexes, 'Key_name');

            if (!in_array('idx_fk_indikator', $indexNames)) {
                $db->query("ALTER TABLE txn_ikk_indikator ADD INDEX idx_fk_indikator (indikator_id)");
            }

            if (in_array('uniq_ind_periode', $indexNames)) {
                $db->query("ALTER TABLE txn_ikk_indikator DROP INDEX uniq_ind_periode");
            }

            if (!in_array('idx_txn_ind_lookup', $indexNames)) {
                $db->query("ALTER TABLE txn_ikk_indikator ADD INDEX idx_txn_ind_lookup (indikator_id, tahun, bulan)");
            }

            // Update existing null bulan
            $db->query("UPDATE txn_ikk_indikator SET bulan = triwulan * 3 WHERE bulan IS NULL AND triwulan IS NOT NULL");
        }
    }

    public function down()
    {
        $db = \Config\Database::connect();
        if ($db->tableExists('txn_ikk_indikator')) {
            $indexes = $db->query("SHOW INDEX FROM txn_ikk_indikator")->getResultArray();
            $indexNames = array_column($indexes, 'Key_name');
            if (!in_array('uniq_ind_periode', $indexNames)) {
                $db->query("ALTER TABLE txn_ikk_indikator ADD UNIQUE KEY uniq_ind_periode (indikator_id, tahun, triwulan)");
            }
        }
    }
}
