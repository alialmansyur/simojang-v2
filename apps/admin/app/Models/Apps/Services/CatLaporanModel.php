<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class CatLaporanModel extends Model
{
    protected $table            = 'txn_cat_laporan';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'uid',
        'jenis_laporan',
        'nomor_dokumen',
        'judul_laporan',
        'tanggal_dokumen',
        'tanggal_pelaksanaan',
        'jenis_tes_id',
        'seleksi_id',
        'tilok_id',
        'instansi_id',
        'periode',
        'status',
        'params_json',
        'data_snapshot_json',
        'signers_json',
        'evidence_json',
        'created_by_nip',
        'created_by_name',
        'created_at',
        'updated_at',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * Get API document list with filters and join for rich display
     */
    public function getApiDocumentList(array $params = []): array
    {
        $page    = max(1, (int) ($params['page'] ?? 1));
        $limit   = max(1, min(200, (int) ($params['limit'] ?? 20)));
        $offset  = ($page - 1) * $limit;
        $keyword = trim((string) ($params['keyword'] ?? ''));

        $builder = $this->db->table('txn_cat_laporan a');
        $builder->select('a.*, s.nama_seleksi, t.nama_tilok');
        $builder->join('txn_cat_seleksi s', 's.id = a.seleksi_id', 'left');
        $builder->join('txn_cat_tilok t', 't.uid = a.tilok_id OR t.id = a.tilok_id', 'left');

        if (!empty($params['jenis_laporan']) && $params['jenis_laporan'] !== 'all') {
            $builder->where('a.jenis_laporan', $params['jenis_laporan']);
        }
        if (!empty($params['status']) && $params['status'] !== 'all') {
            $builder->where('a.status', $params['status']);
        }
        if (!empty($params['seleksi_id'])) {
            $builder->where('a.seleksi_id', $params['seleksi_id']);
        }
        if (!empty($params['tilok_id'])) {
            $builder->groupStart()
                ->where('a.tilok_id', $params['tilok_id'])
                ->orWhere('t.uid', $params['tilok_id'])
                ->orWhere('t.id', $params['tilok_id'])
            ->groupEnd();
        }
        if (!empty($params['jenis_tes_id'])) {
            $builder->where('a.jenis_tes_id', $params['jenis_tes_id']);
        }
        if (!empty($params['instansi_id']) && $params['instansi_id'] !== 'all') {
            $builder->groupStart()
                ->where('a.instansi_id', (string) $params['instansi_id'])
                ->orLike('a.instansi_id', (string) $params['instansi_id'])
            ->groupEnd();
        }

        if ($keyword !== '') {
            $builder->groupStart()
                ->like('a.nomor_dokumen', $keyword)
                ->orLike('a.judul_laporan', $keyword)
                ->orLike('a.created_by_name', $keyword)
                ->orLike('s.nama_seleksi', $keyword)
                ->orLike('t.nama_tilok', $keyword)
            ->groupEnd();
        }

        $totalBuilder = clone $builder;
        $total = $totalBuilder->countAllResults(false);

        $builder->orderBy('a.id', 'DESC');
        $builder->limit($limit, $offset);
        $rows = $builder->get()->getResultArray();

        // Process rows (parse JSON summaries for fast UI display)
        foreach ($rows as &$row) {
            $signers = !empty($row['signers_json']) ? json_decode($row['signers_json'], true) : [];
            $row['signers_summary'] = [
                'kiri'   => $signers['kiri']['nama'] ?? '',
                'tengah' => $signers['tengah']['nama'] ?? '',
                'kanan'  => $signers['kanan']['nama'] ?? '',
                'signed_count' => count(array_filter($signers ?: [], fn($s) => !empty($s['isSigned']))),
            ];
            $paramsData = !empty($row['params_json']) ? json_decode($row['params_json'], true) : [];
            $row['instansi_names'] = $paramsData['instansiNames'] ?? [];
        }

        return [
            'rows'  => $rows,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ];
    }

    /**
     * Summary Metrics
     */
    public function getSummaryMetrics(array $params = []): array
    {
        $builder = $this->db->table('txn_cat_laporan a');
        $builder->join('txn_cat_tilok t', 't.uid = a.tilok_id OR t.id = a.tilok_id', 'left');

        if (!empty($params['jenis_laporan']) && $params['jenis_laporan'] !== 'all') {
            $builder->where('a.jenis_laporan', $params['jenis_laporan']);
        }
        if (!empty($params['seleksi_id'])) {
            $builder->where('a.seleksi_id', $params['seleksi_id']);
        }
        if (!empty($params['tilok_id'])) {
            $builder->groupStart()
                ->where('a.tilok_id', $params['tilok_id'])
                ->orWhere('t.uid', $params['tilok_id'])
                ->orWhere('t.id', $params['tilok_id'])
            ->groupEnd();
        }

        $total = (clone $builder)->countAllResults(false);
        $published = (clone $builder)->where('a.status', 'published')->countAllResults(false);
        $draft = (clone $builder)->where('a.status', 'draft')->countAllResults(false);

        return [
            'total'     => $total,
            'published' => $published,
            'draft'     => $draft,
        ];
    }
}
