<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class DMSModel extends Model
{
    protected $table            = 'txn_dms';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected array $casts = [];
    protected array $castHandlers = [];

    // Dates
    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules      = [];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert   = [];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    public function getDataLog()
    {
        $builder = $this->db->table($this->table);
        return $builder;
    }

    // ----------------------------
    //  QUERY BUILDER UTAMA
    // ----------------------------
    public function getBuilder($type, $params = null)
    {
        switch ($type) {
            case 'recap':
                return $this->getDataRecap($params);
            case 'detail':
                return $this->getDataDetail($params);
            default:
                throw new \Exception("Unknown builder type: $type");
        }
    }

    // ----------------------------
    //  DAPATKAN NAMA KOLOM OTOMATIS
    // ----------------------------
    public function getColumns($type, $id = null)
    {
        $builder = $this->getBuilder($type, $id);
        $query = $builder->get();
        return $query->getFieldNames();
    }

    public function syncOrphanedLogs(): void
    {
        try {
            $orphans = $this->db->query("
                SELECT
                    d.dms_log_id,
                    d.instansi_id,
                    COUNT(d.id) AS total_nip,
                    COALESCE(SUM(COALESCE(d.total_doc,
                        COALESCE(d.d2nip,0) + COALESCE(d.ijazah,0) + COALESCE(d.drh,0) +
                        COALESCE(d.cpns,0) + COALESCE(d.pns,0) + COALESCE(d.kp,0) +
                        COALESCE(d.jabatan,0) + COALESCE(d.perubahan,0) + COALESCE(d.berhenti,0) + COALESCE(d.pensiun,0)
                    )), 0) AS total_dok,
                    MIN(d.tanggal_proses) AS min_tgl,
                    MAX(d.tanggal_proses) AS max_tgl,
                    MIN(d.created_at) AS min_created
                FROM txn_dms_detail d
                LEFT JOIN txn_dms_entry e
                    ON e.scema_group = CONCAT('dms_log_', d.dms_log_id)
                    AND e.instansi_id = d.instansi_id
                WHERE d.instansi_id > 0 AND e.id IS NULL
                GROUP BY d.dms_log_id, d.instansi_id
            ")->getResultArray();

            if (empty($orphans)) {
                return;
            }

            foreach ($orphans as $row) {
                $logId = (int) $row['dms_log_id'];
                $instansiId = (int) $row['instansi_id'];
                $minTgl = !empty($row['min_tgl']) && $row['min_tgl'] !== '0000-00-00' ? $row['min_tgl'] : substr((string) $row['min_created'], 0, 10);
                if (empty($minTgl)) {
                    $minTgl = date('Y-m-d');
                }
                $maxTgl = !empty($row['max_tgl']) && $row['max_tgl'] !== '0000-00-00' ? $row['max_tgl'] : $minTgl;
                $period = substr($minTgl, 0, 7);
                $createdAt = !empty($row['min_created']) ? $row['min_created'] : date('Y-m-d H:i:s');

                $parentLog = $this->db->table('txn_dms')->where('id', $logId)->get()->getRowArray();
                if (!$parentLog) {
                    $this->db->table('txn_dms')->insert([
                        'id'                => $logId,
                        'action'            => 'upload',
                        'period'            => $period,
                        'period_date'       => $minTgl,
                        'period_start_date' => $minTgl,
                        'period_end_date'   => $maxTgl,
                        'file_name'         => 'Import_DMS_Log_' . $logId . '.xlsx',
                        'file_size'         => 0,
                        'file_type'         => 'application/vnd.ms-excel',
                        'file_hash'         => md5('dms_log_' . $logId),
                        'ip_address'        => '127.0.0.1',
                        'user_agent'        => 'System Sync',
                        'created_by'        => 'system',
                        'created_at'        => $createdAt,
                        'updated_at'        => $createdAt,
                    ]);
                }

                $this->db->table('txn_dms_entry')->insert([
                    'action'            => 'upload',
                    'scema_group'       => substr('dms_log_' . $logId, 0, 18),
                    'instansi_id'       => $instansiId,
                    'period'            => $parentLog['period'] ?? $period,
                    'period_date'       => $parentLog['period_date'] ?? $minTgl,
                    'period_start_date' => $parentLog['period_start_date'] ?? $minTgl,
                    'period_end_date'   => $parentLog['period_end_date'] ?? $maxTgl,
                    'jenis'             => 'Arsip Elektronik (PNS)',
                    'total'             => (int) $row['total_dok'],
                    'created_by'        => $parentLog['created_by'] ?? 'system',
                    'created_at'        => $createdAt,
                    'updated_at'        => $createdAt,
                ]);
            }
        } catch (\Throwable $e) {
            log_message('error', '[DMSModel::syncOrphanedLogs] ' . $e->getMessage());
        }
    }

    public function getDataRecap($params = [])
    {
        $this->syncOrphanedLogs();

        $bulan = $params['bulan'] ?? [];
        $jenis = trim((string) ($params['jenis'] ?? ''));

        $builder = $this->db->table('txn_dms_entry a')
            ->select("
                a.*,
                b.nama AS nama_instansi,
                b.kodeins AS kode_instansi,
                b.logo,
                (SELECT COUNT(d.id) FROM txn_dms_detail d WHERE CONCAT('dms_log_', d.dms_log_id) = a.scema_group AND d.instansi_id = a.instansi_id) AS total_nip
            ")
            ->join('data_instansi b', 'b.kodeins = a.instansi_id', 'left')
            ->where('a.created_at >=', date('Y-01-01 00:00:00'))
            ->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00')
            ->groupBy('a.id')
            ->orderBy('a.created_at', 'DESC');

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(NULLIF(a.period_date, "0000-00-00"), DATE(a.created_at)))', $bulan, false);
        }

        if ($jenis !== '' && strtolower($jenis) !== 'all') {
            $builder->where('a.jenis', $jenis);
        }

        return $builder;
    }

    public function getDataDetail($param)
    {
        $key = (int) $param;
        $entry = $this->db->table('txn_dms_entry')
            ->where('id', $key)
            ->get()
            ->getRowArray();

        if ($entry && str_starts_with((string) ($entry['scema_group'] ?? ''), 'dms_log_')) {
            $logId = (int) str_replace('dms_log_', '', (string) $entry['scema_group']);
            $instansiId = (int) ($entry['instansi_id'] ?? 0);

            $builder = $this->db->table('txn_dms_detail b')
                ->select("
                    b.dms_log_id AS log_id,
                    a.period,
                    a.period_start_date,
                    a.period_end_date,
                    b.*,
                    c.logo,
                    c.kodeins AS kode_instansi,
                    c.nama AS nama_instansi,
                    COALESCE(a.created_by, 'system') AS upload_by,
                    b.created_at AS tanggal_upload,
                    'detail_nip' AS detail_mode
                ")
                ->join('txn_dms a', 'a.id = b.dms_log_id', 'left')
                ->join('data_instansi c', 'c.kodeins = b.instansi_id', 'left')
                ->where('b.dms_log_id', $logId);

            if ($instansiId > 0) {
                $builder->where('b.instansi_id', $instansiId);
            }

            return $builder;
        }

        if ($entry && !empty($entry['scema_group'])) {
            return $this->db->table('txn_dms_entry a')
                ->select("
                    a.id AS log_id,
                    a.scema_group,
                    a.instansi_id,
                    a.period,
                    a.period_date,
                    a.period_start_date,
                    a.period_end_date,
                    a.jenis,
                    a.total,
                    a.created_by,
                    a.created_at,
                    c.logo,
                    c.kodeins AS kode_instansi,
                    c.nama AS nama_instansi,
                    a.created_by AS upload_by,
                    a.created_at AS tanggal_upload,
                    'entry_summary' AS detail_mode
                ")
                ->join('data_instansi c', 'c.kodeins = a.instansi_id', 'left')
                ->where('a.scema_group', $entry['scema_group']);
        }

        return $this->db->table('txn_dms a')
            ->select("
                a.id AS log_id,
                a.period_start_date,
                a.period_end_date,
                b.*,
                c.logo,
                c.kodeins AS kode_instansi,
                c.nama AS nama_instansi,
                a.created_by AS upload_by,
                b.created_at AS tanggal_upload,
                'detail_nip' AS detail_mode
            ")
            ->join('txn_dms_detail b', 'b.dms_log_id = a.id', 'left')
            ->join('data_instansi c', 'c.kodeins = b.instansi_id', 'left')
            ->where('b.instansi_id IS NOT NULL', null, false)
            ->where('a.id', $key);
    }

    public function getSummary($bulan = [], string $jenis = '')
    {
        $this->syncOrphanedLogs();

        $builder = $this->db->table('txn_dms_entry');
        $builder->select("
            COUNT(id) AS total_data,
            COUNT(DISTINCT instansi_id) AS total_instansi,
            COUNT(DISTINCT period) AS total_periode,
            SUM(COALESCE(total, 0)) AS total_dokumen,
            MAX(COALESCE(updated_at, created_at)) AS last_update
        ", false);
        $builder->where('created_at >=', date('Y-01-01 00:00:00'));
        $builder->where('created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (is_array($bulan) && !empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(NULLIF(period_date, "0000-00-00"), DATE(created_at)))', $bulan, false);
        }

        if ($jenis !== '' && strtolower($jenis) !== 'all') {
            $builder->where('jenis', $jenis);
        }

        return $builder->get()->getRowArray() ?? [
            'total_data' => 0,
            'total_instansi' => 0,
            'total_periode' => 0,
            'total_dokumen' => 0,
            'last_update' => null,
        ];
    }
}
