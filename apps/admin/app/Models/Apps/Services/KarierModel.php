<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class KarierModel extends Model
{
    protected $table            = 'txn_karier'; 
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
            case 'recap-karier':
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

        $builder = $this->db->table('txn_karier a')
            ->select("
                a.id,
                a.uid,
                a.scema_group,
                a.instansi_id,
                IF(a.tanggal IS NULL OR CAST(a.tanggal AS CHAR) = '0000-00-00', NULL, a.tanggal) AS tanggal,
                a.jenis_penilaian,
                a.total_peserta,
                a.memenuhi,
                a.tidak_memenuhi,
                a.lulus,
                a.tidak_lulus,
                a.tidak_hadir,
                CASE
                    WHEN LOWER(TRIM(COALESCE(a.created_by, ''))) IN ('migration_script', 'system', '') THEN NULL
                    ELSE a.created_by
                END AS created_by,
                a.created_at,
                a.updated_at,
                d.nama AS instansi_nama,
                d.wilayah,
                d.kanreg,
                d.logo
            ", false)
            ->join('data_instansi d', 'd.kodeins = a.instansi_id', 'left')
            ->orderBy("IF(a.tanggal IS NULL OR CAST(a.tanggal AS CHAR) = '0000-00-00', DATE(a.created_at), a.tanggal)", 'DESC', false)
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
        if ($category === 'ud') {
            $builder->groupStart()
                ->like('LOWER(a.jenis_penilaian)', 'ud', 'both', null, true)
                ->orLike('LOWER(a.jenis_penilaian)', 'ujian dinas', 'both', null, true)
                ->groupEnd();
        } elseif ($category === 'upkp') {
            $builder->groupStart()
                ->like('LOWER(a.jenis_penilaian)', 'upkp', 'both', null, true)
                ->orLike('LOWER(a.jenis_penilaian)', 'penyesuaian ijazah', 'both', null, true)
                ->groupEnd();
        } elseif ($category === 'seleksi-terbuka') {
            $builder->like('LOWER(a.jenis_penilaian)', 'seleksi', 'both', null, true);
        } elseif ($category === 'uji-kelayakan') {
            $builder->like('LOWER(a.jenis_penilaian)', 'kelayakan', 'both', null, true);
        } elseif ($category === 'evaluasi-kinerja') {
            $builder->like('LOWER(a.jenis_penilaian)', 'evaluasi', 'both', null, true);
        }

        return $builder;
    }

    public function getSummary($bulan = [], array $params = [])
    {
        $periodYear = (int) ($params['period_year'] ?? 0);
        $category = strtolower(trim((string) ($params['category'] ?? '')));

        $builder = $this->db->table('txn_karier a');
        $builder->select("
            COUNT(a.id) AS total_rekap,
            COUNT(DISTINCT a.instansi_id) AS total_instansi,
            SUM(COALESCE(a.total_peserta, 0)) AS total_peserta,
            SUM(COALESCE(a.memenuhi, 0) + COALESCE(a.lulus, 0)) AS total_memenuhi,
            SUM(COALESCE(a.lulus, 0)) AS total_lulus,
            SUM(COALESCE(a.tidak_memenuhi, 0) + COALESCE(a.tidak_lulus, 0)) AS total_tidak_memenuhi,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ", false);

        if ($periodYear > 2000) {
            $builder->where("YEAR(IF(a.tanggal IS NULL OR CAST(a.tanggal AS CHAR) = '0000-00-00', a.created_at, a.tanggal)) =", $periodYear, false);
        }

        if (!empty($bulan)) {
            $builder->whereIn("MONTH(IF(a.tanggal IS NULL OR CAST(a.tanggal AS CHAR) = '0000-00-00', a.created_at, a.tanggal))", $bulan, false);
        }

        if ($category === 'ud') {
            $builder->groupStart()
                ->like('LOWER(a.jenis_penilaian)', 'ud', 'both', null, true)
                ->orLike('LOWER(a.jenis_penilaian)', 'ujian dinas', 'both', null, true)
                ->groupEnd();
        } elseif ($category === 'upkp') {
            $builder->groupStart()
                ->like('LOWER(a.jenis_penilaian)', 'upkp', 'both', null, true)
                ->orLike('LOWER(a.jenis_penilaian)', 'penyesuaian ijazah', 'both', null, true)
                ->groupEnd();
        } elseif ($category === 'seleksi-terbuka') {
            $builder->like('LOWER(a.jenis_penilaian)', 'seleksi', 'both', null, true);
        } elseif ($category === 'uji-kelayakan') {
            $builder->like('LOWER(a.jenis_penilaian)', 'kelayakan', 'both', null, true);
        } elseif ($category === 'evaluasi-kinerja') {
            $builder->like('LOWER(a.jenis_penilaian)', 'evaluasi', 'both', null, true);
        }

        return $builder->get()->getRowArray() ?? [
            'total_rekap' => 0,
            'total_instansi' => 0,
            'total_peserta' => 0,
            'total_memenuhi' => 0,
            'total_lulus' => 0,
            'last_update' => null,
        ];
    }
}
