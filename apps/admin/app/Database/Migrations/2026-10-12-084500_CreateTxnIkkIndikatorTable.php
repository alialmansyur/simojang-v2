<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTxnIkkIndikatorTable extends Migration
{
    public function up()
    {
        $db = \Config\Database::connect();

        if (!$db->tableExists('txn_ikk_indikator')) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'indikator_id' => [
                    'type'       => 'BIGINT',
                    'unsigned'   => true,
                ],
                'tahun' => [
                    'type'       => 'SMALLINT',
                    'constraint' => 4,
                ],
                'triwulan' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                ],
                'bulan' => [
                    'type'       => 'TINYINT',
                    'constraint' => 2,
                    'null'       => true,
                ],
                'periode_key' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 20,
                ],
                'target_periode' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 100,
                    'null'       => true,
                ],
                'jumlah_realisasi' => [
                    'type'       => 'DECIMAL',
                    'constraint' => '12,2',
                    'null'       => true,
                ],
                'progres_capaian' => [
                    'type'       => 'DECIMAL',
                    'constraint' => '5,2',
                    'default'    => 0.00,
                ],
                'penjelasan_capaian' => [
                    'type' => 'TEXT',
                    'null' => true,
                ],
                'bukti_dukung' => [
                    'type' => 'TEXT',
                    'null' => true,
                ],
                'created_by' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 100,
                    'null'       => true,
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'updated_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
            ]);

            $this->forge->addKey('id', true);
            $this->forge->createTable('txn_ikk_indikator', true);
        }

        // Tambahkan index dan unique constraint jika belum ada
        $indexes = $db->query("SHOW INDEX FROM txn_ikk_indikator")->getResultArray();
        $indexNames = array_column($indexes, 'Key_name');

        if (!in_array('uniq_ind_periode', $indexNames)) {
            $db->query("ALTER TABLE txn_ikk_indikator ADD UNIQUE KEY uniq_ind_periode (indikator_id, tahun, triwulan)");
        }
        if (!in_array('idx_txn_ind_tahun_tw', $indexNames)) {
            $db->query("ALTER TABLE txn_ikk_indikator ADD INDEX idx_txn_ind_tahun_tw (tahun, triwulan)");
        }

        // Tambahkan Foreign Key jika tabel data_ikk_indikator ada
        if ($db->tableExists('data_ikk_indikator')) {
            $fks = $db->query("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'txn_ikk_indikator' AND CONSTRAINT_TYPE = 'FOREIGN KEY'")->getResultArray();
            $fkNames = array_column($fks, 'CONSTRAINT_NAME');
            if (!in_array('fk_txn_ind_id', $fkNames)) {
                $db->query("ALTER TABLE txn_ikk_indikator ADD CONSTRAINT fk_txn_ind_id FOREIGN KEY (indikator_id) REFERENCES data_ikk_indikator (id) ON DELETE CASCADE ON UPDATE CASCADE");
            }
        }
    }

    public function down()
    {
        $this->forge->dropTable('txn_ikk_indikator', true);
    }
}
