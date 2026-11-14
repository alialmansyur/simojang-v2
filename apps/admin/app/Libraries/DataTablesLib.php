<?php

namespace App\Libraries;

use Config\Database;

class DataTablesLib
{
    protected $request;
    protected $db;

    public function __construct()
    {
        $this->request = service('request');
        $this->db = Database::connect();
    }

    public function render($builder, array $columns){
        $request = $this->request;
        $draw    = $request->getPost('draw');
        $start   = (int) ($request->getPost('start') ?? 0);
        $length  = (int) ($request->getPost('length') ?? 10);
        if ($length <= 0) $length = 10;
        $searchPost = $request->getPost('search');
        if (is_array($searchPost)) {
            $search = trim((string) ($searchPost['value'] ?? ''));
            if ($search === '') $search = null;
        } elseif (is_string($searchPost)) {
            $search = trim($searchPost);
            if ($search === '') $search = null;
        } else {
            $search = null;
        }
        $order   = $request->getPost('order')[0] ?? null;
        $requestColumns = $request->getPost('columns') ?? [];
        $definitions = $this->normalizeColumns($columns);
        $totalRecords = $builder->countAllResults(false);

        // Detect table alias, name, and subquery
        $rawSql = $builder->getCompiledSelect(false);
        $isSubquery = (stripos($rawSql, 'FROM (') !== false || stripos($rawSql, 'FROM  (') !== false || preg_match('/FROM\s*\(/i', $rawSql));
        $hasInstansiJoin = (stripos($rawSql, 'data_instansi') !== false);

        $mainAlias = '';
        $mainTable = '';
        if ($isSubquery) {
            if (preg_match('/\)\s*`?([a-zA-Z0-9_]+)`?\s*(WHERE|ORDER|LIMIT|$)/si', $rawSql, $m)) {
                $mainAlias = $m[1];
            }
        } else {
            $rawTable = method_exists($builder, 'getTable') ? (string) $builder->getTable() : '';
            if (!empty($rawTable)) {
                $parts = preg_split('/\s+/', trim($rawTable));
                $mainTable = trim($parts[0], '`');
                if (count($parts) > 1) {
                    $mainAlias = trim(end($parts), '`');
                }
            }
        }

        // Get actual main table fields if available
        $mainTableFields = [];
        if (!empty($mainTable)) {
            try {
                if ($this->db->tableExists($mainTable)) {
                    $mainTableFields = array_map('strtolower', $this->db->getFieldNames($mainTable));
                }
            } catch (\Throwable $e) {
                $mainTableFields = [];
            }
        }

        if ($search) {
            $builder->groupStart();
            $hasSearch = false;
            foreach ($definitions as $definition) {
                $searchTargets = $definition['search'];
                if ($searchTargets === false || $searchTargets === null) {
                    continue;
                }

                foreach ((array) $searchTargets as $searchTarget) {
                    $resolvedTarget = $this->sanitizeSearchTarget($searchTarget, $mainAlias, $isSubquery, $hasInstansiJoin, $mainTableFields);
                    if ($resolvedTarget === null) {
                        continue;
                    }
                    $builder->orLike($resolvedTarget, $search);
                    $hasSearch = true;
                }
            }
            if (!$hasSearch) {
                if ($hasInstansiJoin && !$isSubquery) {
                    $builder->orLike('b.nama', $search);
                } else {
                    $fallbackId = !empty($mainAlias) ? "{$mainAlias}.id" : "id";
                    $builder->orLike($fallbackId, $search);
                }
            }
            $builder->groupEnd();
        }

        try {
            $totalFiltered = $builder->countAllResults(false);

            if ($order) {
                $orderColumnName = null;
                $orderIndex = isset($order['column']) ? (int) $order['column'] : -1;
                if (isset($requestColumns[$orderIndex]['data'])) {
                    $orderColumnName = $requestColumns[$orderIndex]['data'];
                }

                $orderTarget = $this->resolveOrderTarget($definitions, $orderColumnName, $orderIndex);
                if ($orderTarget) {
                    $resolvedOrderTarget = $this->sanitizeSearchTarget($orderTarget, $mainAlias, $isSubquery, $hasInstansiJoin, $mainTableFields) ?? $orderTarget;
                    $direction = strtolower((string) ($order['dir'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';
                    $builder->orderBy($resolvedOrderTarget, $direction);
                }
            }

            $query = $builder->limit($length, $start)->get();
            $data  = $query->getResult();

            $result = [];
            $no = $start + 1;
            foreach ($data as $row) {
                $rowData = ['DT_RowIndex' => $no++];
                foreach ($definitions as $definition) {
                    $columnName = $definition['data'];
                    $rowData[$columnName] = $row->$columnName ?? null;
                }
                if (property_exists($row, 'id')) {
                    $rowData['id'] = $row->id;
                }
                $result[] = $rowData;
            }

            return [
                'draw'            => intval($draw),
                'recordsTotal'    => $totalRecords,
                'recordsFiltered' => $totalFiltered,
                'data'            => $result
            ];
        } catch (\Throwable $e) {
            log_message('error', 'DataTablesLib execution error: {message}', ['message' => $e->getMessage()]);
            return [
                'draw'            => intval($draw),
                'recordsTotal'    => $totalRecords ?? 0,
                'recordsFiltered' => 0,
                'data'            => []
            ];
        }
    }

    protected function normalizeColumns(array $columns): array
    {
        $definitions = [];

        foreach ($columns as $column) {
            if (is_string($column)) {
                $definitions[] = [
                    'data' => $column,
                    'search' => $column,
                    'order' => $column,
                ];
                continue;
            }

            if (!is_array($column) || empty($column['data']) || !is_string($column['data'])) {
                continue;
            }

            $definitions[] = [
                'data' => $column['data'],
                'search' => $column['search'] ?? $column['data'],
                'order' => $column['order'] ?? $column['data'],
            ];
        }

        return $definitions;
    }

    protected function resolveOrderTarget(array $definitions, ?string $requestDataName, int $orderIndex): ?string
    {
        if ($requestDataName !== null && $requestDataName !== '') {
            foreach ($definitions as $definition) {
                if ($definition['data'] !== $requestDataName) {
                    continue;
                }

                return is_string($definition['order']) && trim($definition['order']) !== ''
                    ? $definition['order']
                    : null;
            }
        }

        if (isset($definitions[$orderIndex])) {
            $fallbackTarget = $definitions[$orderIndex]['order'] ?? null;
            return is_string($fallbackTarget) && trim($fallbackTarget) !== ''
                ? $fallbackTarget
                : null;
        }

        return null;
    }

    protected function sanitizeSearchTarget(?string $target, string $mainAlias = 'a', bool $isSubquery = false, bool $hasInstansiJoin = false, array $mainTableFields = []): ?string
    {
        if (!is_string($target) || trim($target) === '') {
            return null;
        }
        $target = trim($target);
        $targetLower = strtolower($target);

        // Skip non-searchable or computed SQL expressions
        $skip = [
            'total_percentase', 'mulai_implemen', 'diperbaharui', 'total', 'total_anomali',
            'total_riwayat', 'total_konsultasi', 'total_asistensi', 'total_regulasi',
            'total_surat_masuk', 'total_ppt', 'total_zoom', 'total_data', 'total_upload',
            'total_nip', 'total_instansi', 'total_periode', 'total_docs', 'total_draft',
            'total_acc', 'total_btl', 'total_tms', 'total_record', 'total_doc',
            'total_usul', 'total_realisasi', 'rata_sla', 'avg_capaian',
            'selisih', 'persen', 'percentage', 'logo', 'dt_rowindex', 'aksi', 'action',
            'raw_data', 'json_data', 'metadata', 'password', 'token', 'remember_token',
            'file_blob', 'avatar', 'last_period_label', 'updated_at_label', 'created_at_label',
            'last_period_date', 'pendampingan_date_label', 'period_date_label'
        ];
        if (in_array($targetLower, $skip, true) || str_ends_with($targetLower, '_label') || str_starts_with($targetLower, 'total_')) {
            return null;
        }

        // If subquery, columns are directly available on the derived table without joining raw table aliases
        if ($isSubquery) {
            return !empty($mainAlias) ? "`{$mainAlias}`.`{$target}`" : "`{$target}`";
        }

        // Instansi join alias mappings (for direct joins only)
        $aliasMap = [
            'nama'          => 'b.nama',
            'instansi_name' => 'b.nama',
            'nama_instansi' => 'b.nama',
            'kode_instansi' => 'b.kodeins',
            'kodeins'       => 'b.kodeins',
            'kanreg'        => 'b.kanreg',
            'wilayah'       => 'b.wilayah',
            'instansi'      => 'b.nama',
            'step_name'     => 'c.step_name',
            'jenis_anomali' => 'b.jenis_anomali',
        ];

        if (isset($aliasMap[$targetLower])) {
            return $hasInstansiJoin ? $aliasMap[$targetLower] : null;
        }

        // Already qualified with table alias like a.id or b.nama
        if (strpos($target, '.') !== false) {
            return $target;
        }

        // If main table fields are known, ONLY allow searching if field really exists on main table!
        if (!empty($mainTableFields)) {
            if (in_array($targetLower, $mainTableFields, true)) {
                return !empty($mainAlias) ? "{$mainAlias}.{$target}" : $target;
            }
            // Field not on main table and not in aliasMap -> skip to avoid unknown column error!
            return null;
        }

        // If main table has alias (e.g. a or recap), qualify column to avoid ambiguous error
        if (!empty($mainAlias)) {
            return "{$mainAlias}.{$target}";
        }

        return $target;
    }
}
