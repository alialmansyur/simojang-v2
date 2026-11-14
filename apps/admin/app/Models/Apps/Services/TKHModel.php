<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class TKHModel extends Model
{
    protected $table            = 'txn_takah';
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
                return $this->getDataRecap($params);
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

    public function getDataRecap($params = [])
    {
        $bulan = $params['bulan'] ?? [];

        $builder = $this->db->table('txn_takah a')
            ->select("
                a.*,
                COUNT(b.id) AS total,
                COUNT(DISTINCT b.instansi_id) AS total_instansi,
                GROUP_CONCAT(DISTINCT c.nama SEPARATOR ', ') AS nama_instansi_list,
                COALESCE(SUM(
                    COALESCE(b.d2nip,0) + COALESCE(b.ijazah,0) + COALESCE(b.akta,0) + COALESCE(b.drh,0) +
                    COALESCE(b.cpns,0) + COALESCE(b.pns,0) + COALESCE(b.perubahan,0) + COALESCE(b.kp,0) +
                    COALESCE(b.jabatan,0) + COALESCE(b.berhenti,0) + COALESCE(b.pensiun,0)
                ), 0) AS total_dokumen,
                MAX(b.nip) AS nip_single,
                MAX(b.nama) AS nama_single,
                MAX(b.instansi_id) AS instansi_single,
                MAX(b.d2nip) AS d2nip,
                MAX(b.ijazah) AS ijazah,
                MAX(b.akta) AS akta,
                MAX(b.drh) AS drh,
                MAX(b.cpns) AS cpns,
                MAX(b.pns) AS pns,
                MAX(b.perubahan) AS perubahan,
                MAX(b.kp) AS kp,
                MAX(b.jabatan) AS jabatan,
                MAX(b.berhenti) AS berhenti,
                MAX(b.pensiun) AS pensiun
            ")
            ->join('txn_takah_detail b', 'b.takah_log_id = a.id', 'left')
            ->join('data_instansi c', 'c.kodeins = b.instansi_id', 'left')
            ->where('a.created_at >=', date('Y-01-01 00:00:00'))
            ->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00')
            ->groupBy('a.id')
            ->orderBy('a.created_at', 'DESC');

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(a.created_at)', $bulan);
        }

        return $builder;
    }

    public function getDataDetail($param)
    {
        return $this->db->table('txn_takah a')
            ->select('
                a.id AS log_id,
                a.period,
                a.period_start_date,
                a.period_end_date,
                b.*,
                c.logo,
                c.kodeins AS kode_instansi,
                c.nama AS nama_instansi,
                a.created_by AS upload_by,
                b.created_at AS tanggal_upload
            ')
            ->join('txn_takah_detail b', 'b.takah_log_id = a.id', 'left')
            ->join('data_instansi c', 'c.kodeins = b.instansi_id', 'left')
            ->where('b.instansi_id IS NOT NULL', null, false)
            ->where('a.id', (int) $param);
    }

    public function getSummary($bulan = [])
    {
        $builder = $this->db->table('txn_takah a');
        $builder->select("
            COUNT(DISTINCT a.id) AS total_upload,
            COUNT(DISTINCT b.nip) AS total_nip,
            COUNT(DISTINCT b.instansi_id) AS total_instansi,
            SUM(
                COALESCE(b.d2nip,0) + COALESCE(b.ijazah,0) + COALESCE(b.akta,0) + COALESCE(b.drh,0) +
                COALESCE(b.cpns,0) + COALESCE(b.pns,0) + COALESCE(b.perubahan,0) + COALESCE(b.kp,0) +
                COALESCE(b.jabatan,0) + COALESCE(b.berhenti,0) + COALESCE(b.pensiun,0)
            ) AS total_dokumen,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ", false);
        $builder->join('txn_takah_detail b', 'b.takah_log_id = a.id', 'left');
        $builder->where('a.created_at >=', date('Y-01-01 00:00:00'));
        $builder->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (is_array($bulan) && !empty($bulan)) {
            $builder->whereIn('MONTH(a.created_at)', $bulan);
        }

        return $builder->get()->getRowArray() ?? [
            'total_upload'   => 0,
            'total_nip'      => 0,
            'total_instansi' => 0,
            'total_dokumen'  => 0,
            'last_update'    => null,
        ];
    }
}
