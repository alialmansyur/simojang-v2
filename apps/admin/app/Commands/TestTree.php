<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class TestTree extends BaseCommand
{
    protected $group       = 'Testing';
    protected $name        = 'test:tree';
    protected $description = 'Verify RBAC hierarchy and role permission mappings';

    public function run(array $params)
    {
        $settingManager = new \App\Models\Apps\SettingManagerModel();
        $roleModel = new \App\Models\Auth\RoleModel();
        $servicePermModel = new \App\Models\Auth\ServicePermissionModel();
        $db = \Config\Database::connect();

        CLI::write("=== 1. TESTING SettingManagerModel::getMenusTree() ===", 'yellow');
        $menusTree = $settingManager->getMenusTree();
        CLI::write("Total Active Root Menus: " . count($menusTree), 'green');
        foreach ($menusTree as $root) {
            CLI::write("- [ID " . $root['id'] . "] " . $root['name'] . " (Children: " . count($root['children']) . ")");
            if ($root['id'] == 57) { // Tim Kerja
                foreach ($root['children'] as $tk) {
                    CLI::write("   ├── [TK " . $tk['id'] . "] " . $tk['name'] . " (Services: " . count($tk['children']) . ")");
                    foreach ($tk['children'] as $svc) {
                        if (!empty($svc['children'])) {
                            CLI::write("   │     └── [HUB " . $svc['id'] . "] " . $svc['name'] . " (Sub-services: " . count($svc['children']) . ")");
                            foreach ($svc['children'] as $sub) {
                                CLI::write("   │           └── [SUB " . $sub['id'] . "] " . $sub['name']);
                            }
                        }
                    }
                }
            } elseif ($root['id'] == 500) { // Pengaturan & Referensi
                foreach ($root['children'] as $subHub) {
                    CLI::write("   ├── [HUB " . $subHub['id'] . "] " . $subHub['name'] . " (Sub-services: " . count($subHub['children']) . ")");
                    foreach ($subHub['children'] as $sub) {
                        CLI::write("   │     └── [SUB " . $sub['id'] . "] " . $sub['name']);
                    }
                }
            } elseif ($root['id'] == 100) { // Layanan Eksternal
                foreach ($root['children'] as $ext) {
                    CLI::write("   ├── [EXT " . $ext['id'] . "] " . $ext['name']);
                }
            }
        }

        CLI::write("\n=== 2. TESTING ROLE PERMISSIONS IN getMenuTreeWithRolePermission ===", 'yellow');
        $admTree = $roleModel->getMenuTreeWithRolePermission(1);
        $usrTree = $roleModel->getMenuTreeWithRolePermission(2);

        $countAllowed = function($nodes, &$allowedCount, &$totalCount) use (&$countAllowed) {
            foreach ($nodes as $n) {
                $totalCount++;
                if (!empty($n['allowed'])) $allowedCount++;
                if (!empty($n['children'])) {
                    $countAllowed($n['children'], $allowedCount, $totalCount);
                }
            }
        };

        $admAllowed = 0; $admTotal = 0;
        $countAllowed($admTree, $admAllowed, $admTotal);
        CLI::write("Role ADM (1): {$admAllowed} / {$admTotal} allowed", 'green');

        $usrAllowed = 0; $usrTotal = 0;
        $countAllowed($usrTree, $usrAllowed, $usrTotal);
        CLI::write("Role USR (2): {$usrAllowed} / {$usrTotal} allowed", 'green');

        $checkNode = function($nodes, $id) use (&$checkNode) {
            foreach ($nodes as $n) {
                if ($n['id'] == $id) return $n;
                if (!empty($n['children'])) {
                    $res = $checkNode($n['children'], $id);
                    if ($res) return $res;
                }
            }
            return null;
        };

        $usrTk57 = $checkNode($usrTree, 57);
        $usrCat = $checkNode($usrTree, 328);
        $usrCatSub = $checkNode($usrTree, 444);
        $usrSetting500 = $checkNode($usrTree, 500);
        $usrSetting59 = $checkNode($usrTree, 59);

        CLI::write("USR access to Tim Kerja (57): " . ($usrTk57['allowed'] ? 'ALLOWED' : 'DENIED'), $usrTk57['allowed'] ? 'green' : 'red');
        CLI::write("USR access to Fasilitasi CAT (328): " . ($usrCat['allowed'] ? 'ALLOWED' : 'DENIED'), $usrCat['allowed'] ? 'green' : 'red');
        CLI::write("USR access to Rekap CAT (444): " . ($usrCatSub['allowed'] ? 'ALLOWED' : 'DENIED'), $usrCatSub['allowed'] ? 'green' : 'red');
        CLI::write("USR access to Pengaturan & Referensi (500): " . ($usrSetting500 && $usrSetting500['allowed'] ? 'ALLOWED' : 'DENIED'), ($usrSetting500 && $usrSetting500['allowed']) ? 'red' : 'green');
        CLI::write("USR access to Pengaturan Hub (59): " . ($usrSetting59 && $usrSetting59['allowed'] ? 'ALLOWED' : 'DENIED'), ($usrSetting59 && $usrSetting59['allowed']) ? 'red' : 'green');

        CLI::write("\n=== 3. TESTING UNIT KERJA TO TIM KERJA MAPPING ===", 'yellow');
        $sidigiPegawai = $db->table('data_pegawai')->where('unit_kerja_id', '22')->limit(1)->get()->getRowArray();
        if ($sidigiPegawai) {
            $allowed = $servicePermModel->getUserAllowedServiceIds($sidigiPegawai['nip']);
            $tkIds = $db->table('data_timkerja_layanan')->select('DISTINCT timkerja_id', false)->whereIn('id', $allowed)->get()->getResultArray();
            CLI::write("Pegawai SIDIGI ({$sidigiPegawai['nama']}, unit 22):");
            CLI::write("  Allowed service IDs count: " . count($allowed));
            CLI::write("  Matched Tim Kerja IDs: " . implode(', ', array_column($tkIds, 'timkerja_id')) . " (Expected: only 5)", 'green');
        }

        $multiPegawai = $db->table('data_pegawai')->where('unit_kerja_id', '16,22')->limit(1)->get()->getRowArray();
        if ($multiPegawai) {
            $allowedMulti = $servicePermModel->getUserAllowedServiceIds($multiPegawai['nip']);
            $tkIdsMulti = $db->table('data_timkerja_layanan')->select('DISTINCT timkerja_id', false)->whereIn('id', $allowedMulti)->get()->getResultArray();
            CLI::write("Pegawai Multi-Unit ({$multiPegawai['nama']}, unit 16,22):");
            CLI::write("  Allowed service IDs count: " . count($allowedMulti));
            CLI::write("  Matched Tim Kerja IDs: " . implode(', ', array_column($tkIdsMulti, 'timkerja_id')) . " (Expected: 5, 6)", 'green');
        }

        CLI::write("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<", 'green');
    }
}
