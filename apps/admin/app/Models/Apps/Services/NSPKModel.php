<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class NSPKModel extends Model
{
    protected $table = 'txn_nspk';

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
        $level = strtoupper(trim((string) ($params['level'] ?? $params['kategori'] ?? $params['category'] ?? '')));

        $builder = $this->db->table('txn_nspk a')
            ->select('a.*, b.kodeins, b.nama instansi_name, b.kanreg, UPPER(b.wilayah) wilayah, b.logo, COALESCE(p.nama, u.fullname) AS created_by_name')
            ->join('data_instansi b', 'b.kodeins = a.instansi_id', 'left')
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

        // 🔹 FILTER LEVEL INDEKS
        if ($level !== '' && $level !== 'ALL') {
            $builder->where('a.level', $level);
        }

        return $builder;
    }

    public function getSummary(array $bulan = [])
    {
        $builder = $this->db->table('txn_nspk a')
            ->select('
                COUNT(1) AS total_data,
                COUNT(DISTINCT a.instansi_id) AS total_instansi,
                SUM(CASE WHEN a.level = "A" THEN 1 ELSE 0 END) AS level_a,
                SUM(CASE WHEN a.level = "B" THEN 1 ELSE 0 END) AS level_b,
                SUM(CASE WHEN a.level = "C" THEN 1 ELSE 0 END) AS level_c,
                SUM(CASE WHEN a.level = "D" THEN 1 ELSE 0 END) AS level_d,
                ROUND(AVG(a.nilai), 2) AS avg_nilai,
                MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
            ')
            ->where('a.created_at >=', date('Y-01-01 00:00:00'))
            ->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(a.created_at)', $bulan);
        }

        return $builder->get()->getRowArray();
    }

    public function isDuplicateNSPK($instansiId, $period, $excludeKey = null){
        $builder = $this->db->table('txn_nspk')
            ->where('instansi_id', $instansiId)
            ->where('period', $period);

        if (!empty($excludeKey)) {
            if (is_numeric($excludeKey)) {
                $builder->where('id !=', (int) $excludeKey);
            } else {
                $builder->where('uid !=', $excludeKey);
            }
        }

        return $builder->countAllResults() > 0;
    }

} 
