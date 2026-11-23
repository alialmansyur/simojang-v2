<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class SuratModel extends Model
{
    protected $table = 'txn_naskah_surat';

    public function __construct(){
        parent::__construct();
    }

    // ----------------------------
    //  QUERY BUILDER UTAMA
    // ----------------------------    
    public function getBuilder($type, $param = null){
        switch ($type) {
            case 'recap':
                return $this->getDataRecap($param);
            default:
                throw new \Exception("Unknown builder type: $type");
        }
    }    

    // ----------------------------
    //  DAPATKAN NAMA KOLOM OTOMATIS
    // ----------------------------    
    public function getColumns($type, $id = null){
        $builder = $this->getBuilder($type, $id);
        $query = $builder->get();
        return $query->getFieldNames();
    }  

    public function getDataRecap($params = [])
    {
        $bulan = $params['bulan'] ?? [];
        $jenisId = $params['jenis_id'] ?? null;

        $builder = $this->db->table('txn_naskah_surat a')
            ->select([
                'a.*',
                'b.nama AS jenis_naskah',
                'b.kode AS jenis_kode',
                'c.kode AS klasifikasi_kode',
                'c.nama AS klasifikasi_nama'
            ])
            ->join('data_support_naskah_jenis b', 'b.id = a.jenis_id', 'left')
            ->join('data_support_naskah_klasifikasi c', 'c.id = a.klasifikasi_id', 'left')
            ->where('a.created_at >=', date('Y-01-01 00:00:00'))
            ->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        // FILTER BULAN (IN)
        if (!empty($bulan)) {
            $builder->whereIn('MONTH(a.created_at)', $bulan);
        }

        // FILTER JENIS (1 = Surat Masuk, 2 = Surat Keluar)
        if (!empty($jenisId)) {
            $builder->where('a.jenis_id', $jenisId);
        }

        $builder->orderBy('a.created_at', 'DESC');

        return $builder;
    }

    public function getSummary(array $bulan = [], $jenisId = null)
    {
        $builder = $this->db->table('txn_naskah_surat a')
            ->select('
                COUNT(1) AS total_data,
                SUM(COALESCE(a.total, 0)) AS total_surat,
                SUM(COALESCE(a.total, 0)) AS total_naskah,
                SUM(CASE WHEN a.jenis_id = 1 THEN COALESCE(a.total, 0) ELSE 0 END) AS surat_masuk,
                SUM(CASE WHEN a.jenis_id = 2 THEN COALESCE(a.total, 0) ELSE 0 END) AS surat_keluar,
                COUNT(DISTINCT a.klasifikasi_id) AS total_klasifikasi,
                MAX(a.created_at) AS last_update
            ')
            ->where('a.created_at >=', date('Y-01-01 00:00:00'))
            ->where('a.created_at <', (date('Y') + 1) . '-01-01 00:00:00');

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(a.created_at)', $bulan);
        }

        if (!empty($jenisId)) {
            $builder->where('a.jenis_id', $jenisId);
        }

        return $builder->get()->getRowArray();
    }
}
