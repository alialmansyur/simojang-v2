<?php

namespace App\Models\Apps;

use CodeIgniter\Model;

class MenuModel extends Model
{
    protected $DBGroup = 'default';
    protected $table = 'auth_users_permissions';

     
    public function __construct()
    {
        parent::__construct();
    }

    public function getMenusPermissions($userId)
    {
        $userId = (int) $userId;
        $roleId = $this->getRoleIdByUserId($userId);

        if ($roleId > 0 && $this->tableExists('auth_role_permissions')) {
            $sql = "SELECT b.*, a.is_create, a.is_read, a.is_update, a.is_delete
                    FROM auth_role_permissions a
                    INNER JOIN auth_permissions b ON b.id = a.permission_id
                    WHERE a.role_id = ?
                      AND b.parent_id IS NULL
                      AND b.is_show <> 0
                      AND COALESCE(a.is_read, 0) = 1
                    ORDER BY b.is_order ASC";
            $results = $this->db->query($sql, [$roleId])->getResultArray();
            if (!empty($results)) {
                return $results;
            }
        }

        // Fallback ke auth_users_permissions
        $sql = "SELECT b.*, a.is_create, a.is_read, a.is_update, a.is_delete
                FROM auth_users_permissions a
                INNER JOIN auth_permissions b ON b.id = a.permission_id
                WHERE a.user_id = ?
                  AND b.parent_id IS NULL
                  AND b.is_show <> 0
                  AND COALESCE(a.is_read, 0) = 1
                ORDER BY b.is_order ASC";
        return $this->db->query($sql, [$userId])->getResultArray();
    }

    public function getSubMenus($parentId, ?int $userId = null)
    {
        if ($userId !== null) {
            $roleId = $this->getRoleIdByUserId((int) $userId);
            if ($roleId > 0 && $this->tableExists('auth_role_permissions')) {
                $sql = "SELECT p.*
                        FROM auth_role_permissions rp
                        INNER JOIN auth_permissions p ON p.id = rp.permission_id
                        WHERE rp.role_id = ?
                          AND p.parent_id = ?
                          AND p.is_show <> 0
                          AND COALESCE(rp.is_read, 0) = 1
                        ORDER BY p.is_order ASC";
                $results = $this->db->query($sql, [$roleId, (int) $parentId])->getResultArray();
                if (!empty($results)) {
                    return $results;
                }
            }

            // Fallback ke auth_users_permissions
            $sql = "SELECT p.*
                    FROM auth_users_permissions up
                    INNER JOIN auth_permissions p ON p.id = up.permission_id
                    WHERE up.user_id = ?
                      AND p.parent_id = ?
                      AND p.is_show <> 0
                      AND COALESCE(up.is_read, 0) = 1
                    ORDER BY p.is_order ASC";
            return $this->db->query($sql, [(int) $userId, (int) $parentId])->getResultArray();
        }

        $sql = "SELECT * FROM auth_permissions a WHERE parent_id = ? AND is_show <> 0 ORDER BY is_order ASC";
        return $this->db->query($sql, [(int) $parentId])->getResultArray();
    }

    public function getAllSubMenus(?int $userId = null)
    {
        if ($userId !== null) {
            $roleId = $this->getRoleIdByUserId((int) $userId);
            if ($roleId > 0 && $this->tableExists('auth_role_permissions')) {
                $sql = "SELECT p.*
                        FROM auth_role_permissions rp
                        INNER JOIN auth_permissions p ON p.id = rp.permission_id
                        WHERE rp.role_id = ?
                          AND p.parent_id IS NOT NULL
                          AND p.is_show <> 0
                          AND COALESCE(rp.is_read, 0) = 1
                        ORDER BY p.is_order ASC";
                $results = $this->db->query($sql, [$roleId])->getResultArray();
                if (!empty($results)) {
                    return $results;
                }
            }

            // Fallback ke auth_users_permissions
            $sql = "SELECT p.*
                    FROM auth_users_permissions up
                    INNER JOIN auth_permissions p ON p.id = up.permission_id
                    WHERE up.user_id = ?
                      AND p.parent_id IS NOT NULL
                      AND p.is_show <> 0
                      AND COALESCE(up.is_read, 0) = 1
                    ORDER BY p.is_order ASC";
            return $this->db->query($sql, [(int) $userId])->getResultArray();
        }

        $sql = "SELECT * FROM auth_permissions WHERE parent_id IS NOT NULL AND is_show <> 0 ORDER BY is_order ASC";
        return $this->db->query($sql)->getResultArray();
    }

