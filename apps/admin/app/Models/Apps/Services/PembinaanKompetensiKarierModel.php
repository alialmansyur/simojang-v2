<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class PembinaanKompetensiKarierModel extends Model
{
    protected $table = 'txn_pembinaan_kompetensi_karier';

    public function getBuilder(string $type, $params = null)
    {
        switch ($type) {
            case 'recap':
                return $this->getDataRecap($params);
            default:
                throw new \Exception("Unknown builder type: {$type}");
        }
    }

    public function getColumns(string $type, $params = null): array
    {
        if ($type === 'recap') {
            return [
                'id',
                'period_year',
                'tanggal_kegiatan',
                'tanggal_kegiatan_label',
                'judul_kegiatan',
                'materi',
                'total_partisipan',
                'metode',
                'lokasi',
                'penyelenggara',
                'eviden_link',
                'catatan',
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
                'updated_at_label',
            ];
        }

        return [];
    }

    public function getDataRecap(array $params = [])
    {
        $periodYear = (int) ($params['period_year'] ?? date('Y'));
        $category = strtolower(trim((string) ($params['category'] ?? '')));
        $periodMonths = array_values(array_filter(array_map('intval', (array) ($params['period_months'] ?? [])), static fn($m) => $m >= 1 && $m <= 12));
        if (empty($periodMonths)) {
            $periodMonth = (int) ($params['period_month'] ?? 0);
            if ($periodMonth >= 1 && $periodMonth <= 12) {
                $periodMonths = [$periodMonth];
            }
        }

        $sql = "
            SELECT
                a.id,
                a.period_year,
                a.tanggal_kegiatan,
                DATE_FORMAT(a.tanggal_kegiatan, '%d %M %Y') AS tanggal_kegiatan_label,
                a.judul_kegiatan,
                a.materi,
                a.total_partisipan,
                a.metode,
                a.lokasi,
                a.penyelenggara,
                a.eviden_link,
                a.catatan,
                a.created_by,
                a.updated_by,
                a.created_at,
                a.updated_at,
                DATE_FORMAT(a.updated_at, '%d %M %Y %H:%i:%s') AS updated_at_label
            FROM txn_pembinaan_kompetensi_karier a
        ";

        $builder = $this->db->table("({$sql}) recap")
            ->where('period_year', $periodYear)
            ->orderBy('tanggal_kegiatan', 'DESC')
            ->orderBy('updated_at', 'DESC');

        if (!empty($periodMonths)) {
            $builder->whereIn('MONTH(tanggal_kegiatan)', $periodMonths, false);
        }

        if ($category === 'klasikal') {
            $builder->whereIn('LOWER(metode)', ['klasikal', 'tatap muka', 'offline']);
        } elseif ($category === 'daring') {
            $builder->whereIn('LOWER(metode)', ['daring (zoom)', 'daring', 'online']);
        } elseif ($category === 'hybrid') {
            $builder->where('LOWER(metode)', 'hybrid');
        }

        return $builder;
    }

    public function getPeriodYears(): array
    {
        $data = $this->db->table($this->table)
            ->select('period_year')
            ->groupBy('period_year')
            ->orderBy('period_year', 'DESC')
            ->get()
            ->getResultArray();

        $years = array_map(static fn($r) => (int) ($r['period_year'] ?? 0), $data);
        $years = array_values(array_filter($years));
        if (empty($years)) {
            $years = [(int) date('Y')];
        }

        return array_values(array_unique($years));
    }

    public function getSummary(array $params = []): array
    {
        $periodYear = (int) ($params['period_year'] ?? date('Y'));
        $periodMonths = array_values(array_filter(array_map('intval', (array) ($params['period_months'] ?? [])), static fn($m) => $m >= 1 && $m <= 12));
        if (empty($periodMonths)) {
            $periodMonth = (int) ($params['period_month'] ?? 0);
            if ($periodMonth >= 1 && $periodMonth <= 12) {
                $periodMonths = [$periodMonth];
            }
        }

        $builder = $this->db->table($this->table)
            ->select("
                COUNT(id) AS total_kegiatan,
                SUM(total_partisipan) AS total_partisipan,
                ROUND(AVG(total_partisipan), 2) AS avg_partisipan,
                SUM(CASE WHEN LOWER(metode) IN ('klasikal', 'tatap muka', 'offline') THEN 1 ELSE 0 END) AS total_tatap_muka,
                SUM(CASE WHEN LOWER(metode) = 'hybrid' THEN 1 ELSE 0 END) AS total_hybrid,
                SUM(CASE WHEN LOWER(metode) IN ('daring (zoom)', 'online', 'daring') THEN 1 ELSE 0 END) AS total_online,
                MAX(updated_at) AS last_update
            ")
            ->where('period_year', $periodYear);

        if (!empty($periodMonths)) {
            $builder->whereIn('MONTH(tanggal_kegiatan)', $periodMonths, false);
        }

        $row = $builder->get()->getRowArray() ?? [];

        return [
            'total_data' => (int) ($row['total_kegiatan'] ?? 0),
            'total_kegiatan' => (int) ($row['total_kegiatan'] ?? 0),
            'total_partisipan' => (int) ($row['total_partisipan'] ?? 0),
            'avg_partisipan' => (float) ($row['avg_partisipan'] ?? 0),
            'total_tatap_muka' => (int) ($row['total_tatap_muka'] ?? 0),
            'metode_klasikal' => (int) ($row['total_tatap_muka'] ?? 0),
            'total_hybrid' => (int) ($row['total_hybrid'] ?? 0),
            'total_online' => (int) ($row['total_online'] ?? 0),
            'metode_daring' => (int) ($row['total_online'] ?? 0),
            'last_update' => $row['last_update'] ?? null,
        ];
    }
}
