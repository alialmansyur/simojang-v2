<?php

namespace App\Models\Apps\Modules;

use CodeIgniter\Model;

class FetchModel extends Model
{
    protected $table = 'txn_activity_upload_logs';

    public function __construct(){
        parent::__construct();
    }

    public function getDataUploader(int $layananId, array $bulan = [], string $docCategory = '')
    {
        $builder = $this->db->table('txn_activity_upload_logs a')
            ->select('
                a.*,
                (SELECT COUNT(*) FROM txn_activity_upload_detail d WHERE d.upload_id = a.id) AS total_instansi,
                (SELECT COALESCE(SUM(d.usul_masuk), 0) FROM txn_activity_upload_detail d WHERE d.upload_id = a.id) AS total_usul
            ')
            ->where('a.layanan_id', $layananId)
            ->orderBy('a.created_at', 'DESC');

        if (!empty($bulan)) {
            $bulanList = implode(',', array_map('intval', $bulan));
            $builder->groupStart()
                ->whereIn('MONTH(a.created_at)', $bulan)
                ->orWhere("CAST(SUBSTRING_INDEX(a.period, '-', -1) AS UNSIGNED) IN ({$bulanList})", null, false)
                ->groupEnd();
        }

        if ($docCategory !== '') {
            $builder->where('a.doc_category', $docCategory);
        }

        return $builder;
    }

    public function getDataUploaderDetail(int $uploadId)
    {
        return $this->db->table('txn_activity_upload_detail a')
            ->select('b.nama, b.logo, a.*')
            ->join('data_instansi b', 'b.kodeins = a.instansi_id', 'left')
            ->where('a.upload_id', $uploadId)
            ->orderBy('a.id', 'ASC');
    }

    public function getUploaderSummary(int $layananId, array $bulan = [], string $docCategory = '')
    {
        $builder = $this->db->table('txn_activity_upload_logs a')
            ->select('
                COUNT(DISTINCT a.id) AS total_file,
                MAX(a.created_at) AS last_upload,
                MIN(a.created_at) AS first_upload,
                COUNT(DISTINCT COALESCE(NULLIF(a.period, ""), DATE_FORMAT(a.created_at, "%Y-%m"))) AS active_periods,
                COUNT(d.id) AS total_baris_detail,
                COUNT(DISTINCT d.instansi_id) AS total_instansi,
                COALESCE(SUM(d.usul_masuk), 0) AS total_usul
            ')
            ->join('txn_activity_upload_detail d', 'd.upload_id = a.id', 'left')
            ->where('a.layanan_id', $layananId);

        if (!empty($bulan)) {
            $bulanList = implode(',', array_map('intval', $bulan));
            $builder->groupStart()
                ->whereIn('MONTH(a.created_at)', $bulan)
                ->orWhere("CAST(SUBSTRING_INDEX(a.period, '-', -1) AS UNSIGNED) IN ({$bulanList})", null, false)
                ->groupEnd();
        }

        if ($docCategory !== '') {
            $builder->where('a.doc_category', $docCategory);
        }

        $summary = $builder->get()->getRowArray();

        $catBuilder = $this->db->table('txn_activity_upload_logs a')
            ->select('a.doc_category, COUNT(a.id) AS total')
            ->where('a.layanan_id', $layananId);

        if (!empty($bulan)) {
            $bulanList = implode(',', array_map('intval', $bulan));
            $catBuilder->groupStart()
                ->whereIn('MONTH(a.created_at)', $bulan)
                ->orWhere("CAST(SUBSTRING_INDEX(a.period, '-', -1) AS UNSIGNED) IN ({$bulanList})", null, false)
                ->groupEnd();
        }

        $catRows = $catBuilder->groupBy('a.doc_category')->get()->getResultArray();
        $categoryCounts = [];
        $totalAllFiles = 0;
        foreach ($catRows as $cRow) {
            $cnt = (int) ($cRow['total'] ?? 0);
            $totalAllFiles += $cnt;
            $catKey = trim((string) ($cRow['doc_category'] ?? ''));
            if ($catKey !== '') {
                $categoryCounts[$catKey] = ($categoryCounts[$catKey] ?? 0) + $cnt;
            }
        }

        return [
            'total_file' => (int) ($summary['total_file'] ?? 0),
            'total_all_files' => $totalAllFiles,
            'total_baris_detail' => (int) ($summary['total_baris_detail'] ?? 0),
            'total_instansi' => (int) ($summary['total_instansi'] ?? 0),
            'total_usul' => (int) ($summary['total_usul'] ?? 0),
            'last_upload' => $summary['last_upload'] ?? null,
            'first_upload' => $summary['first_upload'] ?? null,
            'active_periods' => (int) ($summary['active_periods'] ?? 0),
            'category_counts' => $categoryCounts,
        ];
    }

}