    public function getPermissions($userId, $menuId)
    {
        $userId = (int) $userId;
        $menuId = (int) $menuId;

        if ($menuId <= 0) {
            return [];
        }

        $roleId = $this->getRoleIdByUserId($userId);
        if ($roleId > 0 && $this->tableExists('auth_role_permissions')) {
            $sql = "SELECT permission_id, is_create, is_read, is_update, is_delete 
                    FROM auth_role_permissions WHERE role_id = ? AND permission_id = ?";
            $permissions = $this->db->query($sql, [$roleId, $menuId])->getResultArray();
            if (!empty($permissions)) {
                $formatted = [];
                foreach ($permissions as $perm) {
                    $formatted = [
                        'create' => $perm['is_create'],
                        'update' => $perm['is_update'],
                        'delete' => $perm['is_delete'],
                        'view'   => $perm['is_read'],
                    ];
                }
                return $formatted;
            }
        }

        // Fallback
        $sql = "SELECT permission_id, is_create, is_read, is_update, is_delete 
                FROM auth_users_permissions WHERE user_id = ? AND permission_id = ?";
        $permissions = $this->db->query($sql, [$userId, $menuId])->getResultArray();
        $formatted = [];
        foreach ($permissions as $perm) {
            $formatted = [
                'create' => $perm['is_create'],
                'update' => $perm['is_update'],
                'delete' => $perm['is_delete'],
                'view'   => $perm['is_read'],
            ];
        }
        return $formatted;
    }

    public function findPermissionIdByUrl(string $url): ?int
    {
        $normalizedUrl = trim($url, '/');
        if ($normalizedUrl === '') {
            return null;
        }

        $row = $this->db->table('auth_permissions')
            ->select('id')
            ->where('url', $normalizedUrl)
            ->limit(1)
            ->get()
            ->getRowArray();

        if (empty($row) && ($normalizedUrl === 'dashboard' || $normalizedUrl === 'home')) {
            $fallbackUrl = ($normalizedUrl === 'dashboard') ? 'home' : 'dashboard';
            $row = $this->db->table('auth_permissions')
                ->select('id')
                ->where('url', $fallbackUrl)
                ->limit(1)
                ->get()
                ->getRowArray();
        }

        return isset($row['id']) ? (int) $row['id'] : null;
    }

    public function getRoleIdByUserId(int $userId): int
    {
        if ($userId <= 0) {
            return 0;
        }

        $user = $this->db->table('auth_users')
            ->select('role')
            ->where('id', $userId)
            ->limit(1)
            ->get()
            ->getRowArray();

        if (!$user || empty($user['role'])) {
            return 0;
        }

        if (!$this->tableExists('auth_roles')) {
            return 0;
        }

        $role = $this->db->table('auth_roles')
            ->select('id')
            ->where('role_code', strtoupper(trim((string) $user['role'])))
            ->where('is_active', 1)
            ->limit(1)
            ->get()
            ->getRowArray();

        return isset($role['id']) ? (int) $role['id'] : 0;
    }

    public function tableExists(string $tableName): bool
    {
        return in_array($tableName, $this->db->listTables(), true);
    }

