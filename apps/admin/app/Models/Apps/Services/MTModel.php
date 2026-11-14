<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class MTModel extends Model
{
    protected $table = 'txn_mt';

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
        $query = $builder->get();
        return $query->getFieldNames();
    }

    public function getDataRecap($params = [])
    {
        $bulan = $params['bulan'] ?? [];
        $category = strtolower(trim((string) ($params['category'] ?? '')));
        $periodYear = (int) ($params['period_year'] ?? date('Y'));

        $builder = $this->db->table('txn_mt a')
            ->select("
                a.*,
                b.nama AS instansi_name,
                b.wilayah,
                b.kanreg,
                b.logo,
                c.step_name,
                (
                    SELECT d.activity_type
                    FROM txn_mt_detail d
                    WHERE d.mt_id = a.id
                    ORDER BY d.id DESC
                    LIMIT 1
                ) AS activity_type,
                (
                    SELECT d.description
                    FROM txn_mt_detail d
                    WHERE d.mt_id = a.id
                    ORDER BY d.id DESC
                    LIMIT 1
                ) AS description,
                (
                    SELECT d.description
                    FROM txn_mt_detail d
                    WHERE d.mt_id = a.id
                    ORDER BY d.id DESC
                    LIMIT 1
                ) AS catatan,
                DATE_FORMAT(a.period_date, '%d %M %Y') AS mulai_implemen,
                DATE_FORMAT(a.updated_at, '%d %M %Y %H:%i:%s') AS diperbaharui,
                CONCAT(
                    (
                        SELECT SUM(d.percentage)
                        FROM data_support_mt d
                        WHERE d.id <= a.rw_mt_id
                    ),
                    '%'
                ) AS total_percentase
            ")
            ->join('data_instansi b', 'b.kodeins = a.instansi_id', 'left')
            ->join('data_support_mt c', 'c.id = a.rw_mt_id', 'left')
            ->groupBy('a.id')
            ->orderBy('a.created_at', 'DESC');

        if ($periodYear > 2000) {
            $builder->where('YEAR(COALESCE(a.period_date, a.created_at)) =', $periodYear, false);
        }

        // 🔹 FILTER BULAN (IN)
        if (!empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(a.period_date, a.created_at))', $bulan, false);
        }

        // 🔹 FILTER KATEGORI TAHAPAN
        if ($category === 'mandiri') {
            $builder->where('a.rw_mt_id >=', 7);
        } elseif ($category === 'pendampingan') {
            $builder->where('a.rw_mt_id <', 7);
        } elseif (is_numeric($category) && (int) $category >= 1 && (int) $category <= 8) {
            $builder->where('a.rw_mt_id', (int) $category);
        }

        return $builder;
    }

    public function getStepMT(){
        $rawSql = "
            SELECT
                a.*
            FROM data_support_mt a
            ORDER BY a.id ASC
        ";
        return $this->db->table("($rawSql) recap");
    }
}
