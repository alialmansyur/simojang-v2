<?php

namespace App\Models\Apps;

use CodeIgniter\Model;
use Throwable;

class RefModel extends Model
{
    private const AUTO_PREFIXES = [
        'data_support_' => '',
        'data_pegawai_' => 'pegawai_',
        'data_master_'  => 'master_',
    ];

    private const EXTRA_TABLES = [
        'instansi' => [
            'table'       => 'data_instansi',
            'label'       => 'Data Instansi Wilayah',
            'description' => 'Master kode instansi pemerintah, kanreg, dan wilayah kerja.',
            'category'    => 'kelembagaan',
        ],
        'pegawai' => [
            'table'       => 'data_pegawai',
            'label'       => 'Data Master Pegawai',
            'description' => 'Master biodata, NIP, jabatan, golongan, dan unit kerja ASN internal.',
            'category'    => 'kepegawaian',
        ],
        'timkerja' => [
            'table'       => 'data_timkerja',
            'label'       => 'Master Tim Kerja',
            'description' => 'Struktur tim kerja utama beserta kode dan urutan tampilan.',
            'category'    => 'kelembagaan',
        ],
        'layanan' => [
            'table'       => 'data_layanan',
            'label'       => 'Master Layanan & IKU',
            'description' => 'Daftar master layanan, SS/IKU, bidang pengampu, dan kategori.',
            'category'    => 'kelembagaan',
        ],
        'asset_categories' => [
            'table'       => 'data_asset_categories',
            'label'       => 'Kategori Aset Kantor',
            'description' => 'Referensi pengelompokan inventaris barang dan aset BMN.',
            'category'    => 'operasional',
        ],
        'pnbp_doc_types' => [
            'table'       => 'data_pnbp_doc_types',
            'label'       => 'Jenis Dokumen PNBP',
            'description' => 'Referensi kategori dan jenis dokumen fasilitasi PNBP CAT.',
            'category'    => 'operasional',
        ],
        'ikk_sasaran' => [
            'table'       => 'data_ikk_sasaran',
            'label'       => 'IKK Sasaran Strategis',
            'description' => 'Referensi sasaran strategis perjanjian kinerja BKN.',
            'category'    => 'perencanaan',
        ],
        'ikk_indikator' => [
            'table'       => 'data_ikk_indikator',
            'label'       => 'IKK Indikator Kinerja',
            'description' => 'Referensi indikator kinerja kegiatan beserta satuan dan target.',
            'category'    => 'perencanaan',
        ],
        'ikk_kegiatan' => [
            'table'       => 'data_ikk_kegiatan',
            'label'       => 'IKK Daftar Kegiatan',
            'description' => 'Referensi sub-kegiatan dan target volume capaian IKK.',
            'category'    => 'perencanaan',
        ],
        'ikk_pengampu' => [
            'table'       => 'data_ikk_pengampu',
            'label'       => 'IKK Pengampu Tim Kerja',
            'description' => 'Pemetaan pengampu indikator atau kegiatan pada masing-masing tim kerja.',
            'category'    => 'perencanaan',
        ],
    ];

    private const CATEGORY_LABELS = [
        'support'     => 'Referensi Layanan & Dukungan',
        'kepegawaian' => 'Referensi Kepegawaian ASN',
        'kelembagaan' => 'Instansi & Kelembagaan',
        'perencanaan' => 'Perencanaan & IKK',
        'operasional' => 'Operasional & Aset',
    ];

    private const RESERVED_COLUMNS = [
        'created_at', 'updated_at', 'deleted_at',
        'created_by', 'updated_by', 'deleted_by',
        'update_at',
    ];

    private array $schemaCache = [];
    private ?array $catalogCache = null;