    /**
     * Membangun hierarki navigasi dinamis lengkap berbasis hak akses RBAC dan tabel master
     *
     * @param int $userId
     * @return array
     */
    public function getFullNavigationForUser(int $userId): array
    {
        $rootMenus = $this->getMenusPermissions($userId);
        $allSubmenus = $this->getAllSubMenus($userId);

        $submenusByParent = [];
        foreach ($allSubmenus as $sub) {
            $submenusByParent[(int) $sub['parent_id']][] = $sub;
        }

        $formattedNav = [];
        $hasTimKerja = false;

        foreach ($rootMenus as $menu) {
            $menuId = (int) $menu['id'];
            $rawUrl = trim((string) ($menu['url'] ?? ''));
            $name = trim((string) ($menu['name'] ?? ''));
            $icon = $this->mapIconToLucide($menu['icon'] ?? '');

            if ($rawUrl === 'timkerja' || strtolower($name) === 'tim kerja') {
                $hasTimKerja = true;
                continue;
            }

            $subs = $submenusByParent[$menuId] ?? [];
            if (!empty($subs)) {
                $children = [];
                foreach ($subs as $sub) {
                    $subUrl = trim((string) ($sub['url'] ?? ''));
                    $isExternal = ((int) ($sub['is_external'] ?? 0) === 1) || str_starts_with($subUrl, 'http://') || str_starts_with($subUrl, 'https://');
                    $children[] = [
                        'id' => 'menu-' . $sub['id'],
                        'title' => $sub['name'],
                        'path' => $isExternal ? $subUrl : $this->normalizeMenuPath($subUrl),
                        'raw_url' => $subUrl,
                        'is_external' => $isExternal,
                        'target_url' => $isExternal ? $subUrl : null,
                    ];
                }

                $isParentExt = ((int) ($menu['is_external'] ?? 0) === 1) || str_starts_with($rawUrl, 'http://') || str_starts_with($rawUrl, 'https://');
                $formattedNav[] = [
                    'id' => 'menu-' . $menuId,
                    'title' => $name,
                    'icon' => $icon,
                    'children' => $children,
                    'is_external' => $isParentExt,
                ];
            } else {
                $isExternal = ((int) ($menu['is_external'] ?? 0) === 1) || str_starts_with($rawUrl, 'http://') || str_starts_with($rawUrl, 'https://');
                $formattedNav[] = [
                    'id' => 'menu-' . $menuId,
                    'title' => $name,
                    'path' => $isExternal ? $rawUrl : $this->normalizeMenuPath($rawUrl),
                    'icon' => $icon,
                    'raw_url' => $rawUrl,
                    'is_external' => $isExternal,
                    'target_url' => $isExternal ? $rawUrl : null,
                ];
            }
        }

        $userRow = $this->db->table('auth_users')
            ->select('username, role')
            ->where('id', $userId)
            ->limit(1)
            ->get()
            ->getRowArray();

        $roleCode = strtoupper(trim((string) ($userRow['role'] ?? 'USR')));
        $isAdmin = ($roleCode === 'ADM');
        $nip = trim((string) ($userRow['username'] ?? ''));

        // Sisipkan Tim Kerja hanya jika role berhak (ADM atau punya izin timkerja)
        // dan saring daftar layanan berdasarkan ServicePermissionModel untuk non-ADM
        if ($isAdmin || $hasTimKerja) {
            $allowedServiceIds = null;
            if (!$isAdmin) {
                $servicePermModel = new \App\Models\Auth\ServicePermissionModel();
                $allowedServiceIds = $nip !== '' ? $servicePermModel->getUserAllowedServiceIds($nip) : [];
            }

            $timKerjaNav = $this->getTimKerjaNavigation($allowedServiceIds);
            if (!empty($timKerjaNav)) {
                $insertIndex = 1;
                foreach ($formattedNav as $idx => $item) {
                    if (isset($item['path']) && ($item['path'] === '/dashboard' || $item['path'] === '/')) {
                        $insertIndex = $idx + 1;
                        break;
                    }
                }

                $timKerjaSection = array_merge([
                    [
                        'id' => 'header-timkerja',
                        'title' => 'Tim Kerja Layanan',
                        'isHeader' => true,
                    ]
                ], $timKerjaNav);

                array_splice($formattedNav, $insertIndex, 0, $timKerjaSection);
            }
        }

        return $formattedNav;
    }

