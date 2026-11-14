<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class STKModel extends Model
{
    protected $table            = 'txn_asn';
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

    public function getDataLog($jenis = null)
    {
        $builder = $this->db->table($this->table);
        if ($jenis) {
            $builder->where('title', $jenis);
        }
        return $builder;
    }

    public function syncEmptyPeriods(): void
    {
        try {
            $this->db->query("
                UPDATE txn_asn
                SET
                    period = CASE WHEN period IS NULL OR period = '' THEN DATE_FORMAT(created_at, '%Y-%m') ELSE period END,
                    period_date = CASE WHEN period_date IS NULL OR period_date = '0000-00-00' THEN DATE(created_at) ELSE period_date END,
                    period_start_date = CASE WHEN period_start_date IS NULL OR period_start_date = '0000-00-00' THEN DATE(created_at) ELSE period_start_date END,
                    period_end_date = CASE WHEN period_end_date IS NULL OR period_end_date = '0000-00-00' THEN DATE(created_at) ELSE period_end_date END
                WHERE period = '' OR period IS NULL OR period_date = '0000-00-00' OR period_date IS NULL
            ");
        } catch (\Throwable $e) {
            log_message('error', '[STKModel::syncEmptyPeriods] ' . $e->getMessage());
        }
    }

    public function getBuilder($type, $key = null)
    {
        switch ($type) {
            case 'recap':
                return $this->getDataRecap($key);
            case 'detail':
                return $this->getDataDetail($key);
            default:
                throw new \Exception("Unknown builder type: $type");
        }
    }

    public function getColumns($type, $key = null)
    {
        $builder = $this->getBuilder($type, $key);
        $query = $builder->get();
        return $query->getFieldNames();
    }

    public function getDataRecap($params = null)
    {
        $this->syncEmptyPeriods();

        $jenis = is_array($params) ? ($params['jenis'] ?? null) : $params;
        $bulan = is_array($params) ? ($params['bulan'] ?? []) : [];

        $mapTable = $this->getJenisTableMap();
        if (!$jenis || !isset($mapTable[$jenis])) {
            return null;
        }

        $table = $mapTable[$jenis];

        $builder = $this->db->table('txn_asn a')
            ->select("
                a.*,
                COUNT(b.id) AS total,
                COUNT(DISTINCT b.instansi_id) AS total_instansi,
                COALESCE(SUM(b.jumlah), 0) AS total_asn
            ")
            ->join($table . ' b', 'b.asn_log_id = a.id', 'left')
            ->where('a.jenis', $jenis)
            ->groupBy('a.id')
            ->orderBy('a.created_at', 'DESC');

        if (is_array($bulan) && !empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(NULLIF(a.period_date, "0000-00-00"), DATE(a.created_at)))', $bulan, false);
        }

        return $builder;
    }

    public function getDataDetail($param)
    {
        $mapTable = $this->getJenisTableMap();

        $log = $this->db->table('txn_asn')
            ->select('id, jenis')
            ->where('id', $param)
            ->get()
            ->getRowArray();

        if (!$log || !isset($mapTable[$log['jenis']])) {
            return $this->db->table('(SELECT 1 AS empty_col WHERE 1=0) AS recap');
        }

        $table = $mapTable[$log['jenis']];
        return $this->db->table('txn_asn a')
            ->select('
                a.id AS log_id,
                a.jenis AS jenis_kategori,
                a.period,
                b.*,
                c.logo,
                c.kodeins AS kode_instansi,
                c.nama AS nama_instansi,
                a.created_by AS upload_by,
                b.created_at AS tanggal_upload
            ')
            ->join($table . ' b', 'b.asn_log_id = a.id', 'left')
            ->join('data_instansi c', 'c.kodeins = b.instansi_id', 'left')
            ->where('b.instansi_id IS NOT NULL', null, false)
            ->where('a.id', (int) $param);
    }

    public function getSummary($jenis = null, array $bulan = [])
    {
        $this->syncEmptyPeriods();

        $mapTable = $this->getJenisTableMap();

        if (!$jenis || !isset($mapTable[$jenis])) {
            return [
                'total_upload'   => 0,
                'total_data'     => 0,
                'total_instansi' => 0,
                'total_periode'  => 0,
                'last_update'    => null,
            ];
        }

        $table = $mapTable[$jenis];
        $builder = $this->db->table('txn_asn a');
        $builder->select("
            COUNT(DISTINCT a.id) AS total_upload,
            COUNT(b.id) AS total_data,
            COUNT(DISTINCT b.instansi_id) AS total_instansi,
            COUNT(DISTINCT a.period) AS total_periode,
            COALESCE(SUM(b.jumlah), 0) AS total_asn,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ", false);
        $builder->join($table . ' b', 'b.asn_log_id = a.id', 'left');
        $builder->where('a.jenis', $jenis);
        $builder->where('a.created_at >=', date('Y-01-01 00:00:00'));
        $builder->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(NULLIF(a.period_date, "0000-00-00"), DATE(a.created_at)))', $bulan, false);
        }

        return $builder->get()->getRowArray() ?? [
            'total_upload'   => 0,
            'total_data'     => 0,
            'total_instansi' => 0,
            'total_periode'  => 0,
            'total_asn'      => 0,
            'last_update'    => null,
        ];
    }

    private function getJenisTableMap(): array
    {
        return [
            'Jumlah ASN'           => 'txn_asn_jumlahs',
            'Golongan ASN'         => 'txn_asn_golongans',
            'Pendidikan ASN'       => 'txn_asn_pendidikans',
            'Usia ASN'             => 'txn_asn_usias',
            'Jenis Kelamin ASN'    => 'txn_asn_jenis_kelamins',
            'Generasi ASN'         => 'txn_asn_generasis',
            'Kelompok Jabatan ASN' => 'txn_asn_kelompok_jabatans',
            'Masa Kerja ASN'       => 'txn_asn_masa_kerjas',
        ];
    }
}
