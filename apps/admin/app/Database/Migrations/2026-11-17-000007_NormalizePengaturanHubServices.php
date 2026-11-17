<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class NormalizePengaturanHubServices extends Migration
{
    public function up()
    {
        $db = $this->db;
        $now = date('Y-m-d H:i:s');

        // =====================================================================
        // 1. Sesuaikan 5 Sub-Layanan Sebenarnya di Bawah Pengaturan (ID 59)
        //    Sesuai kartu pada halaman Hub /settings:
        //    1. Manajemen Pengguna & Pegawai (/settings/users)
        //    2. Manajemen Role & Struktur Menu (/settings/roles)
        //    3. Manajemen Layanan & Hak Akses (/settings/services)
        //    4. Pengaturan Sistem & Email SMTP (/settings/system)
        //    5. Log Audit & Aktivitas Sistem (/settings/audit)
        // =====================================================================
        $activeFive = [
            99 => [
                'name'     => 'Manajemen Pengguna & Pegawai',
                'url'      => 'settings/users',
                'icon'     => 'bi bi-people',
                'is_order' => 1,
            ],
            55 => [
                'name'     => 'Manajemen Role & Struktur Menu',
                'url'      => 'settings/roles',
                'icon'     => 'bi bi-shield-check',
                'is_order' => 2,
            ],
            53 => [
                'name'     => 'Manajemen Layanan & Hak Akses',
                'url'      => 'settings/services',
                'icon'     => 'bi bi-layers',
                'is_order' => 3,
            ],
            58 => [
                'name'     => 'Pengaturan Sistem & Email SMTP',
                'url'      => 'settings/system',
                'icon'     => 'bi bi-sliders',
                'is_order' => 4,
            ],
            56 => [
                'name'     => 'Log Audit & Aktivitas Sistem',
                'url'      => 'settings/audit',
                'icon'     => 'bi bi-file-earmark-text',
                'is_order' => 5,
            ],
        ];

        foreach ($activeFive as $id => $data) {
            $exists = $db->table('auth_permissions')->where('id', $id)->countAllResults();
            $updateData = [
                'name'        => $data['name'],
                'url'         => $data['url'],
                'icon'        => $data['icon'],
                'parent_id'   => 59,
                'is_show'     => 1,
                'is_order'    => $data['is_order'],
                'is_external' => 0,
            ];

            if ($exists > 0) {
                $db->table('auth_permissions')->where('id', $id)->update($updateData);
            } else {
                $db->table('auth_permissions')->insert(['id' => $id] + $updateData);
            }

            // Berikan izin penuh ke Admin (Role ID 1)
            $existsAdm = $db->table('auth_role_permissions')
                ->where('role_id', 1)
                ->where('permission_id', $id)
                ->countAllResults();

            if ($existsAdm > 0) {
                $db->table('auth_role_permissions')
                    ->where('role_id', 1)
                    ->where('permission_id', $id)
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
                    'permission_id' => $id,
                    'is_create'     => 1,
                    'is_read'       => 1,
                    'is_update'     => 1,
                    'is_delete'     => 1,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);
            }
        }

        // =====================================================================
        // 2. Nonaktifkan menu legacy/duplikat (50, 51, 52, 60)
        // =====================================================================
        $legacyIds = [50, 51, 52, 60];
        $db->table('auth_permissions')
            ->whereIn('id', $legacyIds)
            ->update([
                'is_show'   => 0,
                'parent_id' => 49,
            ]);

        // Cabut izin dari auth_role_permissions untuk legacy IDs
        $db->table('auth_role_permissions')
            ->whereIn('permission_id', $legacyIds)
            ->delete();
    }

    public function down()
    {
        $db = $this->db;

        $db->table('auth_permissions')
            ->whereIn('id', [50, 51, 52, 60])
            ->update(['parent_id' => 59, 'is_show' => 1]);
    }
}
