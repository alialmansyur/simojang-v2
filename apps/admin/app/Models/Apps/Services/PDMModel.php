<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class PDMModel extends Model
{
    protected $table            = 'txn_pdm';
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

    public function getBuilder($type, $params = null)
    {
        switch ($type) {
            case 'recap':
                return $this->getDataRecapV2($params);
            case 'detail':
                return $this->getDataDetail($params);
            default:
                throw new \Exception("Unknown builder type: $type");
        }
    }

    public function getColumns($type, $id = null)
    {
        $builder = $this->getBuilder($type, $id);
        $query = $builder->get();
        return $query->getFieldNames();
    }

    public function getDataRecapV2($params = [])
    {
        $bulan = $params['bulan'] ?? [];
        $jenis = trim((string) ($params['jenis'] ?? ''));

        $builder = $this->db->table('txn_pdm a')
            ->select("
                a.*,
                (SELECT COUNT(p.id) FROM txn_pdm p WHERE p.scema_group = a.scema_group) AS batch_count
            ")
            ->where('a.created_at >=', date('Y-01-01 00:00:00'))
            ->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(NULLIF(a.period_date, "0000-00-00"), DATE(a.created_at)))', $bulan, false);
        }

        if ($jenis !== '' && strtolower($jenis) !== 'all') {
            $builder->where('a.jenis', $jenis);
        }

        $builder->orderBy('a.created_at', 'DESC');

        return $builder;
    }

    public function getDataDetail($param)
    {
        $key = (int) $param;
        $row = $this->db->table('txn_pdm')
            ->where('id', $key)
            ->get()
            ->getRowArray();

        $builder = $this->db->table('txn_pdm a')
            ->select("
                a.*,
                (COALESCE(a.total_acc, 0) + COALESCE(a.total_btl, 0) + COALESCE(a.total_tms, 0)) AS total_usulan
            ");

        if ($row && !empty($row['scema_group']) && $row['scema_group'] !== '0') {
            $builder->where('a.scema_group', $row['scema_group']);
        } else {
            $builder->where('a.id', $key);
        }

        return $builder->orderBy('a.id', 'ASC');
    }

    public function getResumeData($param)
    {
        $rawSql = "
            SELECT 
                COUNT(1) total,
                SUM(COALESCE(a.total_acc, 0)) AS acc,
                SUM(COALESCE(a.total_btl, 0)) AS bts,
                SUM(COALESCE(a.total_tms, 0)) AS tms
            FROM txn_pdm a
            WHERE DATE(a.created_at) = CURDATE() AND a.created_by = ?
        ";
        return $this->db->query($rawSql, [$param])->getRow();
    }

    public function getDailyData($param)
    {
        $rawSql = "
            SELECT 
                DATE_FORMAT(DATE(a.created_at), '%Y-%m-%dT00:00:00.000Z') tanggal, COUNT(1) total
            FROM txn_pdm a
            WHERE WEEK(a.created_at) = WEEK(CURDATE()) AND a.created_by = ?
            GROUP BY DATE(a.created_at)
            ORDER BY DATE(a.created_at) ASC
        ";
        return $this->db->query($rawSql, [$param])->getResultArray();
    }

    public function getSummary($bulan = [], string $jenis = '')
    {
        $builder = $this->db->table('txn_pdm');
        $builder->select("
            COUNT(DISTINCT scema_group) AS total_skema,
            COUNT(id) AS total_data,
            SUM(COALESCE(total_acc, 0)) AS total_acc,
            SUM(COALESCE(total_btl, 0)) AS total_btl,
            SUM(COALESCE(total_tms, 0)) AS total_tms,
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
            'total_skema' => 0,
            'total_data'  => 0,
            'total_acc'   => 0,
            'total_btl'   => 0,
            'total_tms'   => 0,
            'last_update' => null,
        ];
    }
}
