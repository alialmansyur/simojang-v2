<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class ManageRuanganModel extends Model
{
    protected $table = 'data_ruangan';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'uid',
        'kantor',
        'kode_ruangan',
        'nama_ruangan',
        'lantai',
        'kapasitas',
        'spesifikasi',
        'foto',
        'deskripsi',
        'status',
        'created_by',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function __construct()
    {
        parent::__construct();
    }

    // ----------------------------------------------------
    // QUERY BUILDER UTAMA (DATATABLES SERVER-SIDE)
    // ----------------------------------------------------
    public function getBuilder($type, $param = null)
    {
        switch ($type) {
            case 'ruangan':
            case 'detail':
                return $this->getDataRuanganBuilder($param);
            default:
                throw new \Exception("Unknown builder type: $type");
        }
    }

    // ----------------------------------------------------
    // DEFINISI KOLOM DATATABLES
    // ----------------------------------------------------
    public function getColumns($type, $id = null)
    {
        switch ($type) {
            case 'ruangan':
            case 'detail':
                return [
                    ['data' => 'id', 'search' => 'a.id', 'order' => 'a.id'],
                    ['data' => 'uid', 'search' => 'a.uid', 'order' => 'a.uid'],
                    ['data' => 'kantor', 'search' => 'a.kantor', 'order' => 'a.kantor'],
                    ['data' => 'kode_ruangan', 'search' => 'a.kode_ruangan', 'order' => 'a.kode_ruangan'],
                    ['data' => 'nama_ruangan', 'search' => 'a.nama_ruangan', 'order' => 'a.nama_ruangan'],
                    ['data' => 'lantai', 'search' => 'a.lantai', 'order' => 'a.lantai'],
                    ['data' => 'kapasitas', 'search' => 'a.kapasitas', 'order' => 'a.kapasitas'],
                    ['data' => 'spesifikasi', 'search' => 'a.spesifikasi', 'order' => 'a.spesifikasi'],
                    ['data' => 'foto', 'search' => null, 'order' => null],
                    ['data' => 'deskripsi', 'search' => 'a.deskripsi', 'order' => 'a.deskripsi'],
                    ['data' => 'status', 'search' => 'a.status', 'order' => 'a.status'],
                    ['data' => 'total_assets', 'search' => null, 'order' => 'total_assets'],
                    ['data' => 'created_at', 'search' => 'a.created_at', 'order' => 'a.created_at'],
                    ['data' => 'updated_at', 'search' => 'a.updated_at', 'order' => 'a.updated_at'],
                ];
            default:
                throw new \Exception("Unknown builder type: $type");
        }
    }

    public function getDataRuanganBuilder($filters = [])
    {
        $builder = $this->db->table('data_ruangan a')
            ->select('
                a.id,
                a.uid,
                a.kantor,
                a.kode_ruangan,
                a.nama_ruangan,
                a.lantai,
                a.kapasitas,
                a.spesifikasi,
                a.foto,
                a.deskripsi,
                a.status,
                a.created_at,
                a.updated_at,
                (SELECT COUNT(1) FROM data_assets ast WHERE ast.ruangan_id = a.id AND ast.deleted_at IS NULL) AS total_assets
            ')
            ->where('a.deleted_at IS NULL');

        if (!empty($filters['kantor']) && $filters['kantor'] !== 'all') {
            $builder->where('a.kantor', trim($filters['kantor']));
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $builder->where('a.status', trim($filters['status']));
        }

        if (!empty($filters['lantai']) && $filters['lantai'] !== 'all') {
            $builder->where('a.lantai', trim($filters['lantai']));
        }

        $builder->orderBy('a.kantor', 'ASC')->orderBy('a.lantai', 'ASC')->orderBy('a.nama_ruangan', 'ASC');
        return $builder;
    }

    // ----------------------------------------------------
    // METRIK BENTO KPI (4 KARTU EKSEKUTIF)
    // ----------------------------------------------------
    public function getSummary($filters = [])
    {
        $builder = $this->db->table('data_ruangan a')
            ->select('
                COUNT(1) AS total_ruangan,
                COALESCE(SUM(a.kapasitas), 0) AS total_kapasitas,
                SUM(CASE WHEN a.status = \'Tersedia\' THEN 1 ELSE 0 END) AS ruangan_tersedia,
                SUM(CASE WHEN a.status = \'Digunakan\' THEN 1 ELSE 0 END) AS ruangan_digunakan,
                SUM(CASE WHEN a.status = \'Pemeliharaan\' THEN 1 ELSE 0 END) AS ruangan_pemeliharaan,
                MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
            ')
            ->where('a.deleted_at IS NULL');

        if (!empty($filters['kantor']) && $filters['kantor'] !== 'all') {
            $builder->where('a.kantor', trim($filters['kantor']));
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $builder->where('a.status', trim($filters['status']));
        }

        $row = $builder->get()->getRowArray();

        // Hitung total aset teralokasi di ruangan yang sesuai filter
        $assetBuilder = $this->db->table('data_assets ast')
            ->join('data_ruangan r', 'r.id = ast.ruangan_id')
            ->where('ast.deleted_at IS NULL')
            ->where('r.deleted_at IS NULL');

        if (!empty($filters['kantor']) && $filters['kantor'] !== 'all') {
            $assetBuilder->where('r.kantor', trim($filters['kantor']));
        }

        $totalAssets = (int) $assetBuilder->countAllResults();

        return [
            'total_ruangan'        => (int) ($row['total_ruangan'] ?? 0),
            'total_data'           => (int) ($row['total_ruangan'] ?? 0),
            'total_kapasitas'      => (int) ($row['total_kapasitas'] ?? 0),
            'ruangan_tersedia'     => (int) ($row['ruangan_tersedia'] ?? 0),
            'ruangan_digunakan'    => (int) ($row['ruangan_digunakan'] ?? 0),
            'ruangan_pemeliharaan' => (int) ($row['ruangan_pemeliharaan'] ?? 0),
            'total_assets'         => $totalAssets,
            'last_update'          => $row['last_update'] ?? null,
        ];
    }

    // ----------------------------------------------------
    // CRUD OPERATION RUANGAN
    // ----------------------------------------------------
    public function insertRuangan(array $data)
    {
        if (empty($data['uid'])) {
            $data['uid'] = sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
        }
        $data['created_at'] = date('Y-m-d H:i:s');
        $this->db->table($this->table)->insert($data);
        return $this->db->insertID();
    }

    public function updateRuangan($id, array $data)
    {
        $data['updated_at'] = date('Y-m-d H:i:s');
        return $this->db->table($this->table)
            ->where('id', $id)
            ->update($data);
    }

    public function deleteRuangan($id)
    {
        // Soft delete ruangan
        return $this->db->table($this->table)
            ->where('id', $id)
            ->update(['deleted_at' => date('Y-m-d H:i:s')]);
    }

    public function getRuanganById($id)
    {
        return $this->db->table('data_ruangan a')
            ->select('
                a.*,
                (SELECT COUNT(1) FROM data_assets ast WHERE ast.ruangan_id = a.id AND ast.deleted_at IS NULL) AS total_assets
            ')
            ->where('a.id', $id)
            ->where('a.deleted_at IS NULL')
            ->get()
            ->getRowArray();
    }

    public function getRuanganByUid($uid)
    {
        return $this->db->table('data_ruangan a')
            ->select('
                a.*,
                (SELECT COUNT(1) FROM data_assets ast WHERE ast.ruangan_id = a.id AND ast.deleted_at IS NULL) AS total_assets
            ')
            ->where('a.uid', $uid)
            ->where('a.deleted_at IS NULL')
            ->get()
            ->getRowArray();
    }

    // ----------------------------------------------------
    // RELASI ASET DI DALAM RUANGAN
    // ----------------------------------------------------
    public function getAssetsByRuanganId(int $ruanganId): array
    {
        return $this->db->table('data_assets a')
            ->select('
                a.id,
                a.uid,
                a.kode,
                a.subcode,
                a.uraian,
                a.satuan,
                a.qty,
                a.foto,
                a.kondisi,
                a.nilai_perolehan,
                a.tahun_perolehan,
                a.keterangan,
                b.name AS category_name
            ')
            ->join('data_asset_categories b', 'b.id = a.category_id', 'left')
            ->where('a.ruangan_id', $ruanganId)
            ->where('a.deleted_at IS NULL')
            ->orderBy('a.uraian', 'ASC')
            ->get()
            ->getResultArray();
    }

    // ----------------------------------------------------
    // OPTIONS DROPDOWN RUANGAN UNTUK FORM ASET
    // ----------------------------------------------------
    public function getOptionsRuangan(?string $kantor = null): array
    {
        $builder = $this->db->table($this->table)
            ->select('id, uid, kantor, kode_ruangan, nama_ruangan, lantai, kapasitas, status')
            ->where('deleted_at IS NULL');

        if (!empty($kantor) && $kantor !== 'all') {
            $builder->where('kantor', trim($kantor));
        }

        return $builder->orderBy('kantor ASC, lantai ASC, nama_ruangan ASC')->get()->getResultArray();
    }

    // ----------------------------------------------------
    // HELPER: MAPPING KANTOR KE AREA ASET
    // ----------------------------------------------------
    public function mapKantorToArea(string $kantor): ?string
    {
        if (stripos($kantor, 'Serang') !== false) {
            return 'UPT Serang';
        }
        if (stripos($kantor, 'Bandung') !== false) {
            return 'UPT Bandung';
        }
        if (stripos($kantor, 'Regional') !== false) {
            return 'Kantor Regional III BKN';
        }
        return null;
    }

    // ----------------------------------------------------
    // FETCH ASET TERDAFTAR YANG DAPAT DIALOKASIKAN
    // ----------------------------------------------------
    public function getAvailableAssets(?string $kantor = null): array
    {
        $builder = $this->db->table('data_assets a')
            ->select('
                a.id,
                a.uid,
                a.kode,
                a.subcode,
                a.uraian,
                a.satuan,
                a.qty,
                a.foto,
                a.kondisi,
                a.nilai_perolehan,
                a.ruangan_id,
                a.area,
                b.name AS category_name,
                r.nama_ruangan AS assigned_room_name
            ')
            ->join('data_asset_categories b', 'b.id = a.category_id', 'left')
            ->join('data_ruangan r', 'r.id = a.ruangan_id', 'left')
            ->where('a.deleted_at IS NULL');

        if (!empty($kantor) && $kantor !== 'all') {
            $area = $this->mapKantorToArea($kantor);
            if ($area) {
                $builder->where('a.area', $area);
            }
        }

        return $builder->orderBy('a.ruangan_id ASC, a.uraian ASC')->get()->getResultArray();
    }

    // ----------------------------------------------------
    // ASSIGN ASET KE RUANGAN
    // ----------------------------------------------------
    public function assignAssetToRuangan(int $assetId, int $ruanganId): bool
    {
        return $this->db->table('data_assets')
            ->where('id', $assetId)
            ->update([
                'ruangan_id' => $ruanganId,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
    }

    // ----------------------------------------------------
    // UNASSIGN ASET DARI RUANGAN
    // ----------------------------------------------------
    public function unassignAssetFromRuangan(int $assetId): bool
    {
        return $this->db->table('data_assets')
            ->where('id', $assetId)
            ->update([
                'ruangan_id' => null,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
    }

    // ----------------------------------------------------
    // SYNC KOLEKSI ASET KE RUANGAN (TAMBAH / UBAH RUANGAN)
    // ----------------------------------------------------
    public function syncAssetsToRuangan(int $ruanganId, array $assetIds): void
    {
        if ($ruanganId <= 0) {
            return;
        }

        $cleanIds = array_filter(array_map('intval', $assetIds), fn($id) => $id > 0);

        // 1. Lepas aset yang sebelumnya ada di ruangan ini tapi sekarang tidak ada di daftar
        $builderUnassign = $this->db->table('data_assets')
            ->where('ruangan_id', $ruanganId);
        if (!empty($cleanIds)) {
            $builderUnassign->whereNotIn('id', $cleanIds);
        }
        $builderUnassign->update([
            'ruangan_id' => null,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        // 2. Pasang aset yang ada di daftar ke ruangan ini
        if (!empty($cleanIds)) {
            $this->db->table('data_assets')
                ->whereIn('id', $cleanIds)
                ->update([
                    'ruangan_id' => $ruanganId,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
        }
    }
}
