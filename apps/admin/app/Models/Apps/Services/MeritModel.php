<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class MeritModel extends Model
{
    protected $table = 'txn_merit';

    public function __construct(){
        parent::__construct();
    }

    // ----------------------------
    //  QUERY BUILDER UTAMA
    // ----------------------------    
    public function getBuilder($type, $params = null){
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
    public function getColumns($type, $id = null){
        $builder = $this->getBuilder($type, $id);
        $query = $builder->limit(1)->get();
        return $query->getFieldNames();
    }    

    public function saveData($data, $key = null)
    {
        if ($key) {
            $builder = $this->db->table($this->table);
            if (is_numeric($key)) {
                $builder->where('id', (int) $key);
            } else {
                $builder->where('uid', $key);
            }
            $builder->update($data);
            return $key;
        } else {
            $this->db->table($this->table)->insert($data);
            return $this->db->insertID();
        }
    }

    public function deleteData($key)
    {
        $builder = $this->db->table($this->table);
        if (is_numeric($key)) {
            $builder->where('id', (int) $key);
        } else {
            $builder->where('uid', $key);
        }
        return $builder->delete();
    }

    public function logActivity($data)
    {
        $this->db->table('activity_daily_logs')->insert($data);
        return $this->db->insertID();
    }

    public function getDataRecap($params = [])
    {
        $bulan = $params['bulan'] ?? [];
        $kategori = strtolower(trim((string) ($params['kategori'] ?? $params['category'] ?? '')));

        $builder = $this->db->table('txn_merit a')
            ->select('a.*, COALESCE(p.nama, u.fullname) AS created_by_name')
            ->join('data_pegawai p', 'p.nip = a.created_by', 'left')
            ->join('auth_users u', 'u.username = a.created_by', 'left')
            ->where('a.created_at >=', date('Y-01-01 00:00:00'))
            ->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00')
            ->groupBy('a.id')
            ->orderBy('a.created_at', 'DESC');

        // 🔹 FILTER BULAN (IN)
        if (!empty($bulan)) {
            $builder->whereIn('MONTH(a.created_at)', $bulan);
        }

        // 🔹 FILTER KATEGORI SLA
        if ($kategori === 'sesuai') {
            $builder->where('a.persentase_sla >=', 80);
        } elseif ($kategori === 'tidak_sesuai') {
            $builder->where('a.persentase_sla <', 80);
        }

        return $builder;
    }

    public function getSummary(array $bulan = [])
    {
        $builder = $this->db->table('txn_merit')
            ->select('
                COUNT(1) AS total_data,
                COUNT(DISTINCT period) AS total_periode,
                SUM(COALESCE(usul_masuk, 0)) AS total_usul,
                SUM(COALESCE(ms, 0)) AS total_ms,
                SUM(COALESCE(tms, 0)) AS total_tms,
                SUM(COALESCE(total_realisasi, 0)) AS total_realisasi,
                SUM(COALESCE(sla_sesuai, 0)) AS total_sla_sesuai,
                SUM(COALESCE(sla_tidak_sesuai, 0)) AS total_sla_tidak_sesuai,
                ROUND(AVG(COALESCE(persentase_sla, 0)), 2) AS rata_sla,
                SUM(CASE WHEN persentase_sla >= 80 THEN 1 ELSE 0 END) AS sesuai_count,
                SUM(CASE WHEN persentase_sla < 80 THEN 1 ELSE 0 END) AS tidak_sesuai_count,
                MAX(COALESCE(updated_at, created_at)) AS last_update
            ')
            ->where('created_at >=', date('Y-01-01 00:00:00'))
            ->where('created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(created_at)', $bulan);
        }

        return $builder->get()->getRowArray();
    }

}
