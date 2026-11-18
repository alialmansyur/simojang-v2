<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCapaianColumnsToTxnDmsEntry extends Migration
{
    public function up()
    {
        $fields = [
            'skor_arsip' => [
                'type'       => 'DECIMAL',
                'constraint' => '5,2',
                'default'    => 0.00,
                'null'       => true,
                'after'      => 'total',
            ],
            'keterangan' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'default'    => 'Lengkap',
                'null'       => true,
                'after'      => 'skor_arsip',
            ],
            'total_pns' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
                'null'       => true,
                'after'      => 'keterangan',
            ],
            'status_cpns' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
                'null'       => true,
                'after'      => 'total_pns',
            ],
            'status_pns' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
                'null'       => true,
                'after'      => 'status_cpns',
            ],
            'jumlah_sangat_lengkap' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
                'null'       => true,
                'after'      => 'status_pns',
            ],
            'jumlah_lengkap' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
                'null'       => true,
                'after'      => 'jumlah_sangat_lengkap',
            ],
            'jumlah_cukup_lengkap' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
                'null'       => true,
                'after'      => 'jumlah_lengkap',
            ],
            'jumlah_kurang_lengkap' => [
                'type'       => 'INT',
                'constraint' => 11,
                'default'    => 0,
                'null'       => true,
                'after'      => 'jumlah_cukup_lengkap',
            ],
        ];

        // Hanya tambahkan kolom yang belum ada
        $existingCols = $this->db->getFieldNames('txn_dms_entry');
        $toAdd = [];
        foreach ($fields as $col => $def) {
            if (!in_array($col, $existingCols, true)) {
                $toAdd[$col] = $def;
            }
        }

        if (!empty($toAdd)) {
            $this->forge->addColumn('txn_dms_entry', $toAdd);
        }
    }

    public function down()
    {
        $columns = [
            'skor_arsip',
            'keterangan',
            'total_pns',
            'status_cpns',
            'status_pns',
            'jumlah_sangat_lengkap',
            'jumlah_lengkap',
            'jumlah_cukup_lengkap',
            'jumlah_kurang_lengkap',
        ];

        $existingCols = $this->db->getFieldNames('txn_dms_entry');
        $toDrop = array_intersect($columns, $existingCols);

        if (!empty($toDrop)) {
            $this->forge->dropColumn('txn_dms_entry', $toDrop);
        }
    }
}
