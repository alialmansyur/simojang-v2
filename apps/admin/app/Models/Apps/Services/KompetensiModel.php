<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class KompetensiModel extends Model
{
    protected $table            = 'txn_kompetensi'; 
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

    public function getBuilder($type, $param = null){
        switch ($type) {
            case 'recap-kompetensi':
                return $this->getDataRecap($param);
            default:
                throw new \Exception("Unknown builder type: $type");
        }
    }    

    public function getDataRecap($params = [])
    {
        $bulan = $params['bulan'] ?? [];
        $instansi_id = $params['instansi_id'] ?? [];
        $category = strtolower(trim((string) ($params['category'] ?? '')));
        $periodYear = (int) ($params['period_year'] ?? 0);

        $builder = $this->db->table('txn_kompetensi a')
            ->select('
                a.*,
                d.nama AS instansi_nama,
                d.wilayah,
                d.kanreg,
                d.logo
            ')
            ->join('data_instansi d', 'd.kodeins = a.instansi_id', 'left')
            ->orderBy('a.tanggal', 'DESC')
            ->orderBy('a.created_at', 'DESC');

        if ($periodYear > 2000) {
            $builder->where("YEAR(IF(a.tanggal IS NULL OR CAST(a.tanggal AS CHAR) = '0000-00-00', a.created_at, a.tanggal)) =", $periodYear, false);
        }

        if (!empty($bulan)) {
            $builder->whereIn("MONTH(IF(a.tanggal IS NULL OR CAST(a.tanggal AS CHAR) = '0000-00-00', a.created_at, a.tanggal))", $bulan, false);
        }
        if (!empty($instansi_id)) {
            $builder->whereIn('a.instansi_id', $instansi_id);
        }
        if ($category === 'cact') {
            $builder->like('LOWER(a.metode)', 'cact', 'after', null, true);
        } elseif ($category === 'proasn' || $category === 'pro asn') {
            $builder->like('LOWER(a.metode)', 'pro', 'after', null, true);
        } elseif ($category === 'integrasi') {
            $builder->like('LOWER(a.metode)', 'integrasi', 'after', null, true);
        }

        return $builder;
    }

    public function getSummary($bulan = [], array $params = [])
    {
        $periodYear = (int) ($params['period_year'] ?? 0);
        $category = strtolower(trim((string) ($params['category'] ?? '')));

        $builder = $this->db->table('txn_kompetensi a');
        $builder->select("
            COUNT(a.id) AS total_rekap,
            COUNT(DISTINCT a.instansi_id) AS total_instansi,
            SUM(COALESCE(a.total_peserta, 0)) AS total_peserta,
            SUM(CASE WHEN LOWER(a.metode) LIKE 'cact%' THEN 1 ELSE 0 END) AS cact_metode,
            SUM(CASE WHEN LOWER(a.metode) LIKE 'cact%' THEN COALESCE(a.total_peserta, 0) ELSE 0 END) AS total_peserta_cact,
            SUM(CASE WHEN LOWER(a.metode) LIKE 'pro%' THEN COALESCE(a.total_peserta, 0) ELSE 0 END) AS total_peserta_proasn,
            SUM(CASE WHEN LOWER(a.metode) LIKE 'integrasi%' THEN COALESCE(a.total_peserta, 0) ELSE 0 END) AS total_peserta_integrasi,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ", false);

        if ($periodYear > 2000) {
            $builder->where("YEAR(IF(a.tanggal IS NULL OR CAST(a.tanggal AS CHAR) = '0000-00-00', a.created_at, a.tanggal)) =", $periodYear, false);
        }

        if (!empty($bulan)) {
            $builder->whereIn("MONTH(IF(a.tanggal IS NULL OR CAST(a.tanggal AS CHAR) = '0000-00-00', a.created_at, a.tanggal))", $bulan, false);
        }

        if ($category === 'cact') {
            $builder->like('LOWER(a.metode)', 'cact', 'after', null, true);
        } elseif ($category === 'proasn' || $category === 'pro asn') {
            $builder->like('LOWER(a.metode)', 'pro', 'after', null, true);
        } elseif ($category === 'integrasi') {
            $builder->like('LOWER(a.metode)', 'integrasi', 'after', null, true);
        }

        return $builder->get()->getRowArray() ?? [
            'total_rekap' => 0,
            'total_instansi' => 0,
            'total_peserta' => 0,
            'cact_metode' => 0,
            'total_peserta_cact' => 0,
            'total_peserta_proasn' => 0,
            'total_peserta_integrasi' => 0,
            'last_update' => null,
        ];
    }
}