    /**
     * Mengambil struktur menu Tim Kerja beserta layanan aktifnya.
     * Jika $allowedServiceIds bernilai array, hanya layanan pada daftar tersebut yang dikembalikan.
     *
     * @param list<int>|null $allowedServiceIds
     * @return array
     */
    public function getTimKerjaNavigation(?array $allowedServiceIds = null): array
    {
        if (!$this->tableExists('data_timkerja') || !$this->tableExists('data_timkerja_layanan')) {
            return [];
        }

        if (is_array($allowedServiceIds) && empty($allowedServiceIds)) {
            return [];
        }

        $allowedLookup = is_array($allowedServiceIds)
            ? array_flip(array_map('intval', $allowedServiceIds))
            : null;

        $timKerja = $this->db->table('data_timkerja')
            ->where('is_show', 1)
            ->orderBy('nama', 'ASC')
            ->get()
            ->getResultArray();

        $layanan = $this->db->table('data_timkerja_layanan')
            ->where('is_show', 1)
            ->orderBy('timkerja_id ASC, nama_layanan ASC')
            ->get()
            ->getResultArray();

        $layananByTk = [];
        foreach ($layanan as $l) {
            $layananByTk[(int) $l['timkerja_id']][] = $l;
        }

        $tkIcons = [
            'pnm'    => 'UserCheck',
            'snp'    => 'ShieldAlert',
            'pmasn'  => 'Award',
            'pnp'    => 'FileCheck2',
            'sidigi' => 'Cpu',
            'tu'     => 'Building2',
        ];

        $tkNames = [
            'pnm'    => 'Pengangkatan & Mutasi',
            'snp'    => 'Status & Pemberhentian',
            'pmasn'  => 'Pembinaan Manajemen ASN',
            'pnp'    => 'Pengawasan & Pengendalian',
            'sidigi' => 'Sistem Informasi & TI',
            'tu'     => 'Tata Usaha',
        ];

        $nav = [];
        foreach ($timKerja as $tk) {
            $tkId = (int) $tk['id'];
            $code = strtolower(trim((string) $tk['code']));
            $nama = trim((string) $tk['nama']);
            $icon = $tkIcons[$code] ?? 'Briefcase';

            // Sederhanakan nama Tim Kerja agar rapi dan tidak terpotong (ellipsis) pada sidebar UI
            $title = $tkNames[$code] ?? null;
            if (!$title) {
                $title = preg_replace('/^Tim Kerja\s+/i', '', $nama);
                $title = preg_replace('/\s+dan\s+/i', ' & ', $title);
                $title = str_ireplace(['Bagian Tata Usaha Kanreg', 'Bagian Tata Usaha'], 'Tata Usaha', $title);
            }

            $subServices = [];

            foreach ($layananByTk[$tkId] ?? [] as $svc) {
                $svcId = (int) ($svc['id'] ?? 0);
                if ($allowedLookup !== null && !isset($allowedLookup[$svcId])) {
                    continue;
                }

                $rawUrl = trim((string) ($svc['url'] ?? ''));
                $slug = str_replace(['apps-', 'apps_'], '', strtolower($rawUrl));
                if (empty($slug)) {
                    $slug = 'layanan-' . $svc['id'];
                }

                $descriptiveSlugMap = [
                    'kp' => 'kenaikan-pangkat',
                    'pg' => 'pencantuman-gelar',
                    'tapnip' => 'penetapan-nip',
                    'pmk' => 'peninjauan-masa-kerja',
                    'pi' => 'pindah-instansi',
                    'merit' => 'sistem-merit',
                    'nspk' => 'indeks-nspk',
                    'wasdal' => 'wasdal-netralitas',
                    'mt' => 'manajemen-talenta',
                    'pembinaan-kinerja' => 'pembinaan-kinerja',
                    'pembinaan-kompetensi-karier' => 'pengembangan-kompetensi',
                    'pembinaan-disiplin-budaya-citra' => 'disiplin-budaya-citra',
                    'kompetensi' => 'penilaian-kompetensi',
                    'karier' => 'penilaian-karier',
                    'cat' => 'fasilitasi-cat',
                    'statistik' => 'statistik-pegawai',
                    'statistik-asn' => 'statistik-pegawai',
                    'pdm' => 'peremajaan-data',
                    'dispa' => 'disparitas-data',
                    'disparitas' => 'disparitas-data',
                    'integrasi' => 'integrasi-siasn',
                    'takah' => 'arsip-takah',
                    'dms' => 'arsip-dms',
                    'pnbp' => 'pnbp-cat',
                    'pnbp-dokumen' => 'pnbp-cat',
                    'dokumen-pnbp' => 'pnbp-cat',
                    'aset' => 'manage-assets',
                    'proyek' => 'manage-project',
                ];
                $slug = $descriptiveSlugMap[$slug] ?? $slug;

                $subServices[] = [
                    'id' => 'svc-' . $svc['id'],
                    'title' => $svc['nama_layanan'],
                    'path' => '/layanan/' . $slug,
                    'raw_url' => $rawUrl,
                    'service_id' => (int) $svc['id'],
                    'is_maintenance' => (int) ($svc['is_maintenance'] ?? 0),
                    'maintenance_msg' => $svc['maintenance_msg'] ?? null,
                ];
            }

            if (empty($subServices)) {
                continue;
            }

            $nav[] = [
                'id' => 'tk-' . $code,
                'title' => $title,
                'icon' => $icon,
                'children' => $subServices,
            ];
        }

        usort($nav, fn($a, $b) => strcmp($a['title'], $b['title']));

        return $nav;
    }