    /**
     * Katalog lengkap tabel referensi/master yang ditemukan otomatis dari DB + EXTRA_TABLES.
     * Tabel baru berawalan data_support_*, data_pegawai_*, atau data_master_* otomatis terdeteksi.
     */
    public function getTableCatalog(): array
    {
        if ($this->catalogCache !== null) {
            return $this->catalogCache;
        }

        $tableRows = $this->db->query(
            "SELECT table_name, table_rows
             FROM information_schema.tables
             WHERE table_schema = ?
               AND table_type = 'BASE TABLE'
               AND table_name LIKE 'data\\_%'
             ORDER BY table_name ASC",
            [$this->db->database]
        )->getResultArray();

        $existingMap = [];
        foreach ($tableRows as $row) {
            $name = (string) $row['table_name'];
            $existingMap[$name] = (int) ($row['table_rows'] ?? 0);
        }

        $catalog = [];

        // 1. Auto-discovery berdasarkan prefix standar
        foreach (array_keys($existingMap) as $tableName) {
            foreach (self::AUTO_PREFIXES as $prefix => $slugPrefix) {
                if (!str_starts_with($tableName, $prefix)) {
                    continue;
                }
                $suffix = substr($tableName, strlen($prefix));
                if ($suffix === '') {
                    continue;
                }
                $slug = $slugPrefix . $suffix;
                $category = match ($prefix) {
                    'data_pegawai_' => 'kepegawaian',
                    'data_master_'  => 'operasional',
                    default         => 'support',
                };
                $catalog[$slug] = [
                    'slug'           => $slug,
                    'table'          => $tableName,
                    'label'          => $this->formatTableLabel($tableName, $prefix),
                    'description'    => $this->defaultDescription($tableName, $category),
                    'category'       => $category,
                    'category_label' => self::CATEGORY_LABELS[$category] ?? 'Referensi Lainnya',
                    'is_dynamic'     => true,
                ];
                break;
            }
        }

        // 2. Tabel master terkurasi
        foreach (self::EXTRA_TABLES as $slug => $meta) {
            $tableName = $meta['table'];
            if (!isset($existingMap[$tableName])) {
                continue;
            }
            $category = $meta['category'];
            $catalog[$slug] = [
                'slug'           => $slug,
                'table'          => $tableName,
                'label'          => $meta['label'],
                'description'    => $meta['description'],
                'category'       => $category,
                'category_label' => self::CATEGORY_LABELS[$category] ?? 'Master Lainnya',
                'is_dynamic'     => false,
            ];
        }

        uasort($catalog, static fn ($a, $b) => strcmp($a['label'], $b['label']));
        $this->catalogCache = $catalog;
        return $catalog;
    }

    public function getSupportTables(): array
    {
        return array_values(array_map(
            static fn ($item) => $item['table'],
            $this->getTableCatalog()
        ));
    }

    public function resolveTableBySlug(string $slug): ?string
    {
        $slug = strtolower(trim($slug));
        if ($slug === '' || preg_match('/^[a-z0-9_]+$/', $slug) !== 1) {
            return null;
        }

        $catalog = $this->getTableCatalog();
        if (isset($catalog[$slug])) {
            return $catalog[$slug]['table'];
        }

        // Fallback: jika pemanggil mengirim nama tabel langsung (mis. data_support_media)
        foreach ($catalog as $item) {
            if ($item['table'] === $slug) {
                return $item['table'];
            }
        }

        return null;
    }

