<?php

namespace App\Models\Apps;

use CodeIgniter\Model;

class ActivityGalleryModel extends Model
{
    protected $table = 'txn_kegiatan_galeri';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'uid', 'timkerja_id', 'layanan_id', 'judul', 'deskripsi', 'tanggal_kegiatan', 
        'file_name', 'file_original_name', 'file_size', 'file_ext', 'file_path',
        'created_at', 'updated_at'
    ];

    public function __construct($db = null, ?\CodeIgniter\Validation\ValidationInterface $validation = null){
        parent::__construct($db, $validation);
    }

    /**
     * Build shared filtered query for gallery records.
     */
    private function buildFilteredQuery($search = null, $timkerja_id = null, $bulan = null, $months = null, bool $withJoins = true)
    {
        $builder = $this->db->table($this->table . ' a');

        if ($withJoins) {
            $builder->select('a.*, b.nama as team_name, c.nama_layanan')
                    ->join('data_timkerja b', 'a.timkerja_id = b.id', 'left')
                    ->join('data_timkerja_layanan c', 'a.layanan_id = c.id', 'left');
        }

        if (!empty($search)) {
            $builder->groupStart()
                    ->like('a.judul', $search)
                    ->orLike('a.deskripsi', $search)
                    ->groupEnd();
        }

        if (!empty($timkerja_id)) {
            $builder->where('a.timkerja_id', $timkerja_id);
        }

        if (!empty($bulan)) {
            // $bulan format is 'YYYY-MM'
            $builder->like('a.tanggal_kegiatan', $bulan, 'after');
        }

        if (!empty($months)) {
            $monthList = is_array($months)
                ? $months
                : array_filter(array_map('trim', explode(',', (string) $months)));
            $validMonths = [];
            foreach ($monthList as $m) {
                $num = (int) $m;
                if ($num >= 1 && $num <= 12) {
                    $validMonths[] = $num;
                }
            }
            if (!empty($validMonths)) {
                $builder->whereIn('MONTH(a.tanggal_kegiatan)', $validMonths);
            }
        }

        return $builder;
    }

    public function getAllData($search = null, $timkerja_id = null, $bulan = null, $months = null)
    {
        return $this->buildFilteredQuery($search, $timkerja_id, $bulan, $months, true)
                    ->orderBy('a.tanggal_kegiatan', 'DESC')
                    ->orderBy('a.id', 'DESC')
                    ->get()
                    ->getResultArray();
    }

    public function getPaginatedData($search = null, $timkerja_id = null, $bulan = null, $months = null, int $page = 1, int $perPage = 12): array
    {
        $total = (int) $this->buildFilteredQuery($search, $timkerja_id, $bulan, $months, false)
                            ->countAllResults();

        $totalPages = max(1, (int) ceil($total / $perPage));
        $safePage = min(max(1, $page), $totalPages);
        $offset = ($safePage - 1) * $perPage;

        $rows = $this->buildFilteredQuery($search, $timkerja_id, $bulan, $months, true)
                     ->orderBy('a.tanggal_kegiatan', 'DESC')
                     ->orderBy('a.id', 'DESC')
                     ->limit($perPage, $offset)
                     ->get()
                     ->getResultArray();

        return [
            'rows'        => $rows,
            'total'       => $total,
            'page'        => $safePage,
            'per_page'    => $perPage,
            'total_pages' => $totalPages,
        ];
    }

    public function getCategorySummary($search = null, $bulan = null, $months = null): array
    {
        $rows = $this->buildFilteredQuery($search, null, $bulan, $months, false)
                     ->select('a.timkerja_id, COUNT(a.id) as total')
                     ->groupBy('a.timkerja_id')
                     ->get()
                     ->getResultArray();

        $totalAll = 0;
        $teamCounts = [];
        foreach ($rows as $row) {
            $count = (int) ($row['total'] ?? 0);
            $totalAll += $count;
            if (!empty($row['timkerja_id'])) {
                $teamCounts[(string) $row['timkerja_id']] = $count;
            }
        }

        return [
            'total_all'   => $totalAll,
            'team_counts' => $teamCounts,
        ];
    }

    public function getTimKerja()
    {
        return $this->db->table('data_timkerja')
                        ->where('is_show', 1)
                        ->orderBy('nama', 'ASC')
                        ->get()
                        ->getResultArray();
    }

    public function getLayananByTimKerja($timkerja_id)
    {
        return $this->db->table('data_timkerja_layanan')
                        ->where('timkerja_id', $timkerja_id)
                        ->where('is_show', 1)
                        ->orderBy('nama_layanan', 'ASC')
                        ->get()
                        ->getResultArray();
    }
}