    private function mapIconToLucide(?string $icon): string
    {
        if (empty($icon)) return 'Circle';
        $icon = strtolower(trim($icon));
        if (str_contains($icon, 'grid') || str_contains($icon, 'home')) return 'LayoutDashboard';
        if (str_contains($icon, 'calendar')) return 'Calendar';
        if (str_contains($icon, 'camera') || str_contains($icon, 'image')) return 'Image';
        if (str_contains($icon, 'chat') || str_contains($icon, 'person') || str_contains($icon, 'user')) return 'Users';
        if (str_contains($icon, 'gear') || str_contains($icon, 'setting')) return 'Settings';
        if (str_contains($icon, 'slider')) return 'Sliders';
        if (str_contains($icon, 'mail') || str_contains($icon, 'envelope')) return 'Mail';
        if (str_contains($icon, 'table')) return 'Table';
        if (str_contains($icon, 'stack') || str_contains($icon, 'layer') || str_contains($icon, 'window')) return 'Layers';
        if (str_contains($icon, 'file')) return 'FileText';
        if (str_contains($icon, 'collection') || str_contains($icon, 'folder')) return 'FolderKanban';
        if (str_contains($icon, 'box-arrow') || str_contains($icon, 'link') || str_contains($icon, 'globe') || str_contains($icon, 'web')) return 'ExternalLink';
        if (str_contains($icon, 'speedometer')) return 'Gauge';
        if (str_contains($icon, 'graph')) return 'LineChart';
        if (str_contains($icon, 'shield') || str_contains($icon, 'lock')) return 'ShieldCheck';
        if (str_contains($icon, 'briefcase')) return 'Briefcase';
        return 'Circle';
    }

    private function normalizeMenuPath(string $rawUrl): string
    {
        if (str_starts_with($rawUrl, 'http://') || str_starts_with($rawUrl, 'https://')) {
            return $rawUrl;
        }
        $normalized = trim($rawUrl, '/');
        if ($normalized === '' || $normalized === '#') {
            return '/';
        }
        if ($normalized === 'home' || $normalized === 'dashboard') {
            return '/dashboard';
        }
        $serviceMap = [
            'apps-kp' => '/layanan/kenaikan-pangkat',
            'kp' => '/layanan/kenaikan-pangkat',
            'apps-pg' => '/layanan/pencantuman-gelar',
            'pg' => '/layanan/pencantuman-gelar',
            'apps-tapnip' => '/layanan/penetapan-nip',
            'tapnip' => '/layanan/penetapan-nip',
            'apps-pmk' => '/layanan/peninjauan-masa-kerja',
            'pmk' => '/layanan/peninjauan-masa-kerja',
            'apps-pi' => '/layanan/pindah-instansi',
            'pi' => '/layanan/pindah-instansi',
        ];
        if (isset($serviceMap[$normalized])) {
            return $serviceMap[$normalized];
        }
        if (str_starts_with($normalized, 'manage-user') || str_starts_with($normalized, 'manage-pegawai')) {
            return '/settings/users';
        }
        if (str_starts_with($normalized, 'manage-role')) {
            return '/settings/roles';
        }
        if (str_starts_with($normalized, 'manage-layanan') || str_starts_with($normalized, 'manage-service')) {
            return '/settings/services';
        }
        if (str_starts_with($normalized, 'manage-setting') || str_starts_with($normalized, 'manage-smtp')) {
            return '/settings/system';
        }
        if (str_starts_with($normalized, 'manage-log')) {
            return '/settings/audit';
        }
        if (str_starts_with($normalized, 'manage-instansi') || str_starts_with($normalized, 'manage-iku') || str_starts_with($normalized, 'ref')) {
            return '/settings/referensi';
        }
        return '/' . $normalized;
    }
}
