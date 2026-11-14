<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class CATModel extends Model
{
    protected $table            = 'txn_cat_tilok'; 
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    protected array $casts = [];
    protected array $castHandlers = []; 

    // Dates
    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules      = [];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert   = [];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    public function getDataLog(){
        $builder = $this->db->table($this->table);
        return $builder;
    }

    // ----------------------------
    //  QUERY BUILDER UTAMA
    // ----------------------------    
    public function getBuilder($type, $param = null){
        switch ($type) {
            case 'recap-jenis-periode':
                return $this->getDataRecapJenisPeriode($param);
            case 'recap-seleksi':
                return $this->getDataRecapSeleksi($param);
            case 'recap-tilok':
                return $this->getDataRecap($param);
            case 'recap-hasil':
                return $this->getRecapHasil($param);                
            case 'detail':
                return $this->getDataDetail($param);
            default:
                throw new \Exception("Unknown builder type: $type");
        }
    }    

    // ----------------------------
    //  DAPATKAN NAMA KOLOM OTOMATIS
    // ----------------------------    
    public function getColumns($type, $param = null){
        $builder = $this->getBuilder($type, $param);
        $query = $builder->get();
        return $query->getFieldNames();
    }    

    public function getDataRecapJenisPeriode($params = [])
    {
        $tahun = $params['tahun'] ?? [];

        $builder = $this->db->table('txn_cat_jenis_periode a')
            ->select('
                a.*, 
                b.kode AS jenis_tes_kode, 
                b.nama AS jenis_tes_nama, 
                COALESCE(NULLIF(b.nama, ""), b.kode, "Jenis Tes CAT") AS display_nama,
                COUNT(DISTINCT t.id) AS total_tilok,
                SUM(COALESCE(th.hadir, 0) + COALESCE(th.tidak_hadir, 0)) AS total_peserta,
                SUM(COALESCE(th.hadir, 0)) AS total_hadir,
                SUM(COALESCE(th.tidak_hadir, 0)) AS total_tidak_hadir,
                MAX(th.period_date) AS last_rekap_date,
                MAX(th.created_at) AS last_rekap_created,
                MAX(th.updated_at) AS last_rekap_updated,
                MAX(t.created_at) AS last_tilok_created,
                MAX(t.updated_at) AS last_tilok_updated,
                CASE 
                    WHEN MAX(th.period_date) >= CURDATE() THEN 1 
                    ELSE 0 
                END AS is_ongoing
            ')
            ->join('data_support_jenis_tes b', 'b.id = a.jenis_tes_id', 'inner')
            ->join('txn_cat_tilok t', 't.jenis_periode_id = a.id OR (t.jenis_tes_id = a.jenis_tes_id AND t.period LIKE CONCAT(a.periode, "%"))', 'left')
            ->join('txn_cat_hasil th', 'th.tilok_id = t.id', 'left')
            ->groupBy('a.id');

        if (!empty($tahun)) {
            $builder->whereIn('a.periode', (array)$tahun);
        }

        $builder->orderBy('a.periode', 'DESC');
        $builder->orderBy('is_ongoing', 'DESC');
        $builder->orderBy('last_rekap_date', 'DESC');
        $builder->orderBy('b.kode', 'ASC');
        return $builder;
    }

    public function getDataRecapSeleksi($params = [])
    {
        $tahun = $params['tahun'] ?? [];

        $builder = $this->db->table('txn_cat_seleksi a')
            ->select('
                a.*, 
                b.kode AS jenis_tes_kode, 
                b.nama AS jenis_tes_nama, 
                MAX(th.period_date) AS last_rekap_date,
                MAX(th.created_at) AS last_rekap_created,
                MAX(th.updated_at) AS last_rekap_updated,
                MAX(t.created_at) AS last_tilok_created,
                MAX(t.updated_at) AS last_tilok_updated
            ')
            ->join('data_support_jenis_tes b', 'b.id = a.jenis_tes_id', 'left')
            ->join('txn_cat_tilok t', 't.seleksi_id = a.id', 'left')
            ->join('txn_cat_hasil th', 'th.tilok_id = t.id', 'left')
            ->groupBy('a.id');

        if (!empty($tahun)) {
            $builder->whereIn('a.periode', $tahun);
        }

        $builder->orderBy('last_rekap_date', 'DESC');
        $builder->orderBy('a.created_at', 'DESC');
        return $builder;
    }

    public function getDataRecap($params = [])
    {
        $jenis_periode_id = $params['jenis_periode_id'] ?? null;
        $jenis_tes_id     = $params['jenis_tes_id'] ?? null;
        $period           = $params['period'] ?? null;
        $seleksi_id       = $params['seleksi_id'] ?? null;

        $builder = $this->db->table('txn_cat_tilok a')
            ->select('
                a.*, 
                b.kode AS jenis_tes, 
                b.nama AS jenis_tes_nama,
                b.nama AS periode_nama_jenis,
                jp.periode AS periode_tahun,
                (SELECT COUNT(DISTINCT ti.instansi_id) FROM txn_cat_tilok_instansi ti WHERE ti.tilok_id = a.id) as total_instansi,
                (SELECT COUNT(DISTINCT h.seleksi_id) 
                 FROM txn_cat_tilok_instansi ti 
                 JOIN txn_cat_hasil h ON h.tilok_id = ti.tilok_id AND h.instansi_id = ti.instansi_id 
                 WHERE ti.tilok_id = a.id AND h.seleksi_id IS NOT NULL AND h.seleksi_id > 0) as total_event,
                (SELECT COUNT(h.id) 
                 FROM txn_cat_tilok_instansi ti 
                 JOIN txn_cat_hasil h ON h.tilok_id = ti.tilok_id AND h.instansi_id = ti.instansi_id 
                 WHERE ti.tilok_id = a.id) as total_rekap,
                (SELECT SUM(COALESCE(h.hadir, 0) + COALESCE(h.tidak_hadir, 0)) 
                 FROM txn_cat_tilok_instansi ti 
                 JOIN txn_cat_hasil h ON h.tilok_id = ti.tilok_id AND h.instansi_id = ti.instansi_id 
                 WHERE ti.tilok_id = a.id) as total_peserta,
                (SELECT SUM(COALESCE(h.hadir, 0)) 
                 FROM txn_cat_tilok_instansi ti 
                 JOIN txn_cat_hasil h ON h.tilok_id = ti.tilok_id AND h.instansi_id = ti.instansi_id 
                 WHERE ti.tilok_id = a.id) as total_hadir,
                (SELECT MAX(h.period_date) 
                 FROM txn_cat_tilok_instansi ti 
                 JOIN txn_cat_hasil h ON h.tilok_id = ti.tilok_id AND h.instansi_id = ti.instansi_id 
                 WHERE ti.tilok_id = a.id) as last_rekap_date,
                (SELECT MAX(COALESCE(h.updated_at, h.created_at)) 
                 FROM txn_cat_tilok_instansi ti 
                 JOIN txn_cat_hasil h ON h.tilok_id = ti.tilok_id AND h.instansi_id = ti.instansi_id 
                 WHERE ti.tilok_id = a.id) as last_rekap_updated
            ')
            ->join('txn_cat_jenis_periode jp', 'jp.id = a.jenis_periode_id', 'left')
            ->join('data_support_jenis_tes b', 'b.id = a.jenis_tes_id', 'left');

        if (!empty($jenis_periode_id)) {
            $builder->where('a.jenis_periode_id', (int) $jenis_periode_id);
        } else {
            if (!empty($jenis_tes_id)) {
                $builder->where('a.jenis_tes_id', (int) $jenis_tes_id);
            }
            if (!empty($period)) {
                $builder->groupStart()
                    ->where('a.period', $period)
                    ->orLike('a.period', $period, 'after')
                    ->groupEnd();
            }
        }

        if (!empty($seleksi_id)) {
            $builder->groupStart()
                ->where('a.seleksi_id', (int)$seleksi_id)
                ->orWhere('a.id IN (SELECT DISTINCT tilok_id FROM txn_cat_hasil WHERE seleksi_id = ' . (int)$seleksi_id . ')')
                ->groupEnd();
        }

        $builder->orderBy('last_rekap_updated', 'DESC');
        $builder->orderBy('last_rekap_date', 'DESC');
        $builder->orderBy('a.created_at', 'DESC');
        return $builder;
    }

    public function getRecapHasil($params = [])
    {
        $id          = $params['id'] ?? null;
        $bulan       = $params['bulan'] ?? [];
        $instansi_id = $params['instansi_id'] ?? [];
        $seleksi_id  = $params['seleksi_id'] ?? null;

        $builder = $this->db->table('txn_cat_hasil a')
            ->select('
                b.period,
                b.nama_tilok,
                c.nama AS jenis_tes,
                s.nama_seleksi,
                a.*,
                d.nama AS instansi_nama,
                d.logo AS instansi_logo,
                d.kodeins AS instansi_kodeins
            ')
            ->join('txn_cat_tilok b', 'b.id = a.tilok_id', 'left')
            ->join('txn_cat_seleksi s', 's.id = a.seleksi_id', 'left')
            ->join('data_support_jenis_tes c', 'c.id = a.jenis_tes_id', 'left')
            ->join('data_instansi d', 'd.kodeins = a.instansi_id', 'left')
            ->orderBy('a.period_date', 'DESC')
            ->orderBy('CAST(a.sesi AS UNSIGNED)', 'DESC', false)
            ->orderBy('a.sesi', 'DESC')
            ->orderBy('a.created_at', 'DESC');
        if (is_numeric($id)) {
            $builder->groupStart()->where('b.id', (int)$id)->orWhere('b.uid', $id)->groupEnd();
        } else {
            $builder->where('b.uid', $id);
        }

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(a.period_date)', $bulan);
        }

        if (!empty($seleksi_id)) {
            $builder->where('a.seleksi_id', (int)$seleksi_id);
        }

        $tanggal = $params['tanggal'] ?? null;
        $tgl_mulai = $params['tgl_mulai'] ?? null;
        $tgl_selesai = $params['tgl_selesai'] ?? null;
        if (!empty($tgl_mulai)) {
            $builder->where('a.period_date >=', $tgl_mulai);
        }
        if (!empty($tgl_selesai)) {
            $builder->where('a.period_date <=', $tgl_selesai);
        }
        if (!empty($tanggal)) {
            $builder->where('a.period_date', $tanggal);
        }

        $sesi = $params['sesi'] ?? null;
        if (!empty($sesi)) {
            $builder->where('a.sesi', $sesi);
        }

        if (!empty($instansi_id)) {
            $builder->whereIn('a.instansi_id', $instansi_id);
        }

        return $builder;
    }

    public function getInstansiLastUpdate($tilokUid, $instansiId = null, $seleksiId = null)
    {
        $builder = $this->db->table('txn_cat_hasil a')
            ->select('MAX(COALESCE(a.updated_at, a.created_at)) AS last_update')
            ->join('txn_cat_tilok b', 'b.id = a.tilok_id', 'left');
        if (is_numeric($tilokUid)) {
            $builder->groupStart()->where('b.id', (int)$tilokUid)->orWhere('b.uid', $tilokUid)->groupEnd();
        } else {
            $builder->where('b.uid', $tilokUid);
        }

        if (!empty($instansiId)) {
            $builder->whereIn('a.instansi_id', (array)$instansiId);
        }
        if (!empty($seleksiId)) {
            $builder->where('a.seleksi_id', $seleksiId);
        }

        $row = $builder->get()->getRow();
        return $row->last_update ?? null;
    }

    public function getSummaryTilok($jenis_tes_id = null)
    {
        $builder = $this->db->table('txn_cat_tilok a');
        $builder->select("
            COUNT(a.id) AS total_tilok,
            SUM(COALESCE(a.kapasitas, 0)) AS total_kapasitas,
            COUNT(DISTINCT a.jenis_tes_id) AS total_jenis_tes,
            COUNT(DISTINCT a.period) AS total_periode,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ", false);

        if (!empty($jenis_tes_id)) {
            $builder->where('a.jenis_tes_id', $jenis_tes_id);
        }

        return $builder->get()->getRowArray() ?? [
            'total_tilok' => 0,
            'total_kapasitas' => 0,
            'total_jenis_tes' => 0,
            'total_periode' => 0,
            'last_update' => null,
        ];
    }

    public function getDetailMeta(string $uid): ?array
    {
        $uid = trim($uid);
        if ($uid === '') {
            return null;
        }

        $builder = $this->db->table('txn_cat_tilok a')
            ->select('a.id, a.uid, a.jenis_tes_id, a.jenis_periode_id, a.period, a.nama_tilok, a.period_start_date, a.period_end_date, a.kapasitas, a.created_at, b.nama AS jenis_tes_nama, b.kode AS jenis_tes, COALESCE(jp.uid, s.uid) AS seleksi_uid, COALESCE(jp.uid, s.uid) AS jenis_periode_uid, COALESCE(b.nama, s.nama_seleksi) AS nama_seleksi')
            ->join('data_support_jenis_tes b', 'b.id = a.jenis_tes_id', 'left')
            ->join('txn_cat_jenis_periode jp', 'jp.id = a.jenis_periode_id', 'left')
            ->join('txn_cat_seleksi s', 's.id = a.seleksi_id', 'left');

        if (is_numeric($uid)) {
            $builder->groupStart()
                ->where('a.id', (int) $uid)
                ->orWhere('a.uid', $uid)
                ->groupEnd();
        } else {
            $builder->where('a.uid', $uid);
        }

        $row = $builder->get()->getRowArray();

        return $row ?: null;
    }

    public function getSummaryDetail(string $uid, array $bulan = [], $seleksi_id = null, $instansi_id = [], ?string $tgl_mulai = null, ?string $tgl_selesai = null): array
    {
        $builder = $this->db->table('txn_cat_hasil a');
        $builder->select("
            COUNT(a.id) AS total_rekap,
            COUNT(DISTINCT a.instansi_id) AS total_instansi,
            SUM(COALESCE(a.hadir, 0)) AS total_hadir,
            SUM(COALESCE(a.tidak_hadir, 0)) AS total_tidak_hadir,
            SUM(COALESCE(a.reschedule, 0)) AS total_reschedule,
            SUM(COALESCE(a.hadir, 0) + COALESCE(a.tidak_hadir, 0)) AS total_peserta,
            MIN(a.nilai_min) AS min_nilai,
            MAX(a.nilai_max) AS max_nilai,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ", false);
        $builder->join('txn_cat_tilok b', 'b.id = a.tilok_id', 'inner');
        if (is_numeric($uid)) {
            $builder->groupStart()->where('b.id', (int)$uid)->orWhere('b.uid', $uid)->groupEnd();
        } else {
            $builder->where('b.uid', $uid);
        }

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(a.period_date)', $bulan);
        }

        if (!empty($seleksi_id)) {
            $builder->where('a.seleksi_id', (int)$seleksi_id);
        }

        if (!empty($instansi_id)) {
            $instansiList = is_array($instansi_id) ? array_values(array_filter($instansi_id)) : [$instansi_id];
            if (!empty($instansiList)) {
                $builder->whereIn('a.instansi_id', $instansiList);
            }
        }

        if (!empty($tgl_mulai)) {
            $builder->where('a.period_date >=', $tgl_mulai);
        }
        if (!empty($tgl_selesai)) {
            $builder->where('a.period_date <=', $tgl_selesai);
        }

        return $builder->get()->getRowArray() ?? [
            'total_rekap' => 0,
            'total_instansi' => 0,
            'total_hadir' => 0,
            'total_tidak_hadir' => 0,
            'total_reschedule' => 0,
            'total_peserta' => 0,
            'min_nilai' => null,
            'max_nilai' => null,
            'last_update' => null,
        ];
    }

    public function getInstansiTilokGrouped(string $tilokUid, array $bulan = [], $seleksi_id = null): array
    {
        $hasilJoin = 'a.tilok_id = b.id AND a.instansi_id = ti.instansi_id';
        if (!empty($bulan)) {
            $cleanMonths = array_values(array_filter(array_map('intval', $bulan), static function ($m) {
                return $m >= 1 && $m <= 12;
            }));
            if (!empty($cleanMonths)) {
                $hasilJoin .= ' AND MONTH(a.period_date) IN (' . implode(',', $cleanMonths) . ')';
            }
        }
        if (!empty($seleksi_id)) {
            $hasilJoin .= ' AND a.seleksi_id = ' . (int)$seleksi_id;
        }

        $builder = $this->db->table('txn_cat_tilok_instansi ti');
        $builder->select("
            ti.instansi_id,
            COALESCE(d.nama, ti.instansi_id) AS instansi_nama,
            d.logo,
            COUNT(a.id) AS total_sesi,
            SUM(COALESCE(a.hadir, 0)) AS total_hadir,
            SUM(COALESCE(a.tidak_hadir, 0)) AS total_tidak_hadir,
            SUM(COALESCE(a.reschedule, 0)) AS total_reschedule,
            SUM(COALESCE(a.hadir, 0) + COALESCE(a.tidak_hadir, 0)) AS total_peserta,
            SUM(COALESCE(a.memenuhi, 0)) AS total_memenuhi,
            SUM(COALESCE(a.tidak_memenuhi, 0)) AS total_tidak_memenuhi,
            MIN(a.nilai_min) AS min_nilai,
            MAX(a.nilai_max) AS max_nilai,
            MIN(a.period_date) AS min_date,
            MAX(a.period_date) AS max_date,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ", false);
        $builder->join('txn_cat_tilok b', 'b.id = ti.tilok_id', 'inner');
        $builder->join('txn_cat_hasil a', $hasilJoin, 'left', false);
        $builder->join('data_instansi d', 'd.kodeins = ti.instansi_id', 'left');
        if (is_numeric($tilokUid)) {
            $builder->groupStart()->where('b.id', (int)$tilokUid)->orWhere('b.uid', $tilokUid)->groupEnd();
        } else {
            $builder->where('b.uid', $tilokUid);
        }

        $builder->groupBy('ti.instansi_id, d.nama, d.logo');
        $builder->orderBy('last_update', 'DESC');
        $builder->orderBy('instansi_nama', 'ASC');

        return $builder->get()->getResultArray() ?? [];
    }

    public function getTimkerjaUidByUrl(string $url): string
    {
        $row = $this->db->table('data_timkerja_layanan a')
            ->select('b.uid')
            ->join('data_timkerja b', 'b.id = a.timkerja_id', 'inner')
            ->where('a.url', $url)
            ->get()->getRowArray();
        return !empty($row['uid']) ? $row['uid'] : 'a13e4110-7ccb-11f0-be4c-5f752d8309a4';
    }

    public function getJenisPeriodeDetail($idOrUid): ?array
    {
        $idOrUid = trim((string) $idOrUid);
        if ($idOrUid === '') {
            return null;
        }

        $builder = $this->db->table('txn_cat_jenis_periode jp')
            ->select('jp.*, jt.nama as jenis_tes_nama, jt.kode as jenis_tes_kode')
            ->join('data_support_jenis_tes jt', 'jt.id = jp.jenis_tes_id', 'left');

        if (is_numeric($idOrUid)) {
            $builder->groupStart()
                ->where('jp.id', (int) $idOrUid)
                ->orWhere('jp.uid', $idOrUid)
                ->groupEnd();
        } else {
            $builder->where('jp.uid', $idOrUid);
        }

        $catPeriode = $builder->get()->getRowArray();

        if ($catPeriode) {
            return $catPeriode;
        }

        // Fallback ke txn_cat_seleksi jika ID lama
        $sBuilder = $this->db->table('txn_cat_seleksi s')
            ->select('s.*, jt.nama as jenis_tes_nama, jt.kode as jenis_tes_kode')
            ->join('data_support_jenis_tes jt', 'jt.id = s.jenis_tes_id', 'left');

        if (is_numeric($idOrUid)) {
            $sBuilder->groupStart()
                ->where('s.id', (int) $idOrUid)
                ->orWhere('s.uid', $idOrUid)
                ->groupEnd();
        } else {
            $sBuilder->where('s.uid', $idOrUid);
        }

        $seleksi = $sBuilder->get()->getRowArray();

        if ($seleksi) {
            return [
                'id' => $seleksi['id'],
                'uid' => $seleksi['uid'],
                'jenis_tes_id' => $seleksi['jenis_tes_id'],
                'periode' => $seleksi['periode'],
                'jenis_tes_nama' => $seleksi['nama_seleksi'] ?: $seleksi['jenis_tes_nama'],
                'jenis_tes_kode' => $seleksi['jenis_tes_kode'],
            ];
        }

        // Fallback ke data_support_jenis_tes
        if (is_numeric($idOrUid)) {
            $jenisTes = $this->db->table('data_support_jenis_tes')->where('id', (int) $idOrUid)->get()->getRowArray();
            if ($jenisTes) {
                return [
                    'id' => '',
                    'uid' => '',
                    'jenis_tes_id' => $jenisTes['id'],
                    'periode' => date('Y'),
                    'jenis_tes_nama' => $jenisTes['nama'],
                    'jenis_tes_kode' => $jenisTes['kode'],
                ];
            }
        }

        return null;
    }

    public function getMasterJenisTes(int $id): ?array
    {
        return $this->db->table('data_support_jenis_tes')->where('id', $id)->get()->getRowArray();
    }

    public function checkDuplicateJenisPeriode(int $jenisTesId, string $periode, ?string $excludeUid = null): ?array
    {
        $q = $this->db->table('txn_cat_jenis_periode')
            ->where('jenis_tes_id', $jenisTesId)
            ->where('periode', $periode);
        if (!empty($excludeUid)) {
            $q->where('uid !=', $excludeUid);
        }
        return $q->get()->getRowArray();
    }

    public function saveJenisPeriode(array $data, ?string $uid = null): bool
    {
        if (!empty($uid)) {
            $data['updated_at'] = date('Y-m-d H:i:s');
            return $this->db->table('txn_cat_jenis_periode')->where('uid', $uid)->update($data);
        }
        $data['uid'] = bin2hex(random_bytes(16));
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        return $this->db->table('txn_cat_jenis_periode')->insert($data);
    }

    public function deleteJenisPeriodeByUid(string $uid): bool
    {
        return $this->db->table('txn_cat_jenis_periode')->where('uid', $uid)->delete();
    }

    public function getJenisPeriodeRow($field, $value): ?array
    {
        return $this->db->table('txn_cat_jenis_periode')->where($field, $value)->get()->getRowArray();
    }

    public function saveTilok(array $data, $key = null): bool
    {
        if (!empty($key)) {
            $data['updated_at'] = date('Y-m-d H:i:s');
            if (is_numeric($key)) {
                return $this->db->table('txn_cat_tilok')->where('id', $key)->update($data);
            }
            return $this->db->table('txn_cat_tilok')->where('uid', $key)->update($data);
        }
        if (empty($data['uid'])) {
            $data['uid'] = bin2hex(random_bytes(16));
        }
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        return $this->db->table('txn_cat_tilok')->insert($data);
    }

    public function deleteTilokByKey($key): bool
    {
        if (is_numeric($key)) {
            return $this->db->table('txn_cat_tilok')->where('id', $key)->delete();
        }
        return $this->db->table('txn_cat_tilok')->where('uid', $key)->delete();
    }

    /**
     * Resolve display name for a NIP from data_pegawai or auth_users.
     */
    private function resolvePegawaiNameByNip(string $nip): ?string
    {
        if ($this->db->tableExists('data_pegawai')) {
            $pegawai = $this->db->table('data_pegawai')
                ->select('nama')
                ->where('nip', $nip)
                ->limit(1)
                ->get()
                ->getRowArray();
            if (!empty($pegawai['nama'])) {
                return trim((string) $pegawai['nama']);
            }
        }

        if ($this->db->tableExists('auth_users')) {
            $user = $this->db->table('auth_users')
                ->select('fullname')
                ->where('username', $nip)
                ->limit(1)
                ->get()
                ->getRowArray();
            if (!empty($user['fullname'])) {
                return trim((string) $user['fullname']);
            }
        }

        return null;
    }

    /**
     * Check whether a NIP is registered and active in cfg_cat_pengelola.
     */
    public function isCatPengelolaNip(string $nip): bool
    {
        $nip = trim($nip);
        if ($nip === '' || !$this->db->tableExists('cfg_cat_pengelola')) {
            return false;
        }

        $row = $this->db->table('cfg_cat_pengelola')
            ->select('id')
            ->where('nip', $nip)
            ->where('is_active', 1)
            ->limit(1)
            ->get()
            ->getRowArray();

        return !empty($row);
    }

    /**
     * List all active registered CAT Pengelola NIPs joined with employee names.
     */
    public function getCatPengelolaList(): array
    {
        if (!$this->db->tableExists('cfg_cat_pengelola')) {
            return [];
        }

        return $this->db->table('cfg_cat_pengelola cp')
            ->select("
                cp.id,
                cp.nip,
                COALESCE(NULLIF(cp.nama, ''), NULLIF(dp.nama, ''), NULLIF(au.fullname, ''), '-') AS nama,
                cp.keterangan,
                cp.is_active,
                cp.created_by,
                cp.created_at,
                cp.updated_at
            ")
            ->join('data_pegawai dp', 'dp.nip = cp.nip', 'left')
            ->join('auth_users au', 'au.username = cp.nip', 'left')
            ->where('cp.is_active', 1)
            ->orderBy('cp.id', 'ASC')
            ->get()
            ->getResultArray();
    }

    /**
     * Register or reactivate a CAT Pengelola NIP in cfg_cat_pengelola.
     */
    public function addCatPengelolaNip(string $nip, ?string $nama = null, ?string $keterangan = null, ?string $actorNip = null): array
    {
        $nip = trim($nip);
        if (!preg_match('/^[0-9A-Za-z._-]{3,30}$/', $nip)) {
            return ['ok' => false, 'code' => 422, 'message' => 'Format NIP tidak valid (3-30 karakter alfanumerik).'];
        }

        if (!$this->db->tableExists('cfg_cat_pengelola')) {
            return ['ok' => false, 'code' => 500, 'message' => 'Tabel cfg_cat_pengelola belum tersedia.'];
        }

        $resolvedNama = trim((string) $nama);
        if ($resolvedNama === '') {
            $resolvedNama = (string) ($this->resolvePegawaiNameByNip($nip) ?? '');
        }
        $resolvedNama = $resolvedNama !== '' ? $resolvedNama : null;
        $resolvedKet  = trim((string) $keterangan) !== '' ? trim((string) $keterangan) : 'Pengelola Resmi CAT';
        $now          = date('Y-m-d H:i:s');

        $existing = $this->db->table('cfg_cat_pengelola')
            ->where('nip', $nip)
            ->limit(1)
            ->get()
            ->getRowArray();

        if ($existing) {
            if ((int) ($existing['is_active'] ?? 0) === 1) {
                return ['ok' => false, 'code' => 409, 'message' => 'NIP sudah terdaftar sebagai Pengelola CAT.'];
            }

            $ok = $this->db->table('cfg_cat_pengelola')
                ->where('id', $existing['id'])
                ->update([
                    'nama'       => $resolvedNama ?? ($existing['nama'] ?? null),
                    'keterangan' => $resolvedKet,
                    'is_active'  => 1,
                    'updated_at' => $now,
                ]);

            return $ok
                ? ['ok' => true, 'code' => 200, 'message' => 'NIP Pengelola berhasil diaktifkan kembali.']
                : ['ok' => false, 'code' => 500, 'message' => 'Gagal mengaktifkan kembali NIP Pengelola.'];
        }

        $ok = $this->db->table('cfg_cat_pengelola')->insert([
            'nip'        => $nip,
            'nama'       => $resolvedNama,
            'keterangan' => $resolvedKet,
            'is_active'  => 1,
            'created_by' => $actorNip !== null && trim($actorNip) !== '' ? trim($actorNip) : null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'NIP Pengelola berhasil didaftarkan.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal mendaftarkan NIP Pengelola.'];
    }

    /**
     * Deactivate a CAT Pengelola NIP while preventing lockout of the last active entry.
     */
    public function removeCatPengelolaNip(string $nip): array
    {
        $nip = trim($nip);
        if ($nip === '') {
            return ['ok' => false, 'code' => 422, 'message' => 'NIP wajib diisi.'];
        }

        if (!$this->db->tableExists('cfg_cat_pengelola')) {
            return ['ok' => false, 'code' => 500, 'message' => 'Tabel cfg_cat_pengelola belum tersedia.'];
        }

        $existing = $this->db->table('cfg_cat_pengelola')
            ->where('nip', $nip)
            ->where('is_active', 1)
            ->limit(1)
            ->get()
            ->getRowArray();

        if (!$existing) {
            return ['ok' => false, 'code' => 404, 'message' => 'NIP Pengelola tidak ditemukan atau sudah nonaktif.'];
        }

        $activeCount = (int) $this->db->table('cfg_cat_pengelola')
            ->where('is_active', 1)
            ->countAllResults();

        if ($activeCount <= 1) {
            return ['ok' => false, 'code' => 422, 'message' => 'Minimal harus ada 1 NIP Pengelola CAT yang aktif.'];
        }

        $ok = $this->db->table('cfg_cat_pengelola')
            ->where('id', $existing['id'])
            ->update([
                'is_active'  => 0,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'NIP Pengelola berhasil dihapus dari daftar aktif.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menghapus NIP Pengelola.'];
    }
}
