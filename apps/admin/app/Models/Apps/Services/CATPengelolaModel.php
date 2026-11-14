<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class CATPengelolaModel extends Model
{
    protected $table            = 'txn_cat_jadwal';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'uid',
        'jenis_periode_id',
        'jenis_tes_id',
        'seleksi_id',
        'tilok_id',
        'instansi_id',
        'nama_jadwal',
        'tanggal_mulai',
        'tanggal_selesai',
        'st_status',
        'st_document_id',
        'nomor_st',
        'tanggal_st',
        'status',
        'catatan',
        'created_by',
        'created_at',
        'updated_at',
    ];

    /**
     * Ringkasan metrik KPI untuk Hub Pengelola CAT.
     */
    public function getSummaryMetrics(): array
    {
        $summary = [
            'total_jadwal'       => 0,
            'jadwal_aktif'       => 0,
            'jadwal_tanpa_st'    => 0,
            'total_penugasan'    => 0,
            'total_pegawai_tim'  => 0,
            'total_dokumen'      => 0,
            'total_jenis_tes'    => 0,
            'total_tilok'        => 0,
        ];

        if ($this->db->tableExists('txn_cat_jadwal')) {
            $row = $this->db->table('txn_cat_jadwal')
                ->select("
                    COUNT(id) AS total_jadwal,
                    SUM(CASE WHEN status IN ('aktif', 'draft') AND tanggal_selesai >= CURDATE() THEN 1 ELSE 0 END) AS jadwal_aktif,
                    SUM(CASE WHEN st_status = 'menunggu' OR st_status IS NULL THEN 1 ELSE 0 END) AS jadwal_tanpa_st
                ", false)
                ->get()
                ->getRowArray();

            if ($row) {
                $summary['total_jadwal']    = (int) ($row['total_jadwal'] ?? 0);
                $summary['jadwal_aktif']    = (int) ($row['jadwal_aktif'] ?? 0);
                $summary['jadwal_tanpa_st'] = (int) ($row['jadwal_tanpa_st'] ?? 0);
            }
        }

        if ($this->db->tableExists('txn_cat_tim')) {
            $timRow = $this->db->table('txn_cat_tim')
                ->select('COUNT(id) AS total_penugasan, COUNT(DISTINCT nip) AS total_pegawai_tim')
                ->get()
                ->getRowArray();
            if ($timRow) {
                $summary['total_penugasan']   = (int) ($timRow['total_penugasan'] ?? 0);
                $summary['total_pegawai_tim'] = (int) ($timRow['total_pegawai_tim'] ?? 0);
            }
        }

        if ($this->db->tableExists('txn_pnbp_documents')) {
            $summary['total_dokumen'] = (int) $this->db->table('txn_pnbp_documents')->countAllResults();
        }

        if ($this->db->tableExists('data_support_jenis_tes')) {
            $summary['total_jenis_tes'] = (int) $this->db->table('data_support_jenis_tes')->countAllResults();
        }

        if ($this->db->tableExists('txn_cat_tilok')) {
            $summary['total_tilok'] = (int) $this->db->table('txn_cat_tilok')->countAllResults();
        }

        return $summary;
    }

    /**
     * Daftar jadwal kegiatan CAT lengkap dengan relasi Jenis Tes, Kegiatan, Tilok, Instansi, Tim, dan ST.
     */
    public function getJadwalList(array $filters = []): array
    {
        if (!$this->db->tableExists('txn_cat_jadwal')) {
            return [];
        }

        $builder = $this->db->table('txn_cat_jadwal j')
            ->select('
                j.*,
                jt.kode AS jenis_tes_kode,
                jt.nama AS jenis_tes_nama,
                jp.periode AS jenis_periode_tahun,
                s.nama_seleksi,
                s.periode AS seleksi_periode,
                t.uid AS tilok_uid,
                t.nama_tilok,
                t.kapasitas AS tilok_kapasitas,
                i.nama AS instansi_nama,
                doc.uid AS st_doc_uid,
                doc.doc_number AS st_doc_number,
                doc.doc_date AS st_doc_date,
                doc.status AS st_doc_status,
                (SELECT COUNT(id) FROM txn_cat_tim WHERE jadwal_id = j.id) AS total_tim,
                (SELECT COUNT(id) FROM txn_cat_tim WHERE jadwal_id = j.id AND peran = "Koordinator") AS total_koordinator,
                (SELECT COUNT(id) FROM txn_cat_tim WHERE jadwal_id = j.id AND peran = "IT") AS total_it,
                (SELECT COUNT(id) FROM txn_cat_tim WHERE jadwal_id = j.id AND peran = "Pengawas") AS total_pengawas,
                (SELECT COUNT(id) FROM txn_pnbp_documents WHERE jadwal_id = j.id) AS total_dokumen
            ')
            ->join('data_support_jenis_tes jt', 'jt.id = j.jenis_tes_id', 'left')
            ->join('txn_cat_jenis_periode jp', 'jp.id = j.jenis_periode_id', 'left')
            ->join('txn_cat_seleksi s', 's.id = j.seleksi_id', 'left')
            ->join('txn_cat_tilok t', 't.id = j.tilok_id', 'left')
            ->join('data_instansi i', 'i.kodeins = j.instansi_id', 'left')
            ->join('txn_pnbp_documents doc', 'doc.id = j.st_document_id', 'left');

        if (!empty($filters['jenis_tes_id'])) {
            $builder->where('j.jenis_tes_id', (int) $filters['jenis_tes_id']);
        }
        if (!empty($filters['jenis_periode_id'])) {
            $jpId  = (int) $filters['jenis_periode_id'];
            $jpRow = $this->db->table('txn_cat_jenis_periode')
                ->where('id', $jpId)
                ->get()
                ->getRowArray();
            if ($jpRow) {
                $jtId = (int) $jpRow['jenis_tes_id'];
                $pr   = $this->db->escape((string) $jpRow['periode']);
                $yr   = (int) $jpRow['periode'];
                $builder->groupStart()
                    ->where('j.jenis_periode_id', $jpId)
                    ->orWhere("(j.jenis_tes_id = {$jtId} AND (s.periode = {$pr} OR YEAR(j.tanggal_mulai) = {$yr}))", null, false)
                    ->groupEnd();
            } else {
                $builder->where('j.jenis_periode_id', $jpId);
            }
        }
        if (!empty($filters['seleksi_id'])) {
            $builder->where('j.seleksi_id', (int) $filters['seleksi_id']);
        }
        if (!empty($filters['tilok_id'])) {
            $builder->where('j.tilok_id', (int) $filters['tilok_id']);
        }
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $builder->where('j.status', trim((string) $filters['status']));
        }
        if (!empty($filters['tilok_uid'])) {
            $builder->where('t.uid', trim((string) $filters['tilok_uid']));
        }
        if (!empty($filters['instansi_id'])) {
            $instansiId = trim((string) $filters['instansi_id']);
            $builder->groupStart()
                ->where('j.instansi_id', $instansiId)
                ->orWhere('j.id IN (SELECT jadwal_id FROM txn_cat_jadwal_instansi WHERE instansi_id = ' . $this->db->escape($instansiId) . ')')
                ->groupEnd();
        }
        if (!empty($filters['st_status']) && $filters['st_status'] !== 'all') {
            $builder->where('j.st_status', trim((string) $filters['st_status']));
        }
        if (!empty($filters['tahun'])) {
            $tahun = (int) $filters['tahun'];
            $builder->groupStart()
                ->where('YEAR(j.tanggal_mulai)', $tahun)
                ->orWhere('jp.periode', (string) $tahun)
                ->orWhere('s.periode', (string) $tahun)
                ->groupEnd();
        }
        $keyword = trim((string) ($filters['keyword'] ?? $filters['search'] ?? ''));
        if ($keyword !== '') {
            $builder->groupStart()
                ->like('j.nama_jadwal', $keyword)
                ->orLike('jt.nama', $keyword)
                ->orLike('s.nama_seleksi', $keyword)
                ->orLike('t.nama_tilok', $keyword)
                ->orLike('i.nama', $keyword)
                ->orLike('j.nomor_st', $keyword)
                ->groupEnd();
        }

        $builder->orderBy('j.tanggal_mulai', 'DESC')->orderBy('j.id', 'DESC');
        $rows = $builder->get()->getResultArray();

        if (empty($rows)) {
            return [];
        }

        // Attach multi-instansi list per jadwal
        $jadwalIds = array_column($rows, 'id');
        $instansiMap = [];
        if ($this->db->tableExists('txn_cat_jadwal_instansi') && !empty($jadwalIds)) {
            $insRows = $this->db->table('txn_cat_jadwal_instansi ji')
                ->select('ji.jadwal_id, ji.instansi_id, di.nama AS instansi_nama')
                ->join('data_instansi di', 'di.kodeins = ji.instansi_id', 'left')
                ->whereIn('ji.jadwal_id', $jadwalIds)
                ->get()
                ->getResultArray();

            foreach ($insRows as $ir) {
                $jid = (int) $ir['jadwal_id'];
                $instansiMap[$jid][] = [
                    'instansi_id'   => $ir['instansi_id'],
                    'instansi_nama' => $ir['instansi_nama'] ?: $ir['instansi_id'],
                ];
            }
        }

        foreach ($rows as &$r) {
            $jid = (int) $r['id'];
            $r['instansi_list'] = $instansiMap[$jid] ?? [];
            if (empty($r['instansi_list']) && !empty($r['instansi_id'])) {
                $r['instansi_list'] = [[
                    'instansi_id'   => $r['instansi_id'],
                    'instansi_nama' => $r['instansi_nama'] ?: $r['instansi_id'],
                ]];
            }
            $r['resolved_nomor_st'] = $r['nomor_st'] ?: ($r['st_doc_number'] ?: '');
        }

        return $rows;
    }

    /**
     * Ambil detail 1 jadwal berdasarkan ID atau UID.
     */
    public function getJadwalDetail(string $idOrUid): ?array
    {
        $rows = $this->getJadwalList([]);
        foreach ($rows as $row) {
            if ((string) $row['id'] === $idOrUid || (string) $row['uid'] === $idOrUid) {
                return $row;
            }
        }
        return null;
    }

    /**
     * Simpan atau perbarui jadwal kegiatan CAT (mendukung instansi opsional & ST menyusul).
     */
    public function saveJadwal(array $payload, string $actorNip): array
    {
        if (!$this->db->tableExists('txn_cat_jadwal')) {
            return ['ok' => false, 'code' => 500, 'message' => 'Tabel txn_cat_jadwal belum tersedia.'];
        }

        $id             = (int) ($payload['id'] ?? 0);
        $uid            = trim((string) ($payload['uid'] ?? ''));
        $jenisPeriodeId = !empty($payload['jenis_periode_id']) ? (int) $payload['jenis_periode_id'] : null;
        $jenisTesId     = (int) ($payload['jenis_tes_id'] ?? 0);
        $seleksiId      = (int) ($payload['seleksi_id'] ?? 0);
        $tilokInput     = $payload['tilok_id'] ?? ($payload['tilok_uid'] ?? '');
        $tanggalMulai   = trim((string) ($payload['tanggal_mulai'] ?? ''));
        $tanggalSelesai = trim((string) ($payload['tanggal_selesai'] ?? ''));

        // Resolve tilok_id from id or uid
        $tilokId = 0;
        if (is_numeric($tilokInput) && (int) $tilokInput > 0) {
            $tilokId = (int) $tilokInput;
        } elseif (trim((string) $tilokInput) !== '') {
            $tilokRow = $this->db->table('txn_cat_tilok')
                ->select('id, jenis_tes_id, jenis_periode_id')
                ->where('uid', trim((string) $tilokInput))
                ->get()
                ->getRowArray();
            if ($tilokRow) {
                $tilokId = (int) $tilokRow['id'];
                if ($jenisTesId <= 0 && !empty($tilokRow['jenis_tes_id'])) {
                    $jenisTesId = (int) $tilokRow['jenis_tes_id'];
                }
                if ($jenisPeriodeId === null && !empty($tilokRow['jenis_periode_id'])) {
                    $jenisPeriodeId = (int) $tilokRow['jenis_periode_id'];
                }
            }
        }

        // Resolve jenis_tes_id & jenis_periode_id from seleksi or jenis_periode if omitted
        $resolvedPeriode = '';
        if ($seleksiId > 0) {
            $selRow = $this->db->table('txn_cat_seleksi')->select('jenis_tes_id, periode')->where('id', $seleksiId)->get()->getRowArray();
            if ($selRow) {
                if ($jenisTesId <= 0 && !empty($selRow['jenis_tes_id'])) {
                    $jenisTesId = (int) $selRow['jenis_tes_id'];
                }
                if (!empty($selRow['periode'])) {
                    $resolvedPeriode = trim((string) $selRow['periode']);
                }
            }
        }
        if ($jenisTesId <= 0 && $jenisPeriodeId) {
            $jpRow = $this->db->table('txn_cat_jenis_periode')->select('jenis_tes_id')->where('id', $jenisPeriodeId)->get()->getRowArray();
            if ($jpRow && !empty($jpRow['jenis_tes_id'])) {
                $jenisTesId = (int) $jpRow['jenis_tes_id'];
            }
        }
        if ($jenisPeriodeId === null && $jenisTesId > 0 && $resolvedPeriode !== '' && $this->db->tableExists('txn_cat_jenis_periode')) {
            $jpRow = $this->db->table('txn_cat_jenis_periode')
                ->select('id')
                ->where('jenis_tes_id', $jenisTesId)
                ->where('periode', $resolvedPeriode)
                ->get()
                ->getRowArray();
            if ($jpRow && !empty($jpRow['id'])) {
                $jenisPeriodeId = (int) $jpRow['id'];
            }
        }

        if ($jenisTesId <= 0 || $seleksiId <= 0 || $tilokId <= 0 || $tanggalMulai === '' || $tanggalSelesai === '') {
            return ['ok' => false, 'code' => 422, 'message' => 'Jenis Tes, Kegiatan Seleksi, Titik Lokasi, dan Tanggal Mulai/Selesai wajib diisi.'];
        }

        if ($tanggalSelesai < $tanggalMulai) {
            return ['ok' => false, 'code' => 422, 'message' => 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'];
        }

        $instansiIds = $payload['instansi_ids'] ?? [];
        if (is_string($instansiIds)) {
            $decoded = json_decode($instansiIds, true);
            $instansiIds = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $instansiIds)));
        }
        $instansiIds = array_values(array_unique(array_filter(array_map(static fn ($v) => trim((string) $v), (array) $instansiIds))));
        $primaryInstansiId = trim((string) ($payload['instansi_id'] ?? ''));
        if ($primaryInstansiId === '' && !empty($instansiIds)) {
            $primaryInstansiId = $instansiIds[0];
        }
        if ($primaryInstansiId !== '' && !in_array($primaryInstansiId, $instansiIds, true)) {
            array_unshift($instansiIds, $primaryInstansiId);
        }

        $stDocId   = !empty($payload['st_document_id']) ? (int) $payload['st_document_id'] : null;
        $nomorSt   = trim((string) ($payload['nomor_st'] ?? ''));
        $tanggalSt = trim((string) ($payload['tanggal_st'] ?? ''));

        // Jika st_document_id dipilih tapi nomor_st kosong, tarik dari txn_pnbp_documents
        if ($stDocId && $this->db->tableExists('txn_pnbp_documents')) {
            $stDoc = $this->db->table('txn_pnbp_documents')->where('id', $stDocId)->get()->getRowArray();
            if ($stDoc) {
                if ($nomorSt === '' && !empty($stDoc['doc_number'])) {
                    $nomorSt = $stDoc['doc_number'];
                }
                if ($tanggalSt === '' && !empty($stDoc['doc_date'])) {
                    $tanggalSt = $stDoc['doc_date'];
                }
            }
        }

        $hasSt    = ($stDocId !== null || $nomorSt !== '');
        $stStatus = $hasSt ? 'terhubung' : 'menunggu';
        $status   = in_array(($payload['status'] ?? 'aktif'), ['draft', 'aktif', 'selesai', 'batal'], true)
            ? $payload['status']
            : 'aktif';

        $now = date('Y-m-d H:i:s');
        $record = [
            'jenis_periode_id' => $jenisPeriodeId,
            'jenis_tes_id'     => $jenisTesId,
            'seleksi_id'       => $seleksiId,
            'tilok_id'         => $tilokId,
            'instansi_id'      => $primaryInstansiId !== '' ? $primaryInstansiId : null,
            'nama_jadwal'      => trim((string) ($payload['nama_jadwal'] ?? '')) ?: null,
            'tanggal_mulai'    => $tanggalMulai,
            'tanggal_selesai'  => $tanggalSelesai,
            'st_status'        => $stStatus,
            'st_document_id'   => $stDocId,
            'nomor_st'         => $nomorSt !== '' ? $nomorSt : null,
            'tanggal_st'       => $tanggalSt !== '' ? $tanggalSt : null,
            'status'           => $status,
            'catatan'          => trim((string) ($payload['catatan'] ?? '')) ?: null,
            'updated_at'       => $now,
        ];

        $existing = null;
        if ($id > 0) {
            $existing = $this->find($id);
        } elseif ($uid !== '') {
            $existing = $this->where('uid', $uid)->first();
        }

        $this->db->transStart();

        if ($existing) {
            $jadwalId = (int) $existing['id'];
            $this->update($jadwalId, $record);
        } else {
            $record['uid']        = bin2hex(random_bytes(16));
            $record['created_by'] = $actorNip !== '' ? $actorNip : null;
            $record['created_at'] = $now;
            $jadwalId = (int) $this->insert($record, true);
        }

        if ($this->db->tableExists('txn_cat_jadwal_instansi')) {
            $this->db->table('txn_cat_jadwal_instansi')->where('jadwal_id', $jadwalId)->delete();
            foreach ($instansiIds as $insId) {
                $this->db->table('txn_cat_jadwal_instansi')->insert([
                    'jadwal_id'   => $jadwalId,
                    'instansi_id' => $insId,
                    'created_at'  => $now,
                ]);
            }
        }

        // Pastikan instansi juga terdaftar di txn_cat_tilok_instansi agar sinkron dengan Rekap Data / Laporan
        if ($this->db->tableExists('txn_cat_tilok_instansi') && !empty($instansiIds)) {
            foreach ($instansiIds as $insId) {
                $existsMap = $this->db->table('txn_cat_tilok_instansi')
                    ->where('tilok_id', $tilokId)
                    ->where('instansi_id', $insId)
                    ->countAllResults();
                if ($existsMap === 0) {
                    $this->db->table('txn_cat_tilok_instansi')->insert([
                        'tilok_id'    => $tilokId,
                        'instansi_id' => $insId,
                        'created_at'  => $now,
                    ]);
                }
            }
        }

        // Jika ST terhubung, sinkronkan ke dokumen & anggota tim yang belum punya ST khusus
        if ($hasSt && $stDocId && $this->db->tableExists('txn_pnbp_documents')) {
            $this->db->table('txn_pnbp_documents')
                ->where('id', $stDocId)
                ->update(['jadwal_id' => $jadwalId]);
        }

        $this->db->transComplete();

        if (!$this->db->transStatus()) {
            return ['ok' => false, 'code' => 500, 'message' => 'Gagal menyimpan jadwal kegiatan CAT.'];
        }

        return [
            'ok'      => true,
            'code'    => 200,
            'message' => $existing ? 'Jadwal kegiatan berhasil diperbarui.' : 'Jadwal kegiatan berhasil ditambahkan.',
            'id'      => $jadwalId,
        ];
    }

    /**
     * Tautkan Surat Tugas (ST) susulan ke Jadwal dan/atau anggota Tim tertentu.
     */
    public function linkStToJadwal(int $jadwalId, ?int $stDocumentId, ?string $nomorSt, ?string $tanggalSt, array $timIds = []): array
    {
        $jadwal = $this->find($jadwalId);
        if (!$jadwal) {
            return ['ok' => false, 'code' => 404, 'message' => 'Jadwal kegiatan tidak ditemukan.'];
        }

        $resolvedNomor = trim((string) $nomorSt);
        $resolvedDate  = trim((string) $tanggalSt);

        if ($stDocumentId && $this->db->tableExists('txn_pnbp_documents')) {
            $stDoc = $this->db->table('txn_pnbp_documents')->where('id', $stDocumentId)->get()->getRowArray();
            if ($stDoc) {
                if ($resolvedNomor === '' && !empty($stDoc['doc_number'])) {
                    $resolvedNomor = $stDoc['doc_number'];
                }
                if ($resolvedDate === '' && !empty($stDoc['doc_date'])) {
                    $resolvedDate = $stDoc['doc_date'];
                }
            }
        }

        if (!$stDocumentId && $resolvedNomor === '') {
            return ['ok' => false, 'code' => 422, 'message' => 'Pilih dokumen ST atau masukkan Nomor Surat Tugas.'];
        }

        $now = date('Y-m-d H:i:s');
        $this->db->transStart();

        $this->update($jadwalId, [
            'st_status'      => 'terhubung',
            'st_document_id' => $stDocumentId ?: null,
            'nomor_st'       => $resolvedNomor !== '' ? $resolvedNomor : null,
            'tanggal_st'     => $resolvedDate !== '' ? $resolvedDate : null,
            'updated_at'     => $now,
        ]);

        if ($stDocumentId && $this->db->tableExists('txn_pnbp_documents')) {
            $this->db->table('txn_pnbp_documents')
                ->where('id', $stDocumentId)
                ->update(['jadwal_id' => $jadwalId]);
        }

        if ($this->db->tableExists('txn_cat_tim')) {
            $timQuery = $this->db->table('txn_cat_tim')->where('jadwal_id', $jadwalId);
            if (!empty($timIds)) {
                $timQuery->whereIn('id', array_map('intval', $timIds));
            }
            $timQuery->update([
                'st_document_id' => $stDocumentId ?: null,
                'nomor_st'       => $resolvedNomor !== '' ? $resolvedNomor : null,
                'updated_at'     => $now,
            ]);
        }

        $this->db->transComplete();

        return $this->db->transStatus()
            ? ['ok' => true, 'code' => 200, 'message' => 'Surat Tugas berhasil ditautkan ke jadwal & tim.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menautkan Surat Tugas.'];
    }

    /**
     * Hapus jadwal kegiatan beserta daftar tim di dalamnya.
     */
    public function deleteJadwal(string $idOrUid): array
    {
        $builder = $this->db->table('txn_cat_jadwal');
        if (is_numeric($idOrUid)) {
            $builder->where('id', (int) $idOrUid);
        } else {
            $builder->where('uid', $idOrUid);
        }
        $existing = $builder->get()->getRowArray();

        if (!$existing) {
            return ['ok' => false, 'code' => 404, 'message' => 'Jadwal tidak ditemukan.'];
        }

        $jadwalId = (int) $existing['id'];
        $this->db->transStart();
        if ($this->db->tableExists('txn_pnbp_documents')) {
            $this->db->table('txn_pnbp_documents')
                ->where('jadwal_id', $jadwalId)
                ->update(['jadwal_id' => null]);
        }
        if ($this->db->tableExists('txn_cat_tim')) {
            $this->db->table('txn_cat_tim')->where('jadwal_id', $jadwalId)->delete();
        }
        if ($this->db->tableExists('txn_cat_jadwal_instansi')) {
            $this->db->table('txn_cat_jadwal_instansi')->where('jadwal_id', $jadwalId)->delete();
        }
        $this->db->table('txn_cat_jadwal')->where('id', $jadwalId)->delete();
        $this->db->transComplete();

        return $this->db->transStatus()
            ? ['ok' => true, 'code' => 200, 'message' => 'Jadwal kegiatan berhasil dihapus.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menghapus jadwal kegiatan.'];
    }

    /**
     * Ambil daftar tim pelaksana berdasarkan filter jadwal/jenis tes/kegiatan/tilok/peran.
     */
    public function getTimList(array $filters = []): array
    {
        if (!$this->db->tableExists('txn_cat_tim')) {
            return [];
        }

        $builder = $this->db->table('txn_cat_tim m')
            ->select('
                m.*,
                j.uid AS jadwal_uid,
                j.nama_jadwal,
                j.jenis_tes_id,
                j.seleksi_id,
                j.tilok_id,
                j.instansi_id,
                j.tanggal_mulai AS jadwal_tanggal_mulai,
                j.tanggal_selesai AS jadwal_tanggal_selesai,
                j.st_status AS jadwal_st_status,
                j.st_document_id AS jadwal_st_document_id,
                j.nomor_st AS jadwal_nomor_st,
                j.tanggal_st AS jadwal_tanggal_st,
                jt.kode AS jenis_tes_kode,
                jt.nama AS jenis_tes_nama,
                jp.periode AS jenis_periode_tahun,
                s.nama_seleksi,
                s.periode AS seleksi_periode,
                t.nama_tilok,
                t.uid AS tilok_uid,
                i.nama AS instansi_nama,
                p.unit_kerja_id,
                p.jabatan AS pegawai_jabatan,
                uk.nama AS unit_kerja_nama,
                doc.doc_number AS member_doc_number
            ')
            ->join('txn_cat_jadwal j', 'j.id = m.jadwal_id', 'inner')
            ->join('data_support_jenis_tes jt', 'jt.id = j.jenis_tes_id', 'left')
            ->join('txn_cat_jenis_periode jp', 'jp.id = j.jenis_periode_id', 'left')
            ->join('txn_cat_seleksi s', 's.id = j.seleksi_id', 'left')
            ->join('txn_cat_tilok t', 't.id = j.tilok_id', 'left')
            ->join('data_instansi i', 'i.kodeins = j.instansi_id', 'left')
            ->join('data_pegawai p', 'p.nip = m.nip', 'left')
            ->join('data_pegawai_unit_kerja uk', 'uk.id = p.unit_kerja_id', 'left')
            ->join('txn_pnbp_documents doc', 'doc.id = COALESCE(m.st_document_id, j.st_document_id)', 'left', false);

        if (!empty($filters['jadwal_id'])) {
            $builder->where('m.jadwal_id', (int) $filters['jadwal_id']);
        }
        if (!empty($filters['jenis_tes_id'])) {
            $builder->where('j.jenis_tes_id', (int) $filters['jenis_tes_id']);
        }
        if (!empty($filters['seleksi_id'])) {
            $builder->where('j.seleksi_id', (int) $filters['seleksi_id']);
        }
        if (!empty($filters['tilok_id'])) {
            $builder->where('j.tilok_id', (int) $filters['tilok_id']);
        }
        if (!empty($filters['instansi_id'])) {
            $builder->where('j.instansi_id', trim((string) $filters['instansi_id']));
        }
        if (!empty($filters['unit_kerja_id'])) {
            $builder->where('p.unit_kerja_id', trim((string) $filters['unit_kerja_id']));
        }
        if (!empty($filters['peran']) && $filters['peran'] !== 'all') {
            $builder->where('m.peran', trim((string) $filters['peran']));
        }
        if (!empty($filters['st_status']) && $filters['st_status'] !== 'all') {
            if ($filters['st_status'] === 'menunggu') {
                $builder->groupStart()
                    ->where('j.st_status', 'menunggu')
                    ->where('m.nomor_st IS NULL', null, false)
                    ->where('m.st_document_id IS NULL', null, false)
                    ->groupEnd();
            } else {
                $builder->groupStart()
                    ->where('j.st_status', 'terhubung')
                    ->orWhere('m.nomor_st IS NOT NULL', null, false)
                    ->orWhere('m.st_document_id IS NOT NULL', null, false)
                    ->groupEnd();
            }
        }
        $keyword = trim((string) ($filters['keyword'] ?? $filters['search'] ?? ''));
        if ($keyword !== '') {
            $builder->groupStart()
                ->like('m.nama', $keyword)
                ->orLike('m.nip', $keyword)
                ->orLike('m.jabatan', $keyword)
                ->orLike('s.nama_seleksi', $keyword)
                ->orLike('t.nama_tilok', $keyword)
                ->groupEnd();
        }

        $builder->orderBy('j.tanggal_mulai', 'DESC')
            ->orderBy("FIELD(m.peran, 'Koordinator', 'IT', 'Pengawas')", 'ASC', false)
            ->orderBy('m.nama', 'ASC');

        $rows = $builder->get()->getResultArray();
        foreach ($rows as &$r) {
            $r['resolved_nomor_st'] = $r['nomor_st'] ?: ($r['jadwal_nomor_st'] ?: ($r['member_doc_number'] ?: ''));
            $r['resolved_st_status'] = $r['resolved_nomor_st'] !== '' || !empty($r['st_document_id']) || !empty($r['jadwal_st_document_id'])
                ? 'terhubung'
                : 'menunggu';
        }

        return $rows;
    }

    /**
     * Cek bentrok jadwal penugasan pegawai pada rentang tanggal yang beririsan.
     */
    public function checkTimConflicts(array $nips, string $tanggalMulai, string $tanggalSelesai, ?int $excludeJadwalId = null): array
    {
        if (empty($nips) || $tanggalMulai === '' || $tanggalSelesai === '' || !$this->db->tableExists('txn_cat_tim')) {
            return [];
        }

        $cleanNips = array_values(array_unique(array_filter(array_map('trim', $nips))));
        if (empty($cleanNips)) {
            return [];
        }

        $builder = $this->db->table('txn_cat_tim m')
            ->select('m.nip, m.nama, m.peran, m.jadwal_id, j.tanggal_mulai, j.tanggal_selesai, s.nama_seleksi, t.nama_tilok')
            ->join('txn_cat_jadwal j', 'j.id = m.jadwal_id', 'inner')
            ->join('txn_cat_seleksi s', 's.id = j.seleksi_id', 'left')
            ->join('txn_cat_tilok t', 't.id = j.tilok_id', 'left')
            ->whereIn('m.nip', $cleanNips)
            ->where('COALESCE(m.tanggal_mulai, j.tanggal_mulai) <=', $tanggalSelesai)
            ->where('COALESCE(m.tanggal_selesai, j.tanggal_selesai) >=', $tanggalMulai);

        if ($excludeJadwalId) {
            $builder->where('m.jadwal_id !=', $excludeJadwalId);
        }

        return $builder->get()->getResultArray();
    }

    /**
     * Simpan atau perbarui 1 atau banyak anggota tim pada suatu jadwal.
     */
    public function saveTim(array $payload, string $actorNip): array
    {
        if (!$this->db->tableExists('txn_cat_tim')) {
            return ['ok' => false, 'code' => 500, 'message' => 'Tabel txn_cat_tim belum tersedia.'];
        }

        $jadwalId = (int) ($payload['jadwal_id'] ?? 0);
        if ($jadwalId <= 0) {
            return ['ok' => false, 'code' => 422, 'message' => 'Jadwal kegiatan wajib dipilih.'];
        }

        $jadwal = $this->find($jadwalId);
        if (!$jadwal) {
            return ['ok' => false, 'code' => 404, 'message' => 'Jadwal kegiatan tidak ditemukan.'];
        }

        $members = $payload['members'] ?? null;
        if (!is_array($members)) {
            $members = [$payload];
        }

        $allowedRoles = ['Koordinator', 'IT', 'Pengawas'];
        $now          = date('Y-m-d H:i:s');
        $savedCount   = 0;
        $nipsToCheck  = [];

        $this->db->transStart();

        foreach ($members as $m) {
            $memberId = (int) ($m['id'] ?? 0);
            $nip      = trim((string) ($m['nip'] ?? ''));
            $nama     = trim((string) ($m['nama'] ?? ''));
            $peran    = trim((string) ($m['peran'] ?? $payload['peran'] ?? 'Pengawas'));

            if (!in_array($peran, $allowedRoles, true)) {
                $peran = 'Pengawas';
            }

            if ($nip === '' || $nama === '') {
                continue;
            }

            $nipsToCheck[] = $nip;

            $tglMulaiMember   = trim((string) ($m['tanggal_mulai'] ?? $payload['tanggal_mulai'] ?? ($jadwal['tanggal_mulai'] ?? '')));
            $tglSelesaiMember = trim((string) ($m['tanggal_selesai'] ?? $payload['tanggal_selesai'] ?? ($jadwal['tanggal_selesai'] ?? '')));
            $catatanMember    = trim((string) ($m['catatan'] ?? $payload['catatan'] ?? ''));

            $row = [
                'jadwal_id'       => $jadwalId,
                'pegawai_id'      => !empty($m['pegawai_id']) ? (int) $m['pegawai_id'] : null,
                'nip'             => $nip,
                'nama'            => $nama,
                'pangkat_gol'     => trim((string) ($m['pangkat_gol'] ?? '')) ?: null,
                'jabatan'         => trim((string) ($m['jabatan'] ?? '')) ?: null,
                'peran'           => $peran,
                'st_document_id'  => !empty($m['st_document_id']) ? (int) $m['st_document_id'] : ($jadwal['st_document_id'] ?: null),
                'nomor_st'        => trim((string) ($m['nomor_st'] ?? '')) ?: ($jadwal['nomor_st'] ?: null),
                'tanggal_mulai'   => $tglMulaiMember !== '' ? $tglMulaiMember : null,
                'tanggal_selesai' => $tglSelesaiMember !== '' ? $tglSelesaiMember : null,
                'catatan'         => $catatanMember !== '' ? $catatanMember : null,
                'updated_at'      => $now,
            ];

            if ($memberId > 0) {
                $this->db->table('txn_cat_tim')->where('id', $memberId)->update($row);
                $savedCount++;
            } else {
                // Hindari duplikasi NIP + peran yang identik di jadwal yang sama
                $dup = $this->db->table('txn_cat_tim')
                    ->where('jadwal_id', $jadwalId)
                    ->where('nip', $nip)
                    ->where('peran', $peran)
                    ->get()
                    ->getRowArray();

                if ($dup) {
                    $this->db->table('txn_cat_tim')->where('id', $dup['id'])->update($row);
                } else {
                    $row['created_by'] = $actorNip !== '' ? $actorNip : null;
                    $row['created_at'] = $now;
                    $this->db->table('txn_cat_tim')->insert($row);
                }
                $savedCount++;
            }
        }

        $this->db->transComplete();

        if ($savedCount === 0) {
            return ['ok' => false, 'code' => 422, 'message' => 'Minimal 1 anggota tim dengan NIP dan Nama valid harus diisi.'];
        }

        if (!$this->db->transStatus()) {
            return ['ok' => false, 'code' => 500, 'message' => 'Gagal menyimpan susunan tim pelaksana.'];
        }

        $conflicts = $this->checkTimConflicts(
            $nipsToCheck,
            (string) $jadwal['tanggal_mulai'],
            (string) $jadwal['tanggal_selesai'],
            $jadwalId
        );

        return [
            'ok'        => true,
            'code'      => 200,
            'message'   => "{$savedCount} penugasan anggota tim berhasil disimpan.",
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Hapus anggota tim berdasarkan ID.
     */
    public function deleteTimMember(int $id): array
    {
        if ($id <= 0 || !$this->db->tableExists('txn_cat_tim')) {
            return ['ok' => false, 'code' => 422, 'message' => 'ID anggota tim tidak valid.'];
        }

        $existing = $this->db->table('txn_cat_tim')->where('id', $id)->get()->getRowArray();
        if (!$existing) {
            return ['ok' => false, 'code' => 404, 'message' => 'Data anggota tim tidak ditemukan.'];
        }

        $ok = $this->db->table('txn_cat_tim')->where('id', $id)->delete();
        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'Anggota tim berhasil dihapus dari jadwal.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menghapus anggota tim.'];
    }

    /**
     * Rekap beban penugasan pegawai dipetakan ke Jenis Tes dan Peran (Koordinator, IT, Pengawas).
     */
    public function getRekapPegawai(array $filters = []): array
    {
        $jenisTesList = $this->db->table('data_support_jenis_tes')
            ->select('id, kode, nama')
            ->orderBy('nama', 'ASC')
            ->get()
            ->getResultArray();

        if (!$this->db->tableExists('txn_cat_tim')) {
            return [
                'jenis_tes_columns' => $jenisTesList,
                'rows'              => [],
                'summary'           => [
                    'total_pegawai'   => 0,
                    'total_penugasan' => 0,
                    'avg_per_pegawai' => 0,
                    'max_penugasan'   => 0,
                ],
            ];
        }

        $builder = $this->db->table('txn_cat_tim m')
            ->select('
                m.id AS tim_id,
                m.nip,
                m.nama,
                COALESCE(NULLIF(m.pangkat_gol, ""), g.nama, "-") AS pangkat_gol,
                COALESCE(NULLIF(m.jabatan, ""), dp.jabatan, "-") AS jabatan,
                m.peran,
                m.nomor_st AS member_nomor_st,
                j.id AS jadwal_id,
                COALESCE(NULLIF(j.jenis_tes_id, 0), jp.jenis_tes_id, 0) AS resolved_jenis_tes_id,
                jt.kode AS jenis_tes_kode,
                jt.nama AS jenis_tes_nama,
                COALESCE(NULLIF(jp.periode, ""), NULLIF(s.periode, ""), CAST(YEAR(COALESCE(m.tanggal_mulai, j.tanggal_mulai)) AS CHAR)) AS periode_tahun,
                s.nama_seleksi,
                t.nama_tilok,
                i.nama AS instansi_nama,
                COALESCE(m.tanggal_mulai, j.tanggal_mulai) AS tanggal_mulai,
                COALESCE(m.tanggal_selesai, j.tanggal_selesai) AS tanggal_selesai,
                j.st_status,
                j.nomor_st AS jadwal_nomor_st
            ', false)
            ->join('txn_cat_jadwal j', 'j.id = m.jadwal_id', 'inner')
            ->join('txn_cat_jenis_periode jp', 'jp.id = j.jenis_periode_id', 'left')
            ->join('txn_cat_seleksi s', 's.id = j.seleksi_id', 'left')
            ->join('data_support_jenis_tes jt', 'jt.id = COALESCE(NULLIF(j.jenis_tes_id, 0), jp.jenis_tes_id)', 'left', false)
            ->join('txn_cat_tilok t', 't.id = j.tilok_id', 'left')
            ->join('data_instansi i', 'i.kodeins = j.instansi_id', 'left')
            ->join('data_pegawai dp', 'dp.nip = m.nip', 'left')
            ->join('data_pegawai_golongan g', 'g.id = dp.gol_id', 'left');

        if (!empty($filters['tahun'])) {
            $tahun = (int) $filters['tahun'];
            $tahunStr = (string) $tahun;
            $builder->groupStart()
                ->where('YEAR(COALESCE(m.tanggal_mulai, j.tanggal_mulai))', $tahun)
                ->orWhere('jp.periode', $tahunStr)
                ->orWhere('s.periode', $tahunStr)
                ->groupEnd();
        }
        if (!empty($filters['tgl_mulai'])) {
            $builder->where('COALESCE(m.tanggal_mulai, j.tanggal_mulai) >=', $filters['tgl_mulai']);
        }
        if (!empty($filters['tgl_selesai'])) {
            $builder->where('COALESCE(m.tanggal_selesai, j.tanggal_selesai) <=', $filters['tgl_selesai']);
        }
        if (!empty($filters['jenis_tes_id'])) {
            $jtFilterId = (int) $filters['jenis_tes_id'];
            $builder->where('COALESCE(NULLIF(j.jenis_tes_id, 0), jp.jenis_tes_id) =', $jtFilterId, false);
        }
        if (!empty($filters['peran']) && $filters['peran'] !== 'all') {
            $builder->where('m.peran', trim((string) $filters['peran']));
        }
        $keyword = trim((string) ($filters['keyword'] ?? $filters['search'] ?? ''));
        if ($keyword !== '') {
            $builder->groupStart()
                ->like('m.nama', $keyword)
                ->orLike('m.nip', $keyword)
                ->orLike('m.jabatan', $keyword)
                ->groupEnd();
        }

        $builder->orderBy('tanggal_mulai', 'DESC');
        $rawAssignments = $builder->get()->getResultArray();

        $byNip = [];
        $totalPenugasan = 0;

        foreach ($rawAssignments as $row) {
            $nip = trim((string) $row['nip']);
            if ($nip === '') {
                continue;
            }
            $periodeTahun = trim((string) ($row['periode_tahun'] ?? ''));
            if ($periodeTahun === '' && !empty($row['tanggal_mulai'])) {
                $periodeTahun = substr((string) $row['tanggal_mulai'], 0, 4);
            }

            if (!isset($byNip[$nip])) {
                $byNip[$nip] = [
                    'nip'               => $nip,
                    'nama'              => $row['nama'],
                    'pangkat_gol'       => $row['pangkat_gol'],
                    'jabatan'           => $row['jabatan'],
                    'total_tugas'       => 0,
                    'count_koordinator' => 0,
                    'count_it'          => 0,
                    'count_pengawas'    => 0,
                    'periode_years'     => [],
                    'by_jenis_tes'      => [],
                    'last_tugas_date'   => $row['tanggal_mulai'],
                    'last_tugas_tilok'  => $row['nama_tilok'] ?: '-',
                    'assignments'       => [],
                ];
            }

            if ($periodeTahun !== '' && !in_array($periodeTahun, $byNip[$nip]['periode_years'], true)) {
                $byNip[$nip]['periode_years'][] = $periodeTahun;
            }

            $byNip[$nip]['total_tugas']++;
            $totalPenugasan++;

            if ($row['peran'] === 'Koordinator') {
                $byNip[$nip]['count_koordinator']++;
            } elseif ($row['peran'] === 'IT') {
                $byNip[$nip]['count_it']++;
            } else {
                $byNip[$nip]['count_pengawas']++;
            }

            $jtId = (string) ($row['resolved_jenis_tes_id'] ?? '0');
            if (!isset($byNip[$nip]['by_jenis_tes'][$jtId])) {
                $byNip[$nip]['by_jenis_tes'][$jtId] = [
                    'jenis_tes_id'   => (int) $jtId,
                    'jenis_tes_kode' => $row['jenis_tes_kode'] ?: 'CAT',
                    'jenis_tes_nama' => $row['jenis_tes_nama'] ?: 'Lainnya',
                    'total'          => 0,
                    'Koordinator'    => 0,
                    'IT'             => 0,
                    'Pengawas'       => 0,
                ];
            }
            $byNip[$nip]['by_jenis_tes'][$jtId]['total']++;
            $byNip[$nip]['by_jenis_tes'][$jtId][$row['peran']] = ($byNip[$nip]['by_jenis_tes'][$jtId][$row['peran']] ?? 0) + 1;

            if ($row['tanggal_mulai'] > $byNip[$nip]['last_tugas_date']) {
                $byNip[$nip]['last_tugas_date']  = $row['tanggal_mulai'];
                $byNip[$nip]['last_tugas_tilok'] = $row['nama_tilok'] ?: '-';
            }

            $byNip[$nip]['assignments'][] = [
                'jadwal_id'       => (int) $row['jadwal_id'],
                'jenis_tes_id'    => (int) ($row['resolved_jenis_tes_id'] ?? 0),
                'jenis_tes_nama'  => $row['jenis_tes_nama'],
                'jenis_tes_kode'  => $row['jenis_tes_kode'],
                'periode_tahun'   => $periodeTahun,
                'nama_seleksi'    => $row['nama_seleksi'],
                'nama_tilok'      => $row['nama_tilok'],
                'instansi_nama'   => $row['instansi_nama'],
                'peran'           => $row['peran'],
                'tanggal_mulai'   => $row['tanggal_mulai'],
                'tanggal_selesai' => $row['tanggal_selesai'],
                'nomor_st'        => $row['member_nomor_st'] ?: ($row['jadwal_nomor_st'] ?: ''),
                'st_status'       => ($row['member_nomor_st'] || $row['jadwal_nomor_st'] || $row['st_status'] === 'terhubung') ? 'terhubung' : 'menunggu',
            ];
        }

        $rows = array_values($byNip);
        foreach ($rows as &$rItem) {
            rsort($rItem['periode_years']);
        }
        unset($rItem);

        usort($rows, static function ($a, $b) {
            if ($a['total_tugas'] !== $b['total_tugas']) {
                return $b['total_tugas'] <=> $a['total_tugas'];
            }
            return strcmp((string) $a['nama'], (string) $b['nama']);
        });

        $totalPegawai = count($rows);
        $maxPenugasan = $totalPegawai > 0 ? (int) $rows[0]['total_tugas'] : 0;
        $avgPerPegawai = $totalPegawai > 0 ? round($totalPenugasan / $totalPegawai, 1) : 0;

        $yearRows = $this->db->query(
            "SELECT DISTINCT y FROM (
                SELECT NULLIF(TRIM(periode), '') AS y FROM txn_cat_jenis_periode
                UNION
                SELECT NULLIF(TRIM(periode), '') AS y FROM txn_cat_seleksi
                UNION
                SELECT CAST(YEAR(tanggal_mulai) AS CHAR) AS y FROM txn_cat_jadwal WHERE tanggal_mulai IS NOT NULL
            ) yrs
            WHERE y IS NOT NULL AND y REGEXP '^[0-9]{4}$'
            ORDER BY y DESC"
        )->getResultArray();
        $availableYears = array_map(static fn ($r) => (string) $r['y'], $yearRows ?: []);

        return [
            'jenis_tes_columns' => $jenisTesList,
            'available_years'   => $availableYears,
            'rows'              => $rows,
            'summary'           => [
                'total_pegawai'   => $totalPegawai,
                'total_penugasan' => $totalPenugasan,
                'avg_per_pegawai' => $avgPerPegawai,
                'max_penugasan'   => $maxPenugasan,
            ],
        ];
    }

    /**
     * Daftar unit / tim kerja dari data_pegawai_unit_kerja.
     */
    public function getUnitKerjaOptions(): array
    {
        if (!$this->db->tableExists('data_pegawai_unit_kerja')) {
            return [];
        }

        return $this->db->table('data_pegawai_unit_kerja')
            ->select('id, nama')
            ->orderBy('nama', 'ASC')
            ->get()
            ->getResultArray();
    }

    /**
     * Daftar pegawai aktif dari data_pegawai untuk pemilihan anggota tim.
     */
    public function getPegawaiOptions(string $keyword = '', int $limit = 100, string $unitKerjaId = ''): array
    {
        $builder = $this->db->table('data_pegawai p')
            ->select('p.id, p.nip, p.nama, p.jabatan, p.unit_kerja_id, uk.nama AS unit_kerja_nama, g.nama AS pangkat_gol, p.status_pegawai_id')
            ->join('data_pegawai_golongan g', 'g.id = p.gol_id', 'left')
            ->join('data_pegawai_unit_kerja uk', 'uk.id = p.unit_kerja_id', 'left')
            ->where('p.is_status', 1);

        $unitKerjaId = trim($unitKerjaId);
        if ($unitKerjaId !== '') {
            $builder->where('p.unit_kerja_id', $unitKerjaId);
        }

        $keyword = trim($keyword);
        if ($keyword !== '') {
            $builder->groupStart()
                ->like('p.nama', $keyword)
                ->orLike('p.nip', $keyword)
                ->orLike('p.jabatan', $keyword)
                ->orLike('uk.nama', $keyword)
                ->groupEnd();
        }

        return $builder->orderBy('p.nama', 'ASC')->limit($limit)->get()->getResultArray();
    }

    /**
     * Daftar default signers dari cfg_pnbp_signers.
     */
    public function getSignersList(): array
    {
        if (!$this->db->tableExists('cfg_pnbp_signers')) {
            return [];
        }
        return $this->db->table('cfg_pnbp_signers')->orderBy('id', 'ASC')->get()->getResultArray();
    }

    /**
     * Simpan atau perbarui master penandatangan default di cfg_pnbp_signers.
     */
    public function saveSigner(array $payload): array
    {
        if (!$this->db->tableExists('cfg_pnbp_signers')) {
            return ['ok' => false, 'code' => 500, 'message' => 'Tabel cfg_pnbp_signers belum tersedia.'];
        }

        $id        = (int) ($payload['id'] ?? 0);
        $kode      = trim((string) ($payload['kode'] ?? ''));
        $roleTitle = trim((string) ($payload['role_title'] ?? ''));
        $nama      = trim((string) ($payload['default_nama'] ?? ''));

        if ($kode === '' || $roleTitle === '' || $nama === '') {
            return ['ok' => false, 'code' => 422, 'message' => 'Kode, Jabatan Peran, dan Nama Penandatangan wajib diisi.'];
        }

        $now  = date('Y-m-d H:i:s');
        $data = [
            'kode'                => $kode,
            'role_title'          => $roleTitle,
            'default_nip'         => trim((string) ($payload['default_nip'] ?? '')) ?: null,
            'default_nama'        => $nama,
            'default_pangkat_gol' => trim((string) ($payload['default_pangkat_gol'] ?? '')) ?: null,
            'default_jabatan'     => trim((string) ($payload['default_jabatan'] ?? '')) ?: null,
            'is_active'           => isset($payload['is_active']) ? (int) $payload['is_active'] : 1,
            'updated_at'          => $now,
        ];

        if ($id > 0) {
            $ok = $this->db->table('cfg_pnbp_signers')->where('id', $id)->update($data);
        } else {
            $existing = $this->db->table('cfg_pnbp_signers')->where('kode', $kode)->get()->getRowArray();
            if ($existing) {
                $ok = $this->db->table('cfg_pnbp_signers')->where('id', $existing['id'])->update($data);
            } else {
                $data['created_at'] = $now;
                $ok = $this->db->table('cfg_pnbp_signers')->insert($data);
            }
        }

        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'Master penandatangan berhasil disimpan.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menyimpan master penandatangan.'];
    }

    /**
     * Hapus master penandatangan dari cfg_pnbp_signers.
     */
    public function deleteSigner(int $id): array
    {
        if ($id <= 0 || !$this->db->tableExists('cfg_pnbp_signers')) {
            return ['ok' => false, 'code' => 404, 'message' => 'Data penandatangan tidak ditemukan.'];
        }
        $ok = $this->db->table('cfg_pnbp_signers')->where('id', $id)->delete();
        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'Penandatangan berhasil dihapus.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menghapus penandatangan.'];
    }

    /**
     * Resolve username (NIP) berdasarkan user ID aktif.
     */
    public function resolveUsernameByUserId(int $userId): string
    {
        if ($userId <= 0) {
            return '';
        }
        $user = $this->db->table('auth_users')
            ->select('username')
            ->where('id', $userId)
            ->limit(1)
            ->get()
            ->getRowArray();

        return trim((string) ($user['username'] ?? ''));
    }

    /**
     * Resolve ID numerik txn_cat_jadwal dari ID atau UID.
     */
    public function resolveJadwalId($idOrUid): int
    {
        $val = trim((string) $idOrUid);
        if ($val === '' || !$this->db->tableExists('txn_cat_jadwal')) {
            return 0;
        }
        $builder = $this->db->table('txn_cat_jadwal')->select('id');
        if (is_numeric($val)) {
            $builder->where('id', (int) $val);
        } else {
            $builder->where('uid', $val);
        }
        $row = $builder->limit(1)->get()->getRowArray();
        return (int) ($row['id'] ?? 0);
    }

    /**
     * Daftar Master Jenis Tes per Tahun (txn_cat_jenis_periode) terhubung ke data_support_jenis_tes.
     */
    public function getMasterJenisPeriodeList(array $filters = []): array
    {
        if (!$this->db->tableExists('txn_cat_jenis_periode')) {
            return [];
        }

        $builder = $this->db->table('txn_cat_jenis_periode jp')
            ->select('
                jp.*,
                jt.kode AS jenis_tes_kode,
                jt.nama AS jenis_tes_nama,
                (SELECT COUNT(s.id) FROM txn_cat_seleksi s WHERE s.jenis_tes_id = jp.jenis_tes_id AND s.periode = jp.periode) AS total_kegiatan,
                (SELECT COUNT(t.id) FROM txn_cat_tilok t WHERE t.jenis_periode_id = jp.id OR (t.jenis_tes_id = jp.jenis_tes_id AND t.period = jp.periode)) AS total_tilok
            ')
            ->join('data_support_jenis_tes jt', 'jt.id = jp.jenis_tes_id', 'left');

        if (!empty($filters['tahun'])) {
            $builder->where('jp.periode', trim((string) $filters['tahun']));
        }
        if (!empty($filters['jenis_tes_id'])) {
            $builder->where('jp.jenis_tes_id', (int) $filters['jenis_tes_id']);
        }

        $search = trim((string) ($filters['search'] ?? $filters['keyword'] ?? ''));
        if ($search !== '') {
            $builder->groupStart()
                ->like('jt.kode', $search)
                ->orLike('jt.nama', $search)
                ->orLike('jp.periode', $search)
                ->groupEnd();
        }

        $builder->orderBy('jp.periode', 'DESC')->orderBy('jt.kode', 'ASC');
        return $builder->get()->getResultArray();
    }

    /**
     * Simpan atau perbarui Master Jenis Tes per Tahun (txn_cat_jenis_periode).
     */
    public function saveMasterJenisPeriode(array $payload, string $username = 'system'): array
    {
        if (!$this->db->tableExists('txn_cat_jenis_periode')) {
            return ['ok' => false, 'code' => 500, 'message' => 'Tabel txn_cat_jenis_periode belum tersedia.'];
        }

        $key        = trim((string) ($payload['key'] ?? $payload['uid'] ?? $payload['id'] ?? ''));
        $jenisTesId = (int) ($payload['jenis_tes_id'] ?? $payload['jenis'] ?? 0);
        $periode    = trim((string) ($payload['periode'] ?? $payload['tahun'] ?? ''));

        if ($jenisTesId <= 0 || !preg_match('/^\d{4}$/', $periode)) {
            return ['ok' => false, 'code' => 422, 'message' => 'Master Jenis Tes dan Tahun (4 digit) wajib diisi.'];
        }

        $masterJenis = $this->db->table('data_support_jenis_tes')->where('id', $jenisTesId)->get()->getRowArray();
        if (!$masterJenis) {
            return ['ok' => false, 'code' => 422, 'message' => 'Master Jenis Tes tidak ditemukan.'];
        }

        $existingRow = null;
        if ($key !== '') {
            $q = $this->db->table('txn_cat_jenis_periode');
            if (is_numeric($key)) {
                $q->where('id', (int) $key);
            } else {
                $q->where('uid', $key);
            }
            $existingRow = $q->get()->getRowArray();
            if (!$existingRow) {
                return ['ok' => false, 'code' => 404, 'message' => 'Data Jenis Tes per Tahun tidak ditemukan.'];
            }
        }

        $dup = $this->db->table('txn_cat_jenis_periode')
            ->where('jenis_tes_id', $jenisTesId)
            ->where('periode', $periode);
        if ($existingRow) {
            $dup->where('id !=', (int) $existingRow['id']);
        }
        if ($dup->get()->getRowArray()) {
            $label = $masterJenis['nama'] ?: $masterJenis['kode'];
            return ['ok' => false, 'code' => 409, 'message' => "Jenis tes '{$label}' untuk tahun {$periode} sudah terdaftar."];
        }

        $now = date('Y-m-d H:i:s');
        if ($existingRow) {
            $oldJenisId = (int) $existingRow['jenis_tes_id'];
            $oldPeriode = (string) $existingRow['periode'];

            $this->db->transBegin();
            $this->db->table('txn_cat_jenis_periode')->where('id', (int) $existingRow['id'])->update([
                'jenis_tes_id' => $jenisTesId,
                'periode'      => $periode,
                'updated_at'   => $now,
            ]);

            if ($oldJenisId !== $jenisTesId || $oldPeriode !== $periode) {
                $this->db->table('txn_cat_seleksi')
                    ->where('jenis_tes_id', $oldJenisId)
                    ->where('periode', $oldPeriode)
                    ->update([
                        'jenis_tes_id' => $jenisTesId,
                        'periode'      => $periode,
                        'updated_at'   => $now,
                    ]);

                $this->db->table('txn_cat_tilok')
                    ->where('jenis_periode_id', (int) $existingRow['id'])
                    ->update([
                        'jenis_tes_id' => $jenisTesId,
                        'period'       => $periode,
                        'updated_at'   => $now,
                    ]);
            }

            if ($this->db->transStatus() === false) {
                $this->db->transRollback();
                return ['ok' => false, 'code' => 500, 'message' => 'Gagal memperbarui Jenis Tes per Tahun.'];
            }
            $this->db->transCommit();
            return ['ok' => true, 'code' => 200, 'message' => 'Jenis Tes per Tahun berhasil diperbarui.'];
        }

        $ok = $this->db->table('txn_cat_jenis_periode')->insert([
            'uid'          => bin2hex(random_bytes(16)),
            'jenis_tes_id' => $jenisTesId,
            'periode'      => $periode,
            'created_by'   => substr($username ?: 'system', 0, 100),
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'Jenis Tes per Tahun berhasil ditambahkan.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menambahkan Jenis Tes per Tahun.'];
    }

    /**
     * Hapus Master Jenis Tes per Tahun jika belum memiliki relasi Kegiatan / Tilok / Jadwal.
     */
    public function deleteMasterJenisPeriode($idOrUid): array
    {
        $val = trim((string) $idOrUid);
        if ($val === '' || !$this->db->tableExists('txn_cat_jenis_periode')) {
            return ['ok' => false, 'code' => 422, 'message' => 'Parameter Jenis Tes per Tahun tidak valid.'];
        }

        $q = $this->db->table('txn_cat_jenis_periode');
        if (is_numeric($val)) {
            $q->where('id', (int) $val);
        } else {
            $q->where('uid', $val);
        }
        $row = $q->get()->getRowArray();
        if (!$row) {
            return ['ok' => false, 'code' => 404, 'message' => 'Data Jenis Tes per Tahun tidak ditemukan.'];
        }

        $kegiatanCount = (int) $this->db->table('txn_cat_seleksi')
            ->where('jenis_tes_id', (int) $row['jenis_tes_id'])
            ->where('periode', (string) $row['periode'])
            ->countAllResults();
        if ($kegiatanCount > 0) {
            return ['ok' => false, 'code' => 409, 'message' => "Tidak dapat dihapus karena masih memiliki {$kegiatanCount} kegiatan seleksi terhubung."];
        }

        $tilokCount = (int) $this->db->table('txn_cat_tilok')
            ->where('jenis_periode_id', (int) $row['id'])
            ->countAllResults();
        if ($tilokCount > 0) {
            return ['ok' => false, 'code' => 409, 'message' => "Tidak dapat dihapus karena masih dipakai oleh {$tilokCount} titik lokasi."];
        }

        if ($this->db->tableExists('txn_cat_jadwal')) {
            $jadwalCount = (int) $this->db->table('txn_cat_jadwal')
                ->where('jenis_periode_id', (int) $row['id'])
                ->countAllResults();
            if ($jadwalCount > 0) {
                return ['ok' => false, 'code' => 409, 'message' => "Tidak dapat dihapus karena masih terhubung dengan {$jadwalCount} jadwal kegiatan."];
            }
        }

        $ok = $this->db->table('txn_cat_jenis_periode')->where('id', (int) $row['id'])->delete();
        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'Jenis Tes per Tahun berhasil dihapus.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menghapus Jenis Tes per Tahun.'];
    }

    /**
     * Daftar Master Kegiatan Seleksi (txn_cat_seleksi) terhubung ke Jenis Tes per Tahun.
     */
    public function getMasterKegiatanList(array $filters = []): array
    {
        if (!$this->db->tableExists('txn_cat_seleksi')) {
            return [];
        }

        $builder = $this->db->table('txn_cat_seleksi s')
            ->select('
                s.*,
                jt.kode AS jenis_tes_kode,
                jt.nama AS jenis_tes_nama,
                jp.id AS jenis_periode_id,
                jp.uid AS jenis_periode_uid,
                (SELECT COUNT(t.id) FROM txn_cat_tilok t WHERE t.seleksi_id = s.id) AS total_tilok,
                (SELECT COUNT(j.id) FROM txn_cat_jadwal j WHERE j.seleksi_id = s.id) AS total_jadwal
            ')
            ->join('data_support_jenis_tes jt', 'jt.id = s.jenis_tes_id', 'left')
            ->join('txn_cat_jenis_periode jp', 'jp.jenis_tes_id = s.jenis_tes_id AND jp.periode = s.periode', 'left');

        if (!empty($filters['jenis_periode_id'])) {
            $jpRow = $this->db->table('txn_cat_jenis_periode')
                ->where('id', (int) $filters['jenis_periode_id'])
                ->get()
                ->getRowArray();
            if ($jpRow) {
                $builder->where('s.jenis_tes_id', (int) $jpRow['jenis_tes_id'])
                    ->where('s.periode', (string) $jpRow['periode']);
            } else {
                $builder->where('1 = 0', null, false);
            }
        } else {
            if (!empty($filters['jenis_tes_id'])) {
                $builder->where('s.jenis_tes_id', (int) $filters['jenis_tes_id']);
            }
            $tahun = trim((string) ($filters['periode'] ?? $filters['tahun'] ?? ''));
            if ($tahun !== '') {
                $builder->where('s.periode', $tahun);
            }
        }

        $search = trim((string) ($filters['search'] ?? $filters['keyword'] ?? ''));
        if ($search !== '') {
            $builder->groupStart()
                ->like('s.nama_seleksi', $search)
                ->orLike('jt.kode', $search)
                ->orLike('jt.nama', $search)
                ->orLike('s.periode', $search)
                ->groupEnd();
        }

        $builder->orderBy('s.periode', 'DESC')
            ->orderBy('jt.kode', 'ASC')
            ->orderBy('s.nama_seleksi', 'ASC');

        return $builder->get()->getResultArray();
    }

    /**
     * Simpan atau perbarui Master Kegiatan (txn_cat_seleksi) berdasarkan Jenis Tes per Tahun.
     */
    public function saveMasterKegiatan(array $payload, string $username = 'system'): array
    {
        if (!$this->db->tableExists('txn_cat_seleksi')) {
            return ['ok' => false, 'code' => 500, 'message' => 'Tabel txn_cat_seleksi belum tersedia.'];
        }

        $key            = trim((string) ($payload['key'] ?? $payload['uid'] ?? $payload['id'] ?? ''));
        $namaSeleksi    = trim((string) ($payload['nama_seleksi'] ?? ''));
        $jenisPeriodeId = (int) ($payload['jenis_periode_id'] ?? 0);
        $jenisTesId     = (int) ($payload['jenis_tes_id'] ?? 0);
        $periode        = trim((string) ($payload['periode'] ?? ''));

        if ($jenisPeriodeId > 0) {
            $jpRow = $this->db->table('txn_cat_jenis_periode')->where('id', $jenisPeriodeId)->get()->getRowArray();
            if (!$jpRow) {
                return ['ok' => false, 'code' => 422, 'message' => 'Master Jenis Tes per Tahun tidak ditemukan.'];
            }
            $jenisTesId = (int) $jpRow['jenis_tes_id'];
            $periode    = (string) $jpRow['periode'];
        } elseif ($jenisTesId > 0 && $periode !== '') {
            $jpRow = $this->db->table('txn_cat_jenis_periode')
                ->where('jenis_tes_id', $jenisTesId)
                ->where('periode', $periode)
                ->get()
                ->getRowArray();
            if ($jpRow) {
                $jenisPeriodeId = (int) $jpRow['id'];
            }
        }

        if ($namaSeleksi === '' || $jenisTesId <= 0 || !preg_match('/^\d{4}$/', $periode)) {
            return ['ok' => false, 'code' => 422, 'message' => 'Jenis Tes per Tahun dan Nama Kegiatan wajib diisi.'];
        }

        $existingRow = null;
        if ($key !== '') {
            $q = $this->db->table('txn_cat_seleksi');
            if (is_numeric($key)) {
                $q->where('id', (int) $key);
            } else {
                $q->where('uid', $key);
            }
            $existingRow = $q->get()->getRowArray();
            if (!$existingRow) {
                return ['ok' => false, 'code' => 404, 'message' => 'Data kegiatan tidak ditemukan.'];
            }
        }

        $dup = $this->db->table('txn_cat_seleksi')
            ->where('jenis_tes_id', $jenisTesId)
            ->where('periode', $periode)
            ->where('LOWER(TRIM(nama_seleksi))', strtolower($namaSeleksi));
        if ($existingRow) {
            $dup->where('id !=', (int) $existingRow['id']);
        }
        if ($dup->get()->getRowArray()) {
            return ['ok' => false, 'code' => 409, 'message' => 'Nama kegiatan sudah terdaftar pada Jenis Tes & Tahun yang sama.'];
        }

        $now = date('Y-m-d H:i:s');
        if ($existingRow) {
            $this->db->transBegin();
            $this->db->table('txn_cat_seleksi')->where('id', (int) $existingRow['id'])->update([
                'jenis_tes_id' => $jenisTesId,
                'nama_seleksi' => $namaSeleksi,
                'periode'      => $periode,
                'updated_at'   => $now,
            ]);

            $tilokUpdate = [
                'jenis_tes_id' => $jenisTesId,
                'period'       => $periode,
                'updated_at'   => $now,
            ];
            if ($jenisPeriodeId > 0) {
                $tilokUpdate['jenis_periode_id'] = $jenisPeriodeId;
            }
            $this->db->table('txn_cat_tilok')->where('seleksi_id', (int) $existingRow['id'])->update($tilokUpdate);

            if ($this->db->transStatus() === false) {
                $this->db->transRollback();
                return ['ok' => false, 'code' => 500, 'message' => 'Gagal memperbarui kegiatan.'];
            }
            $this->db->transCommit();
            return ['ok' => true, 'code' => 200, 'message' => 'Kegiatan seleksi berhasil diperbarui.'];
        }

        $ok = $this->db->table('txn_cat_seleksi')->insert([
            'uid'          => bin2hex(random_bytes(16)),
            'jenis_tes_id' => $jenisTesId,
            'nama_seleksi' => $namaSeleksi,
            'periode'      => $periode,
            'created_by'   => substr($username ?: 'system', 0, 100),
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'Kegiatan seleksi berhasil ditambahkan.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menambahkan kegiatan seleksi.'];
    }

    /**
     * Hapus Master Kegiatan jika belum digunakan oleh Titik Lokasi, Jadwal, atau Hasil Sesi.
     */
    public function deleteMasterKegiatan($idOrUid): array
    {
        $val = trim((string) $idOrUid);
        if ($val === '' || !$this->db->tableExists('txn_cat_seleksi')) {
            return ['ok' => false, 'code' => 422, 'message' => 'Parameter kegiatan tidak valid.'];
        }

        $q = $this->db->table('txn_cat_seleksi');
        if (is_numeric($val)) {
            $q->where('id', (int) $val);
        } else {
            $q->where('uid', $val);
        }
        $row = $q->get()->getRowArray();
        if (!$row) {
            return ['ok' => false, 'code' => 404, 'message' => 'Data kegiatan tidak ditemukan.'];
        }

        $seleksiId = (int) $row['id'];
        $tilokCount = (int) $this->db->table('txn_cat_tilok')->where('seleksi_id', $seleksiId)->countAllResults();
        if ($tilokCount > 0) {
            return ['ok' => false, 'code' => 409, 'message' => "Tidak dapat dihapus karena masih memiliki {$tilokCount} titik lokasi."];
        }

        if ($this->db->tableExists('txn_cat_jadwal')) {
            $jadwalCount = (int) $this->db->table('txn_cat_jadwal')->where('seleksi_id', $seleksiId)->countAllResults();
            if ($jadwalCount > 0) {
                return ['ok' => false, 'code' => 409, 'message' => "Tidak dapat dihapus karena masih digunakan {$jadwalCount} jadwal kegiatan."];
            }
        }

        if ($this->db->tableExists('txn_cat_hasil')) {
            $hasilCount = (int) $this->db->table('txn_cat_hasil')->where('seleksi_id', $seleksiId)->countAllResults();
            if ($hasilCount > 0) {
                return ['ok' => false, 'code' => 409, 'message' => "Tidak dapat dihapus karena masih memiliki {$hasilCount} rekap sesi hasil ujian."];
            }
        }

        $ok = $this->db->table('txn_cat_seleksi')->where('id', $seleksiId)->delete();
        return $ok
            ? ['ok' => true, 'code' => 200, 'message' => 'Kegiatan seleksi berhasil dihapus.']
            : ['ok' => false, 'code' => 500, 'message' => 'Gagal menghapus kegiatan seleksi.'];
    }

    /**
     * Daftar Master Titik Lokasi (txn_cat_tilok) lengkap dengan relasi Kegiatan, Jenis Tes/Tahun & Jenis Tes.
     */
    public function getMasterTilokList(array $filters = []): array
    {
        if (!$this->db->tableExists('txn_cat_tilok')) {
            return [];
        }

        $builder = $this->db->table('txn_cat_tilok t')
            ->select('
                t.*,
                s.nama_seleksi,
                s.periode AS seleksi_periode,
                s.jenis_tes_id AS seleksi_jenis_tes_id,
                jt.kode AS jenis_tes_kode,
                jt.nama AS jenis_tes_nama,
                COALESCE(
                    NULLIF(t.jenis_periode_id, 0),
                    (SELECT jp2.id FROM txn_cat_jenis_periode jp2 WHERE jp2.jenis_tes_id = COALESCE(s.jenis_tes_id, t.jenis_tes_id) AND jp2.periode = COALESCE(s.periode, t.period) LIMIT 1)
                ) AS resolved_jenis_periode_id,
                (SELECT COUNT(DISTINCT ti.instansi_id) FROM txn_cat_tilok_instansi ti WHERE ti.tilok_id = t.id) AS total_instansi,
                (SELECT COUNT(j.id) FROM txn_cat_jadwal j WHERE j.tilok_id = t.id) AS total_jadwal
            ', false)
            ->join('txn_cat_seleksi s', 's.id = t.seleksi_id', 'left')
            ->join('data_support_jenis_tes jt', 'jt.id = COALESCE(s.jenis_tes_id, t.jenis_tes_id)', 'left', false);

        if (!empty($filters['seleksi_id'])) {
            $builder->where('t.seleksi_id', (int) $filters['seleksi_id']);
        } elseif (!empty($filters['jenis_periode_id'])) {
            $jpRow = $this->db->table('txn_cat_jenis_periode')
                ->where('id', (int) $filters['jenis_periode_id'])
                ->get()
                ->getRowArray();
            if ($jpRow) {
                $jpId = (int) $jpRow['id'];
                $jtId = (int) $jpRow['jenis_tes_id'];
                $pr   = $this->db->escape((string) $jpRow['periode']);
                $builder->groupStart()
                    ->where('t.jenis_periode_id', $jpId)
                    ->orWhere("(COALESCE(s.jenis_tes_id, t.jenis_tes_id) = {$jtId} AND COALESCE(s.periode, t.period) = {$pr})", null, false)
                    ->groupEnd();
            } else {
                $builder->where('1 = 0', null, false);
            }
        } else {
            if (!empty($filters['jenis_tes_id'])) {
                $jtId = (int) $filters['jenis_tes_id'];
                $builder->where("COALESCE(s.jenis_tes_id, t.jenis_tes_id) = {$jtId}", null, false);
            }
            $tahun = trim((string) ($filters['periode'] ?? $filters['tahun'] ?? ''));
            if ($tahun !== '') {
                $pr = $this->db->escape($tahun);
                $builder->where("COALESCE(s.periode, t.period) = {$pr}", null, false);
            }
        }

        $search = trim((string) ($filters['search'] ?? $filters['keyword'] ?? ''));
        if ($search !== '') {
            $builder->groupStart()
                ->like('t.nama_tilok', $search)
                ->orLike('s.nama_seleksi', $search)
                ->orLike('jt.kode', $search)
                ->orLike('jt.nama', $search)
                ->groupEnd();
        }

        $builder->orderBy('t.period', 'DESC')
            ->orderBy('t.period_start_date', 'DESC')
            ->orderBy('t.id', 'DESC');

        return $builder->get()->getResultArray();
    }
}
