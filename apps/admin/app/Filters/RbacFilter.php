<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class RbacFilter implements FilterInterface
{
    /**
     * Resolve parent permission URLs for administrative API/action routes
     * that are not directly registered as sidebar menu items.
     *
     * @return array{strictAdmin: bool, permissionUrls: list<string>}
     */
    private function resolveAccessRequirement(string $path): array
    {
        $strictAdminPrefixes = [
            'download/database-backup',
            'download/schema-rebuild-090326',
            'execute/schema-rebuild-090326',
            'audit/database-schema-090326',
            'migrate/database-schema-090326',
        ];
        foreach ($strictAdminPrefixes as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return ['strictAdmin' => true, 'permissionUrls' => []];
            }
        }

        if ($path === 'api/services/maintenance-status' || $path === 'api/public/maintenance-status') {
            return ['strictAdmin' => false, 'permissionUrls' => []];
        }

        $prefixMap = [
            'api/manage-role'            => ['manage-role'],
            'api/manage-user'            => ['manage-user'],
            'api/manage-setting'         => ['manage-setting'],
            'store/system-setting'       => ['manage-setting'],
            'api/manage-smtp'            => ['manage-smtp'],
            'store/smtp-setting'         => ['manage-smtp'],
            'api/manage-layanan'         => ['manage-layanan', 'manage-service'],
            'api/manage-service'         => ['manage-service', 'manage-layanan'],
            'api/manage-log'             => ['manage-log'],
            'setting/service'            => ['manage-layanan', 'manage-service'],
            'api/menus'                  => ['manage-role', 'manage-service'],
            'api/users'                  => ['manage-user', 'manage-role'],
            'api/services'               => ['manage-service', 'manage-layanan'],
            'api/ref'                    => ['ref'],
            'store/pull-datalist-pegawai'  => ['manage-pegawai', 'manage-user'],
            'store/pull-datalist-instansi' => ['manage-instansi', 'ref/instansi'],
        ];

        foreach ($prefixMap as $prefix => $urls) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return ['strictAdmin' => false, 'permissionUrls' => $urls];
            }
        }

        return ['strictAdmin' => false, 'permissionUrls' => [$path]];
    }

    public function before(RequestInterface $request, $arguments = null)
    {
        $userId = (int) session()->get('userid');

        if ($userId <= 0) {
            return service('response')
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
                ->setJSON([
                    'code'    => 401,
                    'status'  => 'error',
                    'message' => 'Sesi masuk Anda tidak valid atau telah berakhir. Silakan masuk kembali.',
                ]);
        }

        $path = trim($request->getUri()->getPath(), '/');
        if ($path === '') {
            return;
        }

        // Dashboard, Kalender Kegiatan, Galeri Kegiatan, dan status maintenance dapat diakses oleh semua role yang login
        $publicAuthenticatedPrefixes = [
            'dashboard',
            'api/dashboard',
            'calendar-event',
            'api/calendar-event',
            'activity-gallery',
            'api/services/maintenance-status',
            'api/public/maintenance-status',
            'api/user/menus',
        ];
        foreach ($publicAuthenticatedPrefixes as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return;
            }
        }

        $db = db_connect();
        $user = $db->table('auth_users')
            ->select('role')
            ->where('id', $userId)
            ->limit(1)
            ->get()
            ->getRowArray();

        $roleCode = strtoupper(trim((string) ($user['role'] ?? 'USR')));
        if ($roleCode === 'ADM') {
            return;
        }

        $requirement = $this->resolveAccessRequirement($path);
        if ($requirement['strictAdmin']) {
            return $this->denyAccess();
        }

        $permissions = $db->table('auth_permissions')
            ->select('id, url')
            ->whereIn('url', $requirement['permissionUrls'])
            ->get()
            ->getResultArray();

        // Jika endpoint memang bukan halaman/aksi manajemen dan tidak terdaftar di auth_permissions
        $isManagedPrefix = $requirement['permissionUrls'] !== [$path];
        if (empty($permissions)) {
            if ($isManagedPrefix) {
                return $this->denyAccess();
            }
            return;
        }

        $permissionIds = array_map(static fn ($row) => (int) $row['id'], $permissions);
        $method = strtoupper((string) $request->getMethod());
        $requiredColumn = 'is_read';
        if ($isManagedPrefix) {
            if ($method === 'DELETE' || str_contains($path, '/delete') || str_contains($path, '/remove') || str_contains($path, '/unassign') || str_contains($path, '/kill')) {
                $requiredColumn = 'is_delete';
            } elseif ($method === 'PUT' || $method === 'PATCH' || str_contains($path, '/update')) {
                $requiredColumn = 'is_update';
            } elseif ($method === 'POST' && !str_contains($path, '/datatable') && !str_ends_with($path, '/get-data') && !str_ends_with($path, '/get-layanan')) {
                // Untuk /store, /create, /assign, /toggle, /reset, /copy, /save, /test, /sync
                $requiredColumn = str_contains($path, '/create') || str_contains($path, '/store') ? 'is_create' : 'is_update';
            }
        }

        // Cek izin via auth_role_permissions
        $tables = $db->listTables();
        if (in_array('auth_role_permissions', $tables, true) && in_array('auth_roles', $tables, true)) {
            $rolePermit = $db->table('auth_role_permissions rp')
                ->select("rp.{$requiredColumn}")
                ->join('auth_roles r', 'r.id = rp.role_id', 'inner')
                ->where('r.role_code', $roleCode)
                ->where('r.is_active', 1)
                ->whereIn('rp.permission_id', $permissionIds)
                ->where("rp.{$requiredColumn}", 1)
                ->limit(1)
                ->get()
                ->getRowArray();

            if (!empty($rolePermit)) {
                return;
            }
        }

        // Fallback ke auth_users_permissions
        $permit = $db->table('auth_users_permissions')
            ->select($requiredColumn)
            ->where('user_id', $userId)
            ->whereIn('permission_id', $permissionIds)
            ->where($requiredColumn, 1)
            ->limit(1)
            ->get()
            ->getRowArray();

        if (!empty($permit)) {
            return;
        }

        return $this->denyAccess();
    }

    private function denyAccess(): ResponseInterface
    {
        return service('response')
            ->setStatusCode(403)
            ->setJSON([
                'code'    => 403,
                'status'  => 'error',
                'message' => 'Anda tidak memiliki hak akses untuk fitur ini.',
            ]);
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
