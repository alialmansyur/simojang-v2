<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCfgCatPengelolaTable extends Migration
{
    public function up()
    {
        if (!$this->db->tableExists('cfg_cat_pengelola')) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'INT',
                    'constraint'     => 11,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'nip' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 30,
                    'null'       => false,
                ],
                'nama' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 150,
                    'null'       => true,
                ],
                'keterangan' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'is_active' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                    'default'    => 1,
                ],
                'created_by' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
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
            $this->forge->addUniqueKey('nip', 'uk_cat_pengelola_nip');
            $this->forge->addKey('is_active', false, false, 'idx_cat_pengelola_active');
            $this->forge->createTable('cfg_cat_pengelola', true);
        }

        $initialNips = [
            '199707252024211004',
            '198707302008122001',
            '199612052024211008',
            '199011092022032007',
            '199506062024212040',
            '199509302024212031',
        ];

        $now = date('Y-m-d H:i:s');
        $hasPegawaiTable = $this->db->tableExists('data_pegawai');
        $hasUsersTable   = $this->db->tableExists('auth_users');

        foreach ($initialNips as $nip) {
            $existing = $this->db->table('cfg_cat_pengelola')
                ->where('nip', $nip)
                ->limit(1)
                ->get()
                ->getRowArray();

            $nama = null;
            if ($hasPegawaiTable) {
                $pegawai = $this->db->table('data_pegawai')
                    ->select('nama')
                    ->where('nip', $nip)
                    ->limit(1)
                    ->get()
                    ->getRowArray();
                if (!empty($pegawai['nama'])) {
                    $nama = trim((string) $pegawai['nama']);
                }
            }
            if ($nama === null && $hasUsersTable) {
                $user = $this->db->table('auth_users')
                    ->select('fullname')
                    ->where('username', $nip)
                    ->limit(1)
                    ->get()
                    ->getRowArray();
                if (!empty($user['fullname'])) {
                    $nama = trim((string) $user['fullname']);
                }
            }

            if ($existing) {
                $updatePayload = [
                    'is_active'  => 1,
                    'updated_at' => $now,
                ];
                if (empty($existing['nama']) && $nama !== null) {
                    $updatePayload['nama'] = $nama;
                }
                $this->db->table('cfg_cat_pengelola')
                    ->where('id', $existing['id'])
                    ->update($updatePayload);
                continue;
            }

            $this->db->table('cfg_cat_pengelola')->insert([
                'nip'        => $nip,
                'nama'       => $nama,
                'keterangan' => 'Pengelola Resmi CAT',
                'is_active'  => 1,
                'created_by' => 'migration',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down()
    {
        $this->forge->dropTable('cfg_cat_pengelola', true);
    }
}
