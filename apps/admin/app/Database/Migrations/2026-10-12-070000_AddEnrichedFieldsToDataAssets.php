<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddEnrichedFieldsToDataAssets extends Migration
{
    public function up()
    {
        $db = \Config\Database::connect();
        $fields = [
            'foto' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
                'after' => 'qty'
            ],
            'kondisi' => [
                'type' => 'ENUM',
                'constraint' => ['Baik', 'Rusak Ringan', 'Rusak Berat'],
                'default' => 'Baik',
                'after' => 'foto'
            ],
            'lokasi' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
                'after' => 'kondisi'
            ],
            'tahun_perolehan' => [
                'type' => 'INT',
                'constraint' => 4,
                'null' => true,
                'after' => 'lokasi'
            ],
            'nilai_perolehan' => [
                'type' => 'DECIMAL',
                'constraint' => '15,2',
                'default' => 0.00,
                'after' => 'tahun_perolehan'
            ],
            'keterangan' => [
                'type' => 'TEXT',
                'null' => true,
                'after' => 'nilai_perolehan'
            ],
        ];

        $fieldsToAdd = [];
        foreach ($fields as $fieldName => $fieldDef) {
            if (!$db->fieldExists($fieldName, 'data_assets')) {
                $fieldsToAdd[$fieldName] = $fieldDef;
            }
        }

        if (!empty($fieldsToAdd)) {
            $this->forge->addColumn('data_assets', $fieldsToAdd);
        }
    }

    public function down()
    {
        $this->forge->dropColumn('data_assets', [
            'foto',
            'kondisi',
            'lokasi',
            'tahun_perolehan',
            'nilai_perolehan',
            'keterangan'
        ]);
    }
}
