<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RegisterExternalServicesAuthPermissions extends Migration
{
    public function up()
    {
        $db = $this->db;
        $now = date('Y-m-d H:i:s');

        // 1. Bersihkan record dummy/tidak aktif lama jika ada
        if ($db->tableExists('auth_permissions')) {
            $db->table('auth_permissions')
                ->whereIn('name', ['Portal Simanja', 'Portal Siolin'])
                ->where('is_show', 0)
                ->delete();
        }

        // 2. Daftarkan Parent Menu: "Layanan Eksternal"
        $parentRow = $db->table('auth_permissions')
            ->where('name', 'Layanan Eksternal')
            ->get()
            ->getRowArray();

        $parentId = 100;
        if ($parentRow) {
            $parentId = (int) $parentRow['id'];
            $db->table('auth_permissions')
                ->where('id', $parentId)
                ->update([
                    'url'         => '#',
                    'icon'        => 'bi bi-box-arrow-up-right',
                    'parent_id'   => null,
                    'is_show'     => 1,
                    'is_order'    => 10,
                    'is_external' => 1,
                ]);
        } else {
            $db->table('auth_permissions')->insert([
                'id'          => $parentId,
                'name'        => 'Layanan Eksternal',
                'url'         => '#',
                'icon'        => 'bi bi-box-arrow-up-right',
                'parent_id'   => null,
                'is_show'     => 1,
                'is_order'    => 10,
                'is_external' => 1,
            ]);
        }

        // 3. Daftarkan 6 Layanan Eksternal sebagai Child dari Parent
        $externalServices = [
            [
                'id'          => 101,
                'name'        => 'Dashboard Executive',
                'url'         => 'https://kanreg3.id/dashboard-executive/',
                'icon'        => 'bi bi-speedometer2',
                'parent_id'   => $parentId,
                'is_show'     => 1,
                'is_order'    => 1,
                'is_external' => 1,
            ],
            [
                'id'          => 102,
                'name'        => 'Dashboard Simanja',
                'url'         => 'https://kanreg3.id/simanja-dashboard/',
                'icon'        => 'bi bi-graph-up',
                'parent_id'   => $parentId,
                'is_show'     => 1,
                'is_order'    => 2,
                'is_external' => 1,
            ],
            [
                'id'          => 103,
                'name'        => 'Sikasep',
                'url'         => 'https://kanreg3.id/sikasep/login',
                'icon'        => 'bi bi-shield-check',
                'parent_id'   => $parentId,
                'is_show'     => 1,
                'is_order'    => 3,
                'is_external' => 1,
            ],
            [
                'id'          => 104,
                'name'        => 'Simanja',
                'url'         => 'https://kanreg3.id/simanja/',
                'icon'        => 'bi bi-briefcase',
                'parent_id'   => $parentId,
                'is_show'     => 1,
                'is_order'    => 4,
                'is_external' => 1,
            ],
            [
                'id'          => 105,
                'name'        => 'Siwaregtilu',
                'url'         => 'https://kanreg3.id/siwaregtilu/',
                'icon'        => 'bi bi-globe2',
                'parent_id'   => $parentId,
                'is_show'     => 1,
                'is_order'    => 5,
                'is_external' => 1,
            ],
            [
                'id'          => 106,
                'name'        => 'Siolin',
                'url'         => 'https://kanreg3.id/siolin/',
                'icon'        => 'bi bi-layers',
                'parent_id'   => $parentId,
                'is_show'     => 1,
                'is_order'    => 6,
                'is_external' => 1,
            ],
        ];

        $allPermIds = [$parentId];
        foreach ($externalServices as $svc) {
            $existing = $db->table('auth_permissions')
                ->groupStart()
                    ->where('id', $svc['id'])
                    ->orWhere('name', $svc['name'])
                    ->orWhere('url', $svc['url'])
                ->groupEnd()
                ->get()
                ->getRowArray();

            if ($existing) {
                $permId = (int) $existing['id'];
                $db->table('auth_permissions')
                    ->where('id', $permId)
                    ->update([
                        'name'        => $svc['name'],
                        'url'         => $svc['url'],
                        'icon'        => $svc['icon'],
                        'parent_id'   => $parentId,
                        'is_show'     => 1,
                        'is_order'    => $svc['is_order'],
                        'is_external' => 1,
                    ]);
                $allPermIds[] = $permId;
            } else {
                $db->table('auth_permissions')->insert($svc);
                $allPermIds[] = $svc['id'];
            }
        }

        // 4. Berikan Hak Akses ke Role ADM (Role ID 1) dan Role USR (Role ID 2)
        if ($db->tableExists('auth_role_permissions')) {
            // Role ADM: Full permissions (create, read, update, delete)
            foreach ($allPermIds as $pId) {
                $existsAdm = $db->table('auth_role_permissions')
                    ->where('role_id', 1)
                    ->where('permission_id', $pId)
                    ->countAllResults();

                if ($existsAdm > 0) {
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

                // Role USR: Read-only access
                $existsUsr = $db->table('auth_role_permissions')
                    ->where('role_id', 2)
                    ->where('permission_id', $pId)
                    ->countAllResults();

                if ($existsUsr > 0) {
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
                ->whereIn('id', [100, 101, 102, 103, 104, 105, 106])
                ->delete();
        }

        if ($db->tableExists('auth_role_permissions')) {
            $db->table('auth_role_permissions')
                ->whereIn('permission_id', [100, 101, 102, 103, 104, 105, 106])
                ->delete();
        }
    }
}