    public function getAllowedTables(int $userId): array
    {
        $catalog = $this->getTableCatalog();
        if (empty($catalog)) {
            return [];
        }

        $accessContext = $this->resolveUserAccessContext($userId);
        $isAdmin = $accessContext['is_admin'];
        $hasWildcardRef = $accessContext['has_wildcard_ref'];
        $permByUrl = $accessContext['by_url'];

        // Metadata permission di DB untuk memperkaya label & icon bila terdaftar
        $dbPermMeta = [];
        $permRows = $this->db->table('auth_permissions')
            ->select('id, name, url, icon')
            ->where('url !=', '')
            ->get()
            ->getResultArray();
        foreach ($permRows as $p) {
            $dbPermMeta[strtolower(trim((string) $p['url'], '/'))] = $p;
        }

        $result = [];
        foreach ($catalog as $slug => $meta) {
            $table = $meta['table'];
            $permUrl = 'ref/' . $slug;
            $aliasUrls = $this->getAliasPermissionUrls($slug);

            $permRow = $permByUrl[$permUrl] ?? null;
            if ($permRow === null) {
                foreach ($aliasUrls as $alias) {
                    if (isset($permByUrl[$alias])) {
                        $permRow = $permByUrl[$alias];
                        break;
                    }
                }
            }

            $canRead = $isAdmin
                || $hasWildcardRef
                || (!empty($permRow) && (int) ($permRow['is_read'] ?? 0) === 1);

            if (!$canRead) {
                continue;
            }

            $canCreate = $isAdmin || (!empty($permRow) ? (int) ($permRow['is_create'] ?? 0) === 1 : $hasWildcardRef);
            $canUpdate = $isAdmin || (!empty($permRow) ? (int) ($permRow['is_update'] ?? 0) === 1 : $hasWildcardRef);
            $canDelete = $isAdmin || (!empty($permRow) ? (int) ($permRow['is_delete'] ?? 0) === 1 : $hasWildcardRef);

            // Jika role/user hanya memiliki flag read di auth_role_permissions / auth_users_permissions tanpa set CRUD,
            // ikuti pola legacy Simojang bahwa pengelola referensi dapat CRUD penuh saat diberikan akses menu ref/*
            if (!$isAdmin && $permRow !== null && !$canCreate && !$canUpdate && !$canDelete && $canRead) {
                $canCreate = true;
                $canUpdate = true;
                $canDelete = true;
            }

            $schema = $this->getSchema($table);
            $rowCount = $this->safeCountRows($table);
            $dbMeta = $dbPermMeta[$permUrl] ?? null;

            $result[] = [
                'permission_id'  => $dbMeta ? (int) $dbMeta['id'] : null,
                'table'          => $table,
                'slug'           => $slug,
                'label'          => !empty($dbMeta['name']) && $meta['is_dynamic'] && str_starts_with($table, 'data_support_')
                    ? (string) $dbMeta['name']
                    : $meta['label'],
                'description'    => $meta['description'],
                'category'       => $meta['category'],
                'category_label' => $meta['category_label'],
                'icon'           => (string) ($dbMeta['icon'] ?? 'bi bi-table'),
                'url'            => $permUrl,
                'pk'             => $schema['pk'],
                'row_count'      => $rowCount,
                'column_count'   => count($schema['columns']),
                'permissions'    => [
                    'read'   => true,
                    'create' => $canCreate,
                    'update' => $canUpdate,
                    'delete' => $canDelete,
                ],
            ];
        }

        return $result;
    }

    public function canUserAccessSlug(int $userId, string $slug, string $action = 'read'): bool
    {
        $slug = strtolower(trim($slug));
        if ($userId <= 0 || $slug === '' || $this->resolveTableBySlug($slug) === null) {
            return false;
        }

        $accessContext = $this->resolveUserAccessContext($userId);
        if ($accessContext['is_admin'] || $accessContext['has_wildcard_ref']) {
            return true;
        }

        $permByUrl = $accessContext['by_url'];
        $permUrl = 'ref/' . $slug;
        $permRow = $permByUrl[$permUrl] ?? null;
        if ($permRow === null) {
            foreach ($this->getAliasPermissionUrls($slug) as $alias) {
                if (isset($permByUrl[$alias])) {
                    $permRow = $permByUrl[$alias];
                    break;
                }
            }
        }

        if ($permRow === null || (int) ($permRow['is_read'] ?? 0) !== 1) {
            return false;
        }

        return match ($action) {
            'create' => true,
            'update' => true,
            'delete' => true,
            default  => true,
        };
    }

