<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class ITGModel extends Model
{
    protected $table            = 'txn_integrasi';
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
                return $this->getIntegrasiList($params);
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

    public function getIntegrasiList($params = null)
    {
        $jenis = is_array($params) ? ($params['jenis'] ?? 0) : $params;
        $bulan = is_array($params) ? ($params['bulan'] ?? []) : [];

        $builder = $this->db->table('txn_integrasi a')
            ->select("
                a.*,
                c.jenis,
                b.kodeins,
                b.nama AS instansi_name,
                b.kanreg,
                UPPER(b.wilayah) AS wilayah,
                b.logo,
                (SELECT COUNT(DISTINCT x.rw_integrasi_id) FROM txn_integrasi x WHERE x.instansi_id = a.instansi_id) AS total_modul_instansi
            ")
            ->join('data_instansi b', 'b.kodeins = a.instansi_id', 'left')
            ->join('data_support_integrasi c', 'c.id = a.rw_integrasi_id', 'left')
            ->where('a.created_at >=', date('Y-01-01 00:00:00'))
            ->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (!empty($jenis) && (string) $jenis !== '0' && strtolower((string) $jenis) !== 'all') {
            if (is_numeric($jenis)) {
                $builder->where('a.rw_integrasi_id', (int) $jenis);
            } else {
                $builder->where('c.jenis', (string) $jenis);
            }
        }

        if (is_array($bulan) && !empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(NULLIF(a.period_date, "0000-00-00"), DATE(a.created_at)))', $bulan, false);
        }

        $builder->orderBy('a.updated_at', 'DESC');

        return $builder;
    }

    public function getDataDetail($param)
    {
        $key = (int) $param;
        $row = $this->db->table('txn_integrasi')
            ->where('id', $key)
            ->get()
            ->getRowArray();

        $instansiId = $row ? (int) ($row['instansi_id'] ?? 0) : $key;
        $escapedIns = $this->db->escape($instansiId);

        return $this->db->table('data_support_integrasi s')
            ->select("
                s.id AS modul_id,
                s.jenis AS nama_modul,
                COALESCE(t.id, 0) AS integrasi_id,
                CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END AS is_synced,
                t.action,
                t.period,
                t.period_date,
                t.remarks,
                t.bukti_dukung,
                t.created_by,
                t.created_at,
                t.updated_at,
                b.kodeins AS kode_instansi,
                b.nama AS nama_instansi,
                UPPER(b.wilayah) AS wilayah,
                b.logo
            ")
            ->join('txn_integrasi t', "t.rw_integrasi_id = s.id AND t.instansi_id = {$escapedIns}", 'left')
            ->join('data_instansi b', "b.kodeins = {$escapedIns}", 'left')
            ->orderBy('s.id', 'ASC');
    }

    public function isDuplicateIntegrasi($instansiId, $riwayat, ?int $excludeId = null): bool
    {
        $builder = $this->db->table('txn_integrasi')
            ->where('instansi_id', $instansiId)
            ->where('rw_integrasi_id', $riwayat);

        if ($excludeId !== null && $excludeId > 0) {
            $builder->where('id !=', $excludeId);
        }

        return $builder->countAllResults() > 0;
    }

    public function getDataList(
        int $jenis,
        ?string $startDate = null,
        ?string $endDate = null
    ): array {
        $builder = $this->db->table('txn_integrasi a');

        $builder->select([
            'a.*',
            'c.jenis',
            'b.kodeins',
            'b.nama AS instansi_name',
            'b.kanreg',
            'UPPER(b.wilayah) AS wilayah',
            'b.logo'
        ]);

        $builder->join('data_instansi b', 'b.kodeins = a.instansi_id', 'left');
        $builder->join('data_support_integrasi c', 'c.id = a.rw_integrasi_id', 'left');

        $builder->where('a.rw_integrasi_id', $jenis);

        if ($startDate && $endDate) {
            $builder->where('a.created_at >=', $startDate . ' 00:00:00');
            $builder->where('a.created_at <=', $endDate . ' 23:59:59');
        }

        $builder->orderBy('a.updated_at', 'DESC');

        return $builder->get()->getResultArray();
    }

    public function getSummary($jenis = 0, array $bulan = [])
    {
        $builder = $this->db->table('txn_integrasi a');
        $builder->select("
            COUNT(a.id) AS total_data,
            COUNT(DISTINCT a.instansi_id) AS total_instansi,
            COUNT(DISTINCT a.rw_integrasi_id) AS total_riwayat,
            COUNT(DISTINCT UPPER(b.wilayah)) AS total_wilayah,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ", false);
        $builder->join('data_instansi b', 'b.kodeins = a.instansi_id', 'left');
        $builder->join('data_support_integrasi c', 'c.id = a.rw_integrasi_id', 'left');
        $builder->where('a.created_at >=', date('Y-01-01 00:00:00'));
        $builder->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (!empty($jenis) && (string) $jenis !== '0' && strtolower((string) $jenis) !== 'all') {
            if (is_numeric($jenis)) {
                $builder->where('a.rw_integrasi_id', (int) $jenis);
            } else {
                $builder->where('c.jenis', (string) $jenis);
            }
        }

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(NULLIF(a.period_date, "0000-00-00"), DATE(a.created_at)))', $bulan, false);
        }

        return $builder->get()->getRowArray() ?? [
            'total_data'     => 0,
            'total_instansi' => 0,
            'total_riwayat'  => 0,
            'total_wilayah'  => 0,
            'last_update'    => null,
        ];
    }
}
