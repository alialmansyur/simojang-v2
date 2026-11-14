<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddMaintenanceToDataTimkerjaLayanan extends Migration
{
    public function up()
    {
        if ($this->db->tableExists('data_timkerja_layanan')) {
            $fields = [];

            if (!$this->db->fieldExists('is_maintenance', 'data_timkerja_layanan')) {
                $fields['is_maintenance'] = [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                    'default'    => 0,
                    'null'       => false,
                    'after'      => 'is_show',
                ];
            }

            if (!$this->db->fieldExists('maintenance_msg', 'data_timkerja_layanan')) {
                $fields['maintenance_msg'] = [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                    'default'    => null,
                    'after'      => 'is_maintenance',
                ];
            }

            if (!$this->db->fieldExists('maintenance_updated_at', 'data_timkerja_layanan')) {
                $fields['maintenance_updated_at'] = [
                    'type'    => 'DATETIME',
                    'null'    => true,
                    'default' => null,
                    'after'   => 'maintenance_msg',
                ];
            }

            if (!$this->db->fieldExists('maintenance_updated_by', 'data_timkerja_layanan')) {
                $fields['maintenance_updated_by'] = [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'null'       => true,
                    'default'    => null,
                    'after'      => 'maintenance_updated_at',
                ];
            }

            if (!empty($fields)) {
                $this->forge->addColumn('data_timkerja_layanan', $fields);
            }
        }
    }

    public function down()
    {
        if ($this->db->tableExists('data_timkerja_layanan')) {
            $columnsToDrop = [];
            foreach (['maintenance_updated_by', 'maintenance_updated_at', 'maintenance_msg', 'is_maintenance'] as $col) {
                if ($this->db->fieldExists($col, 'data_timkerja_layanan')) {
                    $columnsToDrop[] = $col;
                }
            }
            if (!empty($columnsToDrop)) {
                $this->forge->dropColumn('data_timkerja_layanan', $columnsToDrop);
            }
        }
    }
}