    public function getSchema(string $table): array
    {
        if (isset($this->schemaCache[$table])) {
            return $this->schemaCache[$table];
        }

        $rows = $this->db->query(
            "SELECT column_name, data_type, column_type, is_nullable, column_key, column_default, extra, ordinal_position
             FROM information_schema.columns
             WHERE table_schema = ? AND table_name = ?
             ORDER BY ordinal_position ASC",
            [$this->db->database, $table]
        )->getResultArray();

        $columns = [];
        $pk = null;
        foreach ($rows as $row) {
            $col = (string) $row['column_name'];
            $colLower = strtolower($col);
            $dataType = strtolower((string) $row['data_type']);
            $columnType = (string) ($row['column_type'] ?? '');
            $columnKey = (string) ($row['column_key'] ?? '');
            $extra = strtolower((string) ($row['extra'] ?? ''));

            $isPk = $columnKey === 'PRI';
            if ($isPk && $pk === null) {
                $pk = $col;
            }

            $isAuto = strpos($extra, 'auto_increment') !== false;
            $isReserved = in_array($colLower, self::RESERVED_COLUMNS, true);
            $isAutoUuid = in_array($colLower, ['uid', 'uuid'], true);
            $isWritable = !$isPk && !$isAuto && !$isReserved;

            $enumValues = [];
            if ($dataType === 'enum' && preg_match_all("/'((?:[^'\\\\]|\\\\.)*)'/", $columnType, $m)) {
                $enumValues = array_map(static fn ($v) => str_replace("\\'", "'", $v), $m[1]);
            }

            $maxLength = null;
            if (preg_match('/\((\d+)\)/', $columnType, $lenMatch) && in_array($dataType, ['varchar', 'char'], true)) {
                $maxLength = (int) $lenMatch[1];
            }

            $isStatusFlag = in_array($colLower, ['is_status', 'is_active', 'is_show', 'touch_support'], true);
            $inputType = $this->mapInputType($dataType, $colLower, $enumValues);

            $columns[] = [
                'name'          => $col,
                'label'         => ucwords(str_replace('_', ' ', $col)),
                'data_type'     => $dataType,
                'column_type'   => $columnType,
                'is_nullable'   => ((string) $row['is_nullable']) === 'YES',
                'is_pk'         => $isPk,
                'is_auto'       => $isAuto,
                'is_auto_uuid'  => $isAutoUuid,
                'is_status_flag'=> $isStatusFlag,
                'default'       => $row['column_default'],
                'is_writable'   => $isWritable,
                'input_type'    => $inputType,
                'enum_values'   => $enumValues,
                'max_length'    => $maxLength,
            ];
        }

        if ($pk === null) {
            foreach ($columns as $col) {
                if (strtolower($col['name']) === 'id') {
                    $pk = $col['name'];
                    break;
                }
            }
        }

        $searchable = [];
        foreach ($columns as $col) {
            if (in_array($col['data_type'], ['char', 'varchar', 'text', 'tinytext', 'mediumtext', 'longtext', 'enum'], true)) {
                $searchable[] = $col['name'];
            }
        }

        $schema = [
            'table'      => $table,
            'pk'         => $pk,
            'columns'    => $columns,
            'searchable' => $searchable,
        ];

        $this->schemaCache[$table] = $schema;
        return $schema;
    }

