<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RegisterTimKerjaAndServicesToAuthPermissions extends Migration
{
    public function up()
    {
        $db = $this->db;
        $now = date('Y-m-d H:i:s');

        // =====================================================================
        // 1. Bersihkan record level 4 (eksternal) dari data_timkerja_layanan
        // =====================================================================
        if ($db->tableExists('data_timkerja_layanan')) {
            $db->table('data_timkerja_layanan')->where('level_id', 4)->delete();
        }

        // =====================================================================
        // 2. Tambah kolom permission_id jika belum ada
        // =====================================================================
        if ($db->tableExists('data_timkerja') && !$db->fieldExists('permission_id', 'data_timkerja')) {
            $this->forge->addColumn('data_timkerja', [
                'permission_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => true,
                    'default'    => null,
                    'after'      => 'is_show',
                ],
            ]);
        }

        if ($db->tableExists('data_timkerja_layanan') && !$db->fieldExists('permission_id', 'data_timkerja_layanan')) {
            $this->forge->addColumn('data_timkerja_layanan', [
                'permission_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => true,
                    'default'    => null,
                    'after'      => 'level_id',
                ],
            ]);
        }

        // =====================================================================
        // 3. Pastikan Root Tim Kerja (ID 57) ada dan aktif
        // =====================================================================
        $rootTk = $db->table('auth_permissions')->where('id', 57)->get()->getRowArray();
        if ($rootTk) {
            $db->table('auth_permissions')->where('id', 57)->update([
                'name'        => 'Tim Kerja',
                'url'         => 'timkerja',
                'icon'        => 'bi bi-chat-quote-fill',
                'parent_id'   => null,
                'is_show'     => 1,
                'is_order'    => 3,
                'is_external' => 0,
            ]);
        } else {
            $db->table('auth_permissions')->insert([
                'id'          => 57,
                'name'        => 'Tim Kerja',
                'url'         => 'timkerja',
                'icon'        => 'bi bi-chat-quote-fill',
                'parent_id'   => null,
                'is_show'     => 1,
                'is_order'    => 3,
                'is_external' => 0,
            ]);
        }

        // =====================================================================
        // 4. Daftarkan 6 Tim Kerja di Bawah Root ID 57 (Level 1)
        // =====================================================================
        $timKerjaDefs = [
            1 => ['perm_id' => 201, 'code' => 'pnm',    'name' => 'Tim Kerja Pengangkatan dan Mutasi',          'icon' => 'bi bi-person-check',          'sort' => 1],
            2 => ['perm_id' => 202, 'code' => 'snp',    'name' => 'Tim Kerja Status dan Pemberhentian',         'icon' => 'bi bi-shield-exclamation',    'sort' => 2],
            3 => ['perm_id' => 203, 'code' => 'pmasn',  'name' => 'Tim Kerja Pembinaan Manajemen ASN',          'icon' => 'bi bi-award',                 'sort' => 3],
            4 => ['perm_id' => 204, 'code' => 'pnp',    'name' => 'Tim Kerja Pengawasan dan Pengendalian',      'icon' => 'bi bi-file-earmark-check',     'sort' => 4],
            5 => ['perm_id' => 205, 'code' => 'sidigi', 'name' => 'Tim Kerja Sistem Informasi dan Digitalisasi', 'icon' => 'bi bi-cpu',                  'sort' => 5],
            6 => ['perm_id' => 206, 'code' => 'tu',     'name' => 'Bagian Tata Usaha Kanreg',                   'icon' => 'bi bi-building',              'sort' => 6],
        ];

        $allNewPermIds = [];

        foreach ($timKerjaDefs as $tkId => $def) {
            $pId = $def['perm_id'];
            $allNewPermIds[] = $pId;

            $exists = $db->table('auth_permissions')->where('id', $pId)->countAllResults();
            $permData = [
                'name'        => $def['name'],
                'url'         => 'timkerja/' . $def['code'],
                'icon'        => $def['icon'],
                'parent_id'   => 57,
                'is_show'     => 1,
                'is_order'    => $def['sort'],
                'is_external' => 0,
            ];

            if ($exists > 0) {
                $db->table('auth_permissions')->where('id', $pId)->update($permData);
            } else {
                $db->table('auth_permissions')->insert(['id' => $pId] + $permData);
            }

            // Hubungkan ke data_timkerja
            $db->table('data_timkerja')->where('id', $tkId)->update(['permission_id' => $pId]);
        }

        // =====================================================================
        // 5. Daftarkan Layanan Tim Kerja (Level 2) di Bawah Tim Kerja Masing-Masing
        // =====================================================================
        $level2Services = $db->table('data_timkerja_layanan')
            ->where('level_id', 2)
            ->where('is_show', 1)
            ->orderBy('id', 'ASC')
            ->get()
            ->getResultArray();

        foreach ($level2Services as $s) {
            $svcId = (int) $s['id'];
            $tkId = (int) $s['timkerja_id'];
            $permId = 300 + $svcId;
            $parentPermId = 200 + $tkId;
            $allNewPermIds[] = $permId;

            $rawUrl = trim((string) ($s['url'] ?? ''));
            $permData = [
                'name'        => $s['nama_layanan'],
                'url'         => !empty($rawUrl) ? $rawUrl : 'layanan/' . $svcId,
                'icon'        => 'bi bi-grid',
                'parent_id'   => $parentPermId,
                'is_show'     => 1,
                'is_order'    => $svcId,
                'is_external' => 0,
            ];

            $exists = $db->table('auth_permissions')->where('id', $permId)->countAllResults();
            if ($exists > 0) {
                $db->table('auth_permissions')->where('id', $permId)->update($permData);
            } else {
                $db->table('auth_permissions')->insert(['id' => $permId] + $permData);
            }

            $db->table('data_timkerja_layanan')->where('id', $svcId)->update(['permission_id' => $permId]);
        }

        // =====================================================================
        // 6. Daftarkan Sub-Layanan Hub (Level 3) di Bawah Layanan Hub Induknya
        // =====================================================================
        $level3Services = $db->table('data_timkerja_layanan')
            ->where('level_id', 3)
            ->where('is_show', 1)
            ->orderBy('id', 'ASC')
            ->get()
            ->getResultArray();

        foreach ($level3Services as $sub) {
            $subId = (int) $sub['id'];
            $parentSvcId = (int) $sub['parent_id'];
            $permId = 400 + $subId;
            $parentPermId = 300 + $parentSvcId;
            $allNewPermIds[] = $permId;

            $rawUrl = trim((string) ($sub['url'] ?? ''));
            $permData = [
                'name'        => $sub['nama_layanan'],
                'url'         => !empty($rawUrl) ? $rawUrl : 'sublayanan/' . $subId,
                'icon'        => 'bi bi-diagram-2',
                'parent_id'   => $parentPermId,
                'is_show'     => 1,
                'is_order'    => $subId,
                'is_external' => 0,
            ];

            $exists = $db->table('auth_permissions')->where('id', $permId)->countAllResults();
            if ($exists > 0) {
                $db->table('auth_permissions')->where('id', $permId)->update($permData);
            } else {
                $db->table('auth_permissions')->insert(['id' => $permId] + $permData);
            }

            $db->table('data_timkerja_layanan')->where('id', $subId)->update(['permission_id' => $permId]);
        }

        // =====================================================================
        // 7. Seeding Hak Akses ke auth_role_permissions:
        //    - Role ADM (1): Full Access (CRUD) untuk semua permissions
        //    - Role USR (2): Read Access untuk menu utama, eksternal, tim kerja & layanannya
        // =====================================================================
        if ($db->tableExists('auth_role_permissions')) {
            // Role ADM (1)
            foreach ($allNewPermIds as $pId) {
                $exists = $db->table('auth_role_permissions')
                    ->where('role_id', 1)
                    ->where('permission_id', $pId)
                    ->countAllResults();

                if ($exists > 0) {
                    $db->table('auth_role_permissions')
                        ->where('role_id', 1)
                        ->where('permission_id', $pId)
                        ->update([
                            'is_create'  => 1,
                            'is_read'    => 1,
                            'is_update'  => 1,
                            'is_delete'  => 1,
                            'updated_at' => $now,
                        ]);
                } else {
                    $db->table('auth_role_permissions')->insert([
                        'role_id'       => 1,
                        'permission_id' => $pId,
                        'is_create'     => 1,
                        'is_read'       => 1,
                        'is_update'     => 1,
                        'is_delete'     => 1,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]);
                }
            }

            // Role USR (2)
            // Sesuai permintaan user:
            // "role user : terbuka semua halaman utama dan ekternal, namun untuk tim kerja sesaui dengan data pegawai unit_kerja_id nya masing masing, halaman layanan dan sub layanan bairkan terbuka, nanti akan saya customize dan testing manual"
            foreach ($allNewPermIds as $pId) {
                $exists = $db->table('auth_role_permissions')
                    ->where('role_id', 2)
                    ->where('permission_id', $pId)
                    ->countAllResults();

                if ($exists > 0) {
                    $db->table('auth_role_permissions')
                        ->where('role_id', 2)
                        ->where('permission_id', $pId)
                        ->update([
                            'is_create'  => 0,
                            'is_read'    => 1,
                            'is_update'  => 0,
                            'is_delete'  => 0,
                            'updated_at' => $now,
                        ]);
                } else {
                    $db->table('auth_role_permissions')->insert([
                        'role_id'       => 2,
                        'permission_id' => $pId,
                        'is_create'     => 0,
                        'is_read'       => 1,
                        'is_update'     => 0,
                        'is_delete'     => 0,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]);
                }
            }
        }
    }

    public function down()
    {
        $db = $this->db;

        if ($db->tableExists('auth_permissions')) {
            $db->table('auth_permissions')
                ->where('id >=', 201)
                ->where('id <=', 499)
                ->delete();
        }

        if ($db->tableExists('auth_role_permissions')) {
            $db->table('auth_role_permissions')
                ->where('permission_id >=', 201)
                ->where('permission_id <=', 499)
                ->delete();
        }
    }
}
