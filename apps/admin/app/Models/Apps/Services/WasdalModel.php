<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class WasdalModel extends Model
{
    protected $table = 'txn_wasdal';

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
        $kategori = trim((string) ($params['kategori'] ?? $params['category'] ?? ''));

        $builder = $this->db->table('txn_wasdal a')
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

        // 🔹 FILTER KATEGORI PERMASALAHAN
        if ($kategori !== '' && strtolower($kategori) !== 'all') {
            $norm = strtolower($kategori);
            if ($norm === 'netralitas asn' || $norm === 'netralitas') {
                $builder->like('a.permasalahan', 'Netralitas');
            } elseif ($norm === 'disiplin pegawai' || $norm === 'disiplin') {
                $builder->like('a.permasalahan', 'Disiplin');
            } elseif ($norm === 'kode etik') {
                $builder->like('a.permasalahan', 'Kode Etik');
            } elseif ($norm === 'lainnya') {
                $builder->groupStart()
                    ->notLike('a.permasalahan', 'Netralitas')
                    ->notLike('a.permasalahan', 'Disiplin')
                    ->notLike('a.permasalahan', 'Kode Etik')
                    ->groupEnd();
            } else {
                $builder->like('a.permasalahan', $kategori);
            }
        }

        return $builder;
    }

    public function getSummary(array $bulan = [])
    {
        $baseFilter = function ($builder) use ($bulan) {
            $builder->where('a.created_at >=', date('Y-01-01 00:00:00'));
            $builder->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');
            if (!empty($bulan)) {
                $builder->whereIn('MONTH(a.created_at)', $bulan);
            }
            return $builder;
        };

        $totals = $baseFilter(
            $this->db->table('txn_wasdal a')
                ->select('
                    COUNT(1) AS total_data,
                    SUM(COALESCE(a.total, 0)) AS total_kasus,
                    COUNT(DISTINCT a.instansi_id) AS total_instansi,
                    SUM(CASE WHEN a.permasalahan LIKE "%Netralitas%" THEN 1 ELSE 0 END) AS netralitas_count,
                    SUM(CASE WHEN a.permasalahan LIKE "%Disiplin%" THEN 1 ELSE 0 END) AS disiplin_count,
                    SUM(CASE WHEN a.permasalahan LIKE "%Kode Etik%" THEN 1 ELSE 0 END) AS kode_etik_count,
                    SUM(CASE WHEN a.permasalahan NOT LIKE "%Netralitas%" AND a.permasalahan NOT LIKE "%Disiplin%" AND a.permasalahan NOT LIKE "%Kode Etik%" THEN 1 ELSE 0 END) AS lainnya_count,
                    MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
                ')
        )->get()->getRowArray();

        $topInstansi = $baseFilter(
            $this->db->table('txn_wasdal a')
                ->select('
                    a.instansi_id,
                    COALESCE(i.nama, "-") AS instansi_name,
                    SUM(COALESCE(a.total, 0)) AS total_kasus
                ')
                ->join('data_instansi i', 'i.kodeins = a.instansi_id', 'left')
                ->groupBy('a.instansi_id, i.nama')
                ->orderBy('total_kasus', 'DESC')
                ->limit(5)
        )->get()->getResultArray();

        $topPermasalahan = $baseFilter(
            $this->db->table('txn_wasdal a')
                ->select('
                    COALESCE(NULLIF(TRIM(a.permasalahan), ""), "-") AS permasalahan,
                    SUM(COALESCE(a.total, 0)) AS total_kasus
                ')
                ->groupBy('COALESCE(NULLIF(TRIM(a.permasalahan), ""), "-")')
                ->orderBy('total_kasus', 'DESC')
                ->limit(5)
        )->get()->getResultArray();

        return [
            'total_data' => (int) ($totals['total_data'] ?? 0),
            'total_kasus' => (int) ($totals['total_kasus'] ?? 0),
            'total_instansi' => (int) ($totals['total_instansi'] ?? 0),
            'netralitas_count' => (int) ($totals['netralitas_count'] ?? 0),
            'disiplin_count' => (int) ($totals['disiplin_count'] ?? 0),
            'kode_etik_count' => (int) ($totals['kode_etik_count'] ?? 0),
            'lainnya_count' => (int) ($totals['lainnya_count'] ?? 0),
            'last_update' => $totals['last_update'] ?? null,
            'top_instansi' => $topInstansi,
            'top_permasalahan' => $topPermasalahan,
        ];
    }

}