    public function getList(string $table, array $params): array
    {
        $schema = $this->getSchema($table);
        $pk = (string) ($schema['pk'] ?? 'id');

        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = (int) ($params['per_page'] ?? 10);
        if ($perPage <= 0) {
            $perPage = 10;
        }
        if ($perPage > 100) {
            $perPage = 100;
        }

        $search = trim((string) ($params['search'] ?? ''));
        $sortBy = trim((string) ($params['sort_by'] ?? $pk));
        $sortDir = strtolower((string) ($params['sort_dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';

        $allowedColumns = array_column($schema['columns'], 'name');
        if (!in_array($sortBy, $allowedColumns, true)) {
            $sortBy = $pk;
        }

        $builder = $this->db->table($table);
        if ($search !== '' && !empty($schema['searchable'])) {
            $builder->groupStart();
            foreach ($schema['searchable'] as $idx => $col) {
                if ($idx === 0) {
                    $builder->like($col, $search);
                } else {
                    $builder->orLike($col, $search);
                }
            }
            $builder->groupEnd();
        }

        $countBuilder = clone $builder;
        $total = (int) $countBuilder->countAllResults();

        $offset = ($page - 1) * $perPage;
        $rows = $builder
            ->orderBy($sortBy, $sortDir)
            ->limit($perPage, $offset)
            ->get()
            ->getResultArray();

        return [
            'rows' => $rows,
            'meta' => [
                'page'       => $page,
                'per_page'   => $perPage,
                'total'      => $total,
                'total_page' => max(1, (int) ceil($total / $perPage)),
                'sort_by'    => $sortBy,
                'sort_dir'   => strtolower($sortDir),
            ],
        ];
    }

    public function getRowById(string $table, string $pk, string $id): ?array
    {
        if ($pk === '' || $id === '') {
            return null;
        }

        $row = $this->db->table($table)
            ->where($pk, $id)
            ->limit(1)
            ->get()
            ->getRowArray();

        return $row ?: null;
    }

    public function insertRow(string $table, array $data): int
    {
        $schema = $this->getSchema($table);
        $payload = $this->buildWritablePayload($schema, $data, true);
        if (empty($payload)) {
            return 0;
        }
        $this->db->table($table)->insert($payload);
        return (int) $this->db->insertID();
    }

    public function updateRow(string $table, string $pk, string $id, array $data): bool
    {
        if ($pk === '') {
            return false;
        }
        $schema = $this->getSchema($table);
        $payload = $this->buildWritablePayload($schema, $data, false);
        if (empty($payload)) {
            return false;
        }

        return (bool) $this->db->table($table)
            ->where($pk, $id)
            ->update($payload);
    }

    public function deleteRow(string $table, string $pk, string $id): bool
    {
        if ($pk === '') {
            return false;
        }
        return (bool) $this->db->table($table)->where($pk, $id)->delete();
    }

    private function resolveUserAccessContext(int $userId): array
    {
        $user = $this->db->table('auth_users')
            ->select('role')
            ->where('id', $userId)
            ->limit(1)
            ->get()
            ->getRowArray();

        $roleCode = strtoupper(trim((string) ($user['role'] ?? 'USR')));
        $isAdmin = ($roleCode === 'ADM');

        if ($isAdmin) {
            return [
                'is_admin'         => true,
                'has_wildcard_ref' => true,
                'by_url'           => [],
            ];
        }

        $byUrl = [];

        // 1. Cek auth_role_permissions
        $tables = $this->db->listTables();
        if (in_array('auth_role_permissions', $tables, true) && in_array('auth_roles', $tables, true)) {
            $roleRows = $this->db->table('auth_role_permissions rp')
                ->select('p.url, rp.is_read, rp.is_create, rp.is_update, rp.is_delete')
                ->join('auth_roles r', 'r.id = rp.role_id', 'inner')
                ->join('auth_permissions p', 'p.id = rp.permission_id', 'inner')
                ->where('r.role_code', $roleCode)
                ->where('r.is_active', 1)
                ->get()
                ->getResultArray();

            foreach ($roleRows as $row) {
                $url = strtolower(trim((string) ($row['url'] ?? ''), '/'));
                if ($url !== '') {
                    $byUrl[$url] = $row;
                }
            }
        }

        // 2. Override / gabungkan dengan auth_users_permissions
        $userRows = $this->db->table('auth_users_permissions up')
            ->select('p.url, up.is_read, up.is_create, up.is_update, up.is_delete')
            ->join('auth_permissions p', 'p.id = up.permission_id', 'inner')
            ->where('up.user_id', $userId)
            ->get()
            ->getResultArray();

        foreach ($userRows as $row) {
            $url = strtolower(trim((string) ($row['url'] ?? ''), '/'));
            if ($url === '') {
                continue;
            }
            if (isset($byUrl[$url])) {
                $byUrl[$url] = [
                    'url'       => $url,
                    'is_read'   => ((int) ($byUrl[$url]['is_read'] ?? 0) === 1 || (int) ($row['is_read'] ?? 0) === 1) ? 1 : 0,
                    'is_create' => ((int) ($byUrl[$url]['is_create'] ?? 0) === 1 || (int) ($row['is_create'] ?? 0) === 1) ? 1 : 0,
                    'is_update' => ((int) ($byUrl[$url]['is_update'] ?? 0) === 1 || (int) ($row['is_update'] ?? 0) === 1) ? 1 : 0,
                    'is_delete' => ((int) ($byUrl[$url]['is_delete'] ?? 0) === 1 || (int) ($row['is_delete'] ?? 0) === 1) ? 1 : 0,
                ];
            } else {
                $byUrl[$url] = $row;
            }
        }

        $hasWildcardRef = isset($byUrl['ref']) && (int) ($byUrl['ref']['is_read'] ?? 0) === 1;

        return [
            'is_admin'         => false,
            'has_wildcard_ref' => $hasWildcardRef,
            'by_url'           => $byUrl,
        ];
    }

    private function getAliasPermissionUrls(string $slug): array
    {
        if ($slug === 'instansi') {
            return ['manage-instansi'];
        }
        if ($slug === 'pegawai' || str_starts_with($slug, 'pegawai_')) {
            return ['manage-pegawai'];
        }
        if (str_starts_with($slug, 'ikk_') || $slug === 'layanan') {
            return ['manage-iku'];
        }
        return [];
    }

    private function formatTableLabel(string $tableName, string $prefix): string
    {
        $raw = substr($tableName, strlen($prefix));
        $clean = ucwords(str_replace('_', ' ', $raw));
        $clean = str_ireplace(['Ikpa', 'Mt', 'Ikm', 'Sk'], ['IKPA', 'MT', 'IKM', 'SK'], $clean);

        if ($prefix === 'data_pegawai_') {
            return 'Pegawai: ' . $clean;
        }
        if ($prefix === 'data_master_') {
            return 'Master: ' . $clean;
        }
        return $clean;
    }

    private function defaultDescription(string $tableName, string $category): string
    {
        if ($category === 'kepegawaian') {
            return 'Referensi master atribut kepegawaian pada tabel ' . $tableName . '.';
        }
        return 'Referensi konfigurasi layanan dan opsi sistem pada tabel ' . $tableName . '.';
    }

    private function safeCountRows(string $table): int
    {
        try {
            return (int) $this->db->table($table)->countAllResults();
        } catch (Throwable $e) {
            return 0;
        }
    }

    private function buildWritablePayload(array $schema, array $data, bool $isInsert): array
    {
        $payload = [];
        $columns = $schema['columns'] ?? [];
        foreach ($columns as $col) {
            if (empty($col['is_writable'])) {
                continue;
            }
            $name = (string) $col['name'];
            $dataType = (string) ($col['data_type'] ?? 'varchar');
            $isNullable = !empty($col['is_nullable']);

            if ($isInsert && !empty($col['is_auto_uuid']) && empty($data[$name])) {
                $payload[$name] = $this->generateUuidV4();
                continue;
            }

            if (!array_key_exists($name, $data)) {
                continue;
            }

            $val = $data[$name];
            if ($val === '' || $val === null) {
                if ($isNullable) {
                    $payload[$name] = null;
                } elseif (in_array($dataType, ['tinyint', 'smallint', 'int', 'bigint', 'decimal', 'float', 'double'], true)) {
                    $payload[$name] = ($col['default'] !== null && is_numeric($col['default'])) ? $col['default'] : 0;
                } elseif (in_array($dataType, ['date', 'datetime', 'timestamp', 'time'], true)) {
                    continue;
                } else {
                    $payload[$name] = '';
                }
                continue;
            }

            if (in_array($dataType, ['tinyint', 'smallint', 'int', 'bigint'], true)) {
                if (is_bool($val)) {
                    $payload[$name] = $val ? 1 : 0;
                } else {
                    $payload[$name] = (int) $val;
                }
                continue;
            }

            if (in_array($dataType, ['decimal', 'float', 'double'], true)) {
                $payload[$name] = (float) $val;
                continue;
            }

            $payload[$name] = is_string($val) ? trim($val) : $val;
        }
        return $payload;
    }

    private function mapInputType(string $dataType, string $colLower, array $enumValues): string
    {
        if (!empty($enumValues)) {
            return 'select';
        }
        if (in_array($colLower, ['is_status', 'is_active', 'is_show', 'touch_support'], true)) {
            return 'boolean';
        }
        if (str_contains($colLower, 'warna') || str_contains($colLower, 'color') || $colLower === 'bg_light') {
            return 'color';
        }
        $map = [
            'tinyint'    => 'number',
            'smallint'   => 'number',
            'int'        => 'number',
            'bigint'     => 'number',
            'decimal'    => 'number',
            'float'      => 'number',
            'double'     => 'number',
            'date'       => 'date',
            'datetime'   => 'datetime-local',
            'timestamp'  => 'datetime-local',
            'time'       => 'time',
            'text'       => 'textarea',
            'longtext'   => 'textarea',
            'mediumtext' => 'textarea',
            'tinytext'   => 'textarea',
        ];

        return $map[$dataType] ?? 'text';
    }

    private function generateUuidV4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
