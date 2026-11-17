<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class UnifySettingsAndReferensiAuthPermissions extends Migration
{
    public function up()
    {
        $db = $this->db;
        $now = date('Y-m-d H:i:s');

        // =====================================================================
        // 1. Buat / Update Root Parent: ID 500 "Pengaturan & Referensi"
        // =====================================================================
        $existsRoot = $db->table('auth_permissions')->where('id', 500)->countAllResults();
        $rootData = [
            'name'        => 'Pengaturan & Referensi',
            'url'         => '#',
            'icon'        => 'bi bi-gear-fill',
            'parent_id'   => null,
            'is_show'     => 1,
            'is_order'    => 999,
            'is_external' => 0,
        ];

        if ($existsRoot > 0) {
            $db->table('auth_permissions')->where('id', 500)->update($rootData);
        } else {
            $db->table('auth_permissions')->insert(['id' => 500] + $rootData);
        }

        // =====================================================================
        // 2. Sub-Menu 1: ID 59 "Pengaturan" (Hub Pengaturan, di bawah ID 500)
        // =====================================================================
        $db->table('auth_permissions')->where('id', 59)->update([
            'name'        => 'Pengaturan',
            'url'         => 'settings',
            'icon'        => 'bi bi-sliders',
            'parent_id'   => 500,
            'is_show'     => 1,
            'is_order'    => 1,
            'is_external' => 0,
        ]);

        // =====================================================================
        // 3. Sub-Menu 2: ID 61 "Referensi" (Hub Referensi, di bawah ID 500)
        // =====================================================================
        $db->table('auth_permissions')->where('id', 61)->update([
            'name'        => 'Referensi',
            'url'         => 'settings/referensi',
            'icon'        => 'bi bi-table',
            'parent_id'   => 500,
            'is_show'     => 1,
            'is_order'    => 2,
            'is_external' => 0,
        ]);

        // =====================================================================
        // 4. Sub-Halaman Layanan Pengaturan (di bawah ID 59)
        // =====================================================================
        $pengaturanSubServices = [
            99 => ['name' => 'User Manager',    'url' => 'manage-user',    'icon' => 'bi bi-person-gear',    'sort' => 1],
            55 => ['name' => 'Role Manager',    'url' => 'manage-role',    'icon' => 'bi bi-shield-lock',    'sort' => 2],
            53 => ['name' => 'Service Manager', 'url' => 'manage-layanan', 'icon' => 'bi bi-grid-fill',      'sort' => 3],
            50 => ['name' => 'Data Pegawai',    'url' => 'manage-pegawai', 'icon' => 'bi bi-people',         'sort' => 4],
            51 => ['name' => 'Data Instansi',   'url' => 'manage-instansi','icon' => 'bi bi-building',       'sort' => 5],
            52 => ['name' => 'Data SS/IKU',     'url' => 'manage-iku',     'icon' => 'bi bi-card-checklist', 'sort' => 6],
            58 => ['name' => 'System Setting',  'url' => 'manage-setting', 'icon' => 'bi bi-gear',           'sort' => 7],
            60 => ['name' => 'SMTP Setting',    'url' => 'manage-smtp',    'icon' => 'bi bi-envelope',       'sort' => 8],
        ];

        $pengaturanIds = [500, 59, 61];

        foreach ($pengaturanSubServices as $subId => $item) {
            $pengaturanIds[] = $subId;
            $exists = $db->table('auth_permissions')->where('id', $subId)->countAllResults();
            $subData = [
                'name'        => $item['name'],
                'url'         => $item['url'],
                'icon'        => $item['icon'],
                'parent_id'   => 59,
                'is_show'     => 1,
                'is_order'    => $item['sort'],
                'is_external' => 0,
            ];

            if ($exists > 0) {
                $db->table('auth_permissions')->where('id', $subId)->update($subData);
            } else {
                $db->table('auth_permissions')->insert(['id' => $subId] + $subData);
            }
        }

        // =====================================================================
        // 5. Pastikan Sub-Halaman Referensi (di bawah ID 61) tetap aktif
        // =====================================================================
        $db->table('auth_permissions')
            ->where('parent_id', 61)
            ->update(['is_show' => 1]);

        $referensiChildren = $db->table('auth_permissions')
            ->select('id')
            ->where('parent_id', 61)
            ->get()
            ->getResultArray();
        foreach ($referensiChildren as $rc) {
            $pengaturanIds[] = (int) $rc['id'];
        }

        // =====================================================================
        // 6. Seeding Hak Akses RBAC:
        //    - Role ADM (1): Full Access untuk 500, 59, 61, dan seluruh sub-halamannya
        //    - Role USR (2): Cabut akses ke 500, 59, 61, dan sub-halamannya
        // =====================================================================
        if ($db->tableExists('auth_role_permissions')) {
            // Role ADM (1)
            foreach ($pengaturanIds as $pId) {
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

            // Role USR (2): Cabut akses
            $db->table('auth_role_permissions')
                ->where('role_id', 2)
                ->whereIn('permission_id', $pengaturanIds)
                ->delete();
        }
    }

    public function down()
    {
        $db = $this->db;

        // Kembalikan ID 59 dan 61 menjadi root
        if ($db->tableExists('auth_permissions')) {
            $db->table('auth_permissions')->where('id', 59)->update(['parent_id' => null]);
            $db->table('auth_permissions')->where('id', 61)->update(['parent_id' => null]);
            $db->table('auth_permissions')->where('id', 500)->delete();
        }

        if ($db->tableExists('auth_role_permissions')) {
            $db->table('auth_role_permissions')->where('permission_id', 500)->delete();
        }
    }
}
