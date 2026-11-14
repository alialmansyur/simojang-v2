<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Exceptions\PageNotFoundException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\CATModel;
use App\Models\Apps\Services\CATPengelolaModel;

class FasilitasiCAT extends BaseController
{
    protected $catmodel;
    protected $pengelolaModel;
    protected $apps;
    protected $uploader;
    protected $dataTables;

    public function __construct()
    {
        $this->catmodel     = new CATModel();
        $this->pengelolaModel = new CATPengelolaModel();
        $this->apps         = new AppsModel();
        $this->uploader     = new ExcelUploader();
        $this->dataTables   = new DataTablesLib();
        $sess = session()->get();
    }

    public function getJenisPeriodeList()
    {
        $tahun = $this->request->getPost('tahun') ?? $this->request->getGet('tahun');
        $params = [];
        if (!empty($tahun)) {
            $params['tahun'] = is_array($tahun) ? $tahun : [$tahun];
        }
        $builder = $this->catmodel->getBuilder('recap-jenis-periode', $params);
        $list = $builder->get()->getResultArray();

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $list,
        ]);
    }

    /**
     * Resolve the logged-in user's NIP strictly from active session / hydrated JWT claims.
     */
    private function resolveAuthenticatedNip(): string
    {
        $nip = trim((string) session()->get('username'));
        if ($nip !== '') {
            return $nip;
        }

        $userId = (int) session()->get('userid');
        if ($userId > 0) {
            $user = $this->catmodel->db->table('auth_users')
                ->select('username')
                ->where('id', $userId)
                ->limit(1)
                ->get()
                ->getRowArray();
            $nip = trim((string) ($user['username'] ?? ''));
        }

        return $nip;
    }

    /**
     * Enforce strict NIP registration against cfg_cat_pengelola (no role-based bypass).
     */
    private function requireCatPengelolaAccess(): ?ResponseInterface
    {
        $nip = $this->resolveAuthenticatedNip();
        if ($nip === '' || !$this->catmodel->isCatPengelolaNip($nip)) {
            return $this->response->setStatusCode(403)->setJSON([
                'status'  => 'error',
                'message' => 'Akses ditolak. NIP Anda (' . ($nip !== '' ? $nip : '-') . ') tidak terdaftar sebagai Pengelola CAT.',
            ]);
        }

        return null;
    }

    public function getPengelolaAccess()
    {
        $nip = $this->resolveAuthenticatedNip();
        $authorized = $nip !== '' && $this->catmodel->isCatPengelolaNip($nip);

        return $this->response->setJSON([
            'status'     => 'success',
            'authorized' => $authorized,
            'nip'        => $nip,
            'data'       => $authorized ? $this->catmodel->getCatPengelolaList() : [],
        ]);
    }

    public function storePengelolaAccess()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $json       = $this->request->getJSON(true) ?: [];
        $nip        = trim((string) ($this->request->getPost('nip') ?? ($json['nip'] ?? '')));
        $nama       = $this->request->getPost('nama') ?? ($json['nama'] ?? null);
        $keterangan = $this->request->getPost('keterangan') ?? ($json['keterangan'] ?? null);
        $actorNip   = $this->resolveAuthenticatedNip();

        $res = $this->catmodel->addCatPengelolaNip($nip, $nama, $keterangan, $actorNip);
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $this->catmodel->getCatPengelolaList(),
        ]);
    }

    public function deletePengelolaAccess()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $json = $this->request->getJSON(true) ?: [];
        $nip  = trim((string) ($this->request->getPost('nip') ?? ($json['nip'] ?? '')));

        $res = $this->catmodel->removeCatPengelolaNip($nip);
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $this->catmodel->getCatPengelolaList(),
        ]);
    }

    public function getJenisTesList()
    {
        $search = trim((string) $this->request->getGet('search'));
        $rows = $this->apps->getCatJenisTes($search);

        return $this->response->setJSON([
            'status' => 'success',
            'data' => $rows,
        ]);
    }

    public function createJenisTes()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $kode = trim((string) $this->request->getPost('kode'));
        $nama = trim((string) $this->request->getPost('nama'));

        if ($kode === '' || $nama === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'Kode dan nama event wajib diisi.',
            ]);
        }

        if (strlen($kode) > 50 || strlen($nama) > 50) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'Panjang kode/nama maksimal 50 karakter.',
            ]);
        }

        if ($this->apps->isCatJenisKodeExists($kode)) {
            return $this->response->setStatusCode(409)->setJSON([
                'status' => 'error',
                'message' => 'Kode event sudah digunakan.',
            ]);
        }

        if ($this->apps->isCatJenisNamaExists($nama)) {
            return $this->response->setStatusCode(409)->setJSON([
                'status' => 'error',
                'message' => 'Nama event sudah digunakan.',
            ]);
        }

        $id = $this->apps->createCatJenisTes($kode, $nama);
        if (!$id) {
            return $this->response->setStatusCode(500)->setJSON([
                'status' => 'error',
                'message' => 'Gagal menambahkan event.',
            ]);
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Event berhasil ditambahkan.',
            'id' => (int) $id,
        ]);
    }

    public function updateJenisTes()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $id = (int) $this->request->getPost('id');
        $kode = trim((string) $this->request->getPost('kode'));
        $nama = trim((string) $this->request->getPost('nama'));

        if ($id <= 0 || $kode === '' || $nama === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'ID, kode, dan nama event wajib diisi.',
            ]);
        }

        if (strlen($kode) > 50 || strlen($nama) > 50) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'Panjang kode/nama maksimal 50 karakter.',
            ]);
        }

        if ($this->apps->isCatJenisKodeExists($kode, $id)) {
            return $this->response->setStatusCode(409)->setJSON([
                'status' => 'error',
                'message' => 'Kode event sudah digunakan.',
            ]);
        }

        if ($this->apps->isCatJenisNamaExists($nama, $id)) {
            return $this->response->setStatusCode(409)->setJSON([
                'status' => 'error',
                'message' => 'Nama event sudah digunakan.',
            ]);
        }

        $ok = $this->apps->updateCatJenisTes($id, $kode, $nama);
        if (!$ok) {
            return $this->response->setStatusCode(500)->setJSON([
                'status' => 'error',
                'message' => 'Gagal memperbarui event.',
            ]);
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Event berhasil diperbarui.',
        ]);
    }

    public function deleteJenisTes()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $id = (int) $this->request->getPost('id');
        if ($id <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'ID event tidak valid.',
            ]);
        }

        $usedCount = $this->apps->countCatTilokByJenisTes($id);
        $jpUsed = $this->apps->db->tableExists('txn_cat_jenis_periode')
            ? (int) $this->apps->db->table('txn_cat_jenis_periode')->where('jenis_tes_id', $id)->countAllResults()
            : 0;
        $selUsed = $this->apps->db->tableExists('txn_cat_seleksi')
            ? (int) $this->apps->db->table('txn_cat_seleksi')->where('jenis_tes_id', $id)->countAllResults()
            : 0;
        if ($usedCount > 0 || $jpUsed > 0 || $selUsed > 0) {
            return $this->response->setStatusCode(409)->setJSON([
                'status' => 'error',
                'message' => 'Jenis tes tidak bisa dihapus karena masih terhubung ke Jenis Tes per Tahun, Kegiatan, atau Tilok.',
            ]);
        }

        $ok = $this->apps->deleteCatJenisTes($id);
        if (!$ok) {
            return $this->response->setStatusCode(500)->setJSON([
                'status' => 'error',
                'message' => 'Gagal menghapus event.',
            ]);
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Event berhasil dihapus.',
        ]);
    }
    
    public function storeDataSeleksi()
    {
        $sess       = session()->get();
        $key        = trim((string) $this->request->getPost('key'));
        $jenis      = (int) $this->request->getPost('jenis');
        $periode    = trim((string) $this->request->getPost('periode'));

        if ($jenis <= 0 || $periode === '') {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Jenis tes dan tahun pelaksanaan wajib diisi.'
            ]);
        }

        // Ambil nama jenis tes dari model
        $masterJenis = $this->catmodel->getMasterJenisTes($jenis);
        if (!$masterJenis) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Jenis tes yang dipilih tidak valid.'
            ]);
        }

        $namaJenis = $masterJenis['nama'] ?: ($masterJenis['kode'] ?: 'Jenis Tes CAT');

        // Validasi: Cegah jenis tes yang sama terdaftar lebih dari sekali pada tahun/periode yang sama
        $existing = $this->catmodel->checkDuplicateJenisPeriode($jenis, $periode, $key !== '' ? $key : null);
        if ($existing) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => "Data sudah ada: Jenis tes '{$namaJenis}' sudah terdaftar untuk tahun pelaksanaan {$periode}."
            ]);
        }

        $dataInsert = [
            'jenis_tes_id'  => $jenis,
            'periode'       => $periode,
            'created_by'    => $sess['username'] ?? 'system'
        ];

        try {
            $this->catmodel->saveJenisPeriode($dataInsert, !empty($key) ? $key : null);
        } catch (\Throwable $e) {
            log_message('error', 'Gagal menyimpan jenis tes periode: ' . $e->getMessage());
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => "Data sudah ada: Jenis tes '{$namaJenis}' sudah terdaftar untuk tahun pelaksanaan {$periode}."
            ]);
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Jenis tes untuk tahun ' . $periode . ' berhasil disimpan.'
        ]);
    }

    public function storeDataTilok()
    {
        $sess             = session()->get();
        $key              = trim((string) $this->request->getPost('key'));
        $seleksiInput     = trim((string) $this->request->getPost('seleksi_id'));
        $jenis_periode_id = (int) $this->request->getPost('jenis_periode_id');
        $seleksi_uid      = trim((string) $this->request->getPost('seleksi_uid'));
        $jenis_tes_id     = (int) $this->request->getPost('jenis_tes_id');
        $period           = trim((string) ($this->request->getPost('period') ?? $this->request->getPost('periode')));
        $startdate        = $this->request->getPost('startdate') ?? $this->request->getPost('period_start_date');
        $enddate          = $this->request->getPost('enddate') ?? $this->request->getPost('period_end_date');
        $tilok            = trim((string) ($this->request->getPost('nama_tilok') ?? $this->request->getPost('tilok')));
        $capacity         = $this->request->getPost('kapasitas') ?? $this->request->getPost('capacity');

        // Resolve seleksi_id dari txn_cat_seleksi (menerima ID numerik atau UID)
        $seleksi_id = 0;
        if ($seleksiInput !== '') {
            $seleksiQuery = $this->apps->db->table('txn_cat_seleksi');
            if (is_numeric($seleksiInput)) {
                $seleksiQuery->groupStart()->where('id', (int) $seleksiInput)->orWhere('uid', $seleksiInput)->groupEnd();
            } else {
                $seleksiQuery->where('uid', $seleksiInput);
            }
            $seleksiRow = $seleksiQuery->get()->getRowArray();
            if ($seleksiRow) {
                $seleksi_id = (int) $seleksiRow['id'];
                if (!empty($seleksiRow['jenis_tes_id'])) {
                    $jenis_tes_id = (int) $seleksiRow['jenis_tes_id'];
                }
                if (!empty($seleksiRow['periode'])) {
                    $period = (string) $seleksiRow['periode'];
                }
                if ($jenis_periode_id <= 0 && $jenis_tes_id > 0 && $period !== '') {
                    $matchedJp = $this->apps->db->table('txn_cat_jenis_periode')
                        ->select('id')
                        ->where('jenis_tes_id', $jenis_tes_id)
                        ->where('periode', $period)
                        ->limit(1)
                        ->get()
                        ->getRowArray();
                    if ($matchedJp) {
                        $jenis_periode_id = (int) $matchedJp['id'];
                    }
                }
            } elseif (is_numeric($seleksiInput)) {
                $seleksi_id = (int) $seleksiInput;
            }
        }

        // Cari jenis_periode jika belum ada
        if ($jenis_periode_id <= 0 && !empty($seleksi_uid)) {
            $catPeriode = $this->catmodel->getJenisPeriodeRow('uid', $seleksi_uid);
            if ($catPeriode) {
                $jenis_periode_id = (int) $catPeriode['id'];
                if ($jenis_tes_id <= 0) $jenis_tes_id = (int) $catPeriode['jenis_tes_id'];
                if (empty($period)) $period = $catPeriode['periode'];
            }
        }

        if ($jenis_periode_id > 0 && ($jenis_tes_id <= 0 || empty($period))) {
            $catPeriode = $this->catmodel->getJenisPeriodeRow('id', $jenis_periode_id);
            if ($catPeriode) {
                if ($jenis_tes_id <= 0) $jenis_tes_id = (int) $catPeriode['jenis_tes_id'];
                if (empty($period)) $period = $catPeriode['periode'];
            }
        }

        if (empty($tilok)) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Nama titik lokasi wajib diisi.'
            ]);
        }

        $uid = $key === '' ? bin2hex(random_bytes(16)) : null;
        $dataInsert = [
            'seleksi_id'        => $seleksi_id > 0 ? $seleksi_id : null,
            'jenis_periode_id'  => $jenis_periode_id > 0 ? $jenis_periode_id : null,
            'jenis_tes_id'      => $jenis_tes_id > 0 ? $jenis_tes_id : null,
            'period'            => $period ?: date('Y'),
            'period_start_date' => !empty($startdate) ? $startdate : null,
            'period_end_date'   => !empty($enddate) ? $enddate : null,
            'nama_tilok'        => $tilok,
            'kapasitas'         => !empty($capacity) ? (float) $capacity : 0,
            'created_by'        => substr((string) ($sess['username'] ?? 'system'), 0, 18),
        ];
        if ($uid !== null) {
            $dataInsert['uid'] = $uid;
        }

        $this->catmodel->saveTilok($dataInsert, $key !== '' ? $key : null);

        $savedRow = null;
        if ($key !== '') {
            $savedQuery = $this->apps->db->table('txn_cat_tilok');
            if (is_numeric($key)) {
                $savedQuery->groupStart()->where('id', (int) $key)->orWhere('uid', $key)->groupEnd();
            } else {
                $savedQuery->where('uid', $key);
            }
            $savedRow = $savedQuery->get()->getRowArray();
        } else {
            $insertId = (int) $this->apps->db->insertID();
            if ($insertId > 0) {
                $savedRow = $this->apps->db->table('txn_cat_tilok')->where('id', $insertId)->get()->getRowArray();
            }
        }

        $this->apps->storeData([
            'layanan_id' => 28,
            'tanggal'    => date('Y-m-d'),
            'created_by' => $sess['username'] ?? 'system',
        ], 'activity_daily_logs');

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Data titik lokasi berhasil disimpan.',
            'data'    => $savedRow,
        ]);
    }

    public function updateDataHasil()
    {
        $sess = session()->get();
        $key            = trim((string) ($this->request->getPost('key') ?? $this->request->getPost('id') ?? ''));
        $instansi       = trim((string) $this->request->getPost('instansi'));
        $tanggal        = trim((string) $this->request->getPost('tanggal'));
        $sesi           = $this->request->getPost('sesi');
        $nilai_min      = $this->request->getPost('nilai_min');
        $nilai_max      = $this->request->getPost('nilai_max');
        $hadir          = $this->request->getPost('hadir');
        $tidak_hadir    = $this->request->getPost('tidak_hadir');
        $reschedule     = $this->request->getPost('reschedule');
        $memenuhi       = $this->request->getPost('memenuhi');
        $tidak_memenuhi = $this->request->getPost('tidak_memenuhi');

        if ($key === '' || $instansi === '' || $tanggal === '' || $sesi === null || $sesi === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Data tidak lengkap. Semua kolom wajib diisi.'
            ]);
        }

        $rowBuilder = $this->apps->db->table('txn_cat_hasil');
        if (is_numeric($key)) {
            $rowBuilder->groupStart()->where('id', (int) $key)->orWhere('uid', $key)->groupEnd();
        } else {
            $rowBuilder->where('uid', $key);
        }
        $existing = $rowBuilder->get()->getRowArray();
        if (!$existing) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Data sesi ujian tidak ditemukan.'
            ]);
        }

        $dataUpdate = [
            'instansi_id' => is_numeric($instansi) ? (int) $instansi : $instansi,
            'period_date' => $tanggal,
            'sesi'        => (int) $sesi,
            'hadir'       => $hadir !== null && $hadir !== '' ? (int) $hadir : 0,
            'tidak_hadir' => $tidak_hadir !== null && $tidak_hadir !== '' ? (int) $tidak_hadir : 0,
            'reschedule'  => $reschedule !== null && $reschedule !== '' ? (int) $reschedule : 0,
            'nilai_min'   => $nilai_min !== null && $nilai_min !== '' && $nilai_min !== '-' ? (float) $nilai_min : 0,
            'nilai_max'   => $nilai_max !== null && $nilai_max !== '' && $nilai_max !== '-' ? (float) $nilai_max : 0,
            'updated_at'  => date('Y-m-d H:i:s'),
        ];

        if ($memenuhi !== null && $memenuhi !== '') {
            $dataUpdate['memenuhi'] = (int) $memenuhi;
        }
        if ($tidak_memenuhi !== null && $tidak_memenuhi !== '') {
            $dataUpdate['tidak_memenuhi'] = (int) $tidak_memenuhi;
        }

        $this->apps->updateData($dataUpdate, (int) $existing['id'], 'txn_cat_hasil');

        $this->apps->storeData([
            'layanan_id' => 28,
            'tanggal'    => date('Y-m-d'),
            'created_by' => $sess['username'] ?? 'operator_cat',
        ], 'activity_daily_logs');

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Data berhasil disimpan.'
        ]);
    }

    public function storeDataInstansi()
    {
        $sess = session()->get();
        $tilokInput = trim((string) ($this->request->getPost('tilok_id') ?: $this->request->getPost('tilok_uid') ?: $this->request->getPost('key')));
        $instansi_id = trim((string) $this->request->getPost('instansi_id'));

        if ($tilokInput === '' || $instansi_id === '') {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Titik lokasi dan Instansi wajib dipilih.'
            ]);
        }

        // Resolve tilok_id jika berupa UUID
        $tilokBuilder = $this->apps->db->table('txn_cat_tilok')
            ->select('id, uid, nama_tilok');
        if (is_numeric($tilokInput)) {
            $tilokBuilder->groupStart()->where('id', (int) $tilokInput)->orWhere('uid', $tilokInput)->groupEnd();
        } else {
            $tilokBuilder->where('uid', $tilokInput);
        }
        $tilok = $tilokBuilder->get()->getRowArray();

        if (!$tilok) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Titik lokasi tidak ditemukan.'
            ]);
        }

        $tilok_id = (int) $tilok['id'];

        // Cek apakah sudah terdaftar di tilok ini
        $existing = $this->apps->db->table('txn_cat_tilok_instansi')
            ->where('tilok_id', $tilok_id)
            ->where('instansi_id', $instansi_id)
            ->get()->getRow();
            
        if (!$existing) {
            $this->apps->db->table('txn_cat_tilok_instansi')->insert([
                'tilok_id'    => $tilok_id,
                'instansi_id' => $instansi_id,
                'created_at'  => date('Y-m-d H:i:s')
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Instansi berhasil ditambahkan ke titik lokasi.',
            'data'    => [
                'tilok_id'    => $tilok_id,
                'instansi_id' => $instansi_id
            ]
        ]);
    }

    public function importData()
    {
        $sess = session()->get();
        $file = $this->request->getFile('file');
        $tilok_id = trim((string) ($this->request->getPost('tilok_id') ?? $this->request->getPost('key') ?? ''));
        $seleksi_id = $this->request->getPost('seleksi_id');
        $jenis_tes_id = $this->request->getPost('jenis_tes_id');

        if (!$file || !$file->isValid()) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Berkas Excel tidak valid atau belum dipilih.'
            ]);
        }

        if ($tilok_id === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Titik lokasi (tilok) wajib dipilih sebelum mengimpor data.'
            ]);
        }

        try {
            // Resolve tilok_id numeric sebelum parsing/insert
            $tilokBuilder = $this->apps->db->table('txn_cat_tilok')->select('id, seleksi_id, jenis_tes_id');
            if (is_numeric($tilok_id)) {
                $tilokBuilder->groupStart()->where('id', (int) $tilok_id)->orWhere('uid', $tilok_id)->groupEnd();
            } else {
                $tilokBuilder->where('uid', $tilok_id);
            }
            $rowTilok = $tilokBuilder->get()->getRowArray();
            if (!$rowTilok) {
                return $this->response->setStatusCode(404)->setJSON([
                    'status'  => 'error',
                    'message' => 'Titik lokasi (tilok) tidak ditemukan.'
                ]);
            }

            $realTilokId = (int) $rowTilok['id'];
            $resolvedSeleksiId = !empty($seleksi_id) ? (int) $seleksi_id : (!empty($rowTilok['seleksi_id']) ? (int) $rowTilok['seleksi_id'] : null);
            $resolvedJenisTesId = !empty($jenis_tes_id) ? (int) $jenis_tes_id : (!empty($rowTilok['jenis_tes_id']) ? (int) $rowTilok['jenis_tes_id'] : null);

            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows = $this->uploader->parseExcel($localPath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status'  => 'error',
                    'message' => 'Data berkas kosong atau format tidak sesuai template.'
                ]);
            }

            $scema_group = 'batch_' . bin2hex(random_bytes(8));
            $dataBatch = [];
            $uniqueInstansi = [];
            $skippedRows = [];
            $username = $sess['username'] ?? 'operator_cat';

            foreach (array_slice($rows, 1) as $index => $row) {
                $rowNum = $index + 2;
                $instansiRaw = trim((string) ($row[0] ?? ''));
                $tglRaw = $row[1] ?? '';
                if ($instansiRaw === '' && trim((string) $tglRaw) === '') {
                    continue;
                }

                $instansiId = $this->apps->getInstansiID($instansiRaw);
                if (empty($instansiId)) {
                    if (is_numeric($instansiRaw) && (int) $instansiRaw > 0) {
                        $instansiId = (string) (int) $instansiRaw;
                    } else {
                        $skippedRows[] = "Baris {$rowNum}: instansi '{$instansiRaw}' tidak dikenali";
                        continue;
                    }
                }

                $uniqueInstansi[$instansiId] = true;
                $tglVal = \App\Libraries\ExcelUploader::excelDate($tglRaw) ?: date('Y-m-d');

                $dataBatch[] = [
                    'scema_group'    => $scema_group,
                    'tilok_id'       => $realTilokId,
                    'seleksi_id'     => $resolvedSeleksiId,
                    'jenis_tes_id'   => $resolvedJenisTesId,
                    'instansi_id'    => (int) $instansiId,
                    'period_date'    => $tglVal,
                    'sesi'           => max(1, (int) ($row[2] ?? 1)),
                    'hadir'          => (int) ($row[4] ?? 0),
                    'tidak_hadir'    => (int) ($row[5] ?? 0),
                    'nilai_min'      => (float) ($row[6] ?? 0),
                    'nilai_max'      => (float) ($row[7] ?? 0),
                    'memenuhi'       => (int) ($row[8] ?? 0),
                    'tidak_memenuhi' => (int) ($row[9] ?? 0),
                    'reschedule'     => (int) ($row[10] ?? 0),
                    'created_by'     => $username,
                ];
            }

            if (empty($dataBatch)) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status'  => 'error',
                    'message' => !empty($skippedRows)
                        ? 'Tidak ada baris valid untuk diimpor (' . implode('; ', array_slice($skippedRows, 0, 3)) . ').'
                        : 'Tidak ada baris data yang valid pada file Excel.'
                ]);
            }

            $this->apps->db->transStart();
            foreach (array_keys($uniqueInstansi) as $insId) {
                $existIns = $this->apps->db->table('txn_cat_tilok_instansi')
                    ->where('tilok_id', $realTilokId)
                    ->where('instansi_id', (string) $insId)
                    ->get()->getRow();
                if (!$existIns) {
                    $this->apps->db->table('txn_cat_tilok_instansi')->insert([
                        'tilok_id'    => $realTilokId,
                        'instansi_id' => (string) $insId,
                        'created_at'  => date('Y-m-d H:i:s')
                    ]);
                }
            }

            $this->apps->insertBatchData($dataBatch, 'txn_cat_hasil');
            $this->apps->storeData([
                'layanan_id' => 28,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $username,
            ], 'activity_daily_logs');
            $this->apps->db->transComplete();

            if ($this->apps->db->transStatus() === false) {
                return $this->response->setStatusCode(500)->setJSON([
                    'status'  => 'error',
                    'message' => 'Transaksi database gagal saat mengimpor data sesi CAT.'
                ]);
            }

            return $this->response->setJSON([
                'status'         => 'success',
                'message'        => 'Berhasil mengimpor ' . count($dataBatch) . ' sesi ujian CAT.',
                'total_imported' => count($dataBatch),
                'skipped_rows'   => $skippedRows,
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal mengimpor file sesi CAT. Pastikan format sesuai template.',
                $e instanceof \RuntimeException ? 422 : 500,
                'FasilitasiCAT::importBatch'
            );
        }
    }

    public function storeDataRekap()
    {
        $sess = session()->get();
        $key            = trim((string) ($this->request->getPost('key') ?? $this->request->getPost('tilok_id') ?? ''));
        $seleksi_id     = (int) $this->request->getPost('seleksi_id');
        $jenis_tes_id   = (int) $this->request->getPost('jenis_tes_id');

        $instansi       = $this->request->getPost('instansi');
        $tanggal        = $this->request->getPost('tanggal');
        $sesi           = $this->request->getPost('sesi');
        $nilai_min      = $this->request->getPost('nilai_min');
        $nilai_max      = $this->request->getPost('nilai_max');
        $hadir          = $this->request->getPost('hadir');
        $tidak_hadir    = $this->request->getPost('tidak_hadir');
        $reschedule     = $this->request->getPost('reschedule');
        $memenuhi       = $this->request->getPost('memenuhi');
        $tidak_memenuhi = $this->request->getPost('tidak_memenuhi');

        if ($key === '' || !is_array($instansi) || empty($instansi) || !is_array($tanggal) || !is_array($sesi) || $seleksi_id <= 0 || $jenis_tes_id <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Data tidak lengkap. Pastikan Event, Tilok, dan minimal satu baris sesi terisi.'
            ]);
        }

        // Resolve tilok_id numerik jika dikirim sebagai UID
        $tilokBuilder = $this->apps->db->table('txn_cat_tilok')->select('id');
        if (is_numeric($key)) {
            $tilokBuilder->groupStart()->where('id', (int) $key)->orWhere('uid', $key)->groupEnd();
        } else {
            $tilokBuilder->where('uid', $key);
        }
        $tilokRow = $tilokBuilder->get()->getRowArray();
        if (!$tilokRow) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Titik lokasi (tilok) tidak ditemukan.'
            ]);
        }
        $realTilokId = (int) $tilokRow['id'];

        $scema_group = bin2hex(random_bytes(8));
        $dataBatch = [];
        $username = $sess['username'] ?? 'operator_cat';

        foreach ($instansi as $i => $n) {
            $insVal = trim((string) $n);
            $tglVal = trim((string) ($tanggal[$i] ?? ''));
            $sesiVal = $sesi[$i] ?? '';
            if ($insVal === '' || $tglVal === '' || $sesiVal === '' || (int) $sesiVal <= 0) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status'  => 'error',
                    'message' => 'Baris ke-' . ($i + 1) . ' tidak lengkap (Instansi, Tanggal, dan Sesi wajib diisi).'
                ]);
            }

            $dataBatch[] = [
                'scema_group'    => $scema_group,
                'tilok_id'       => $realTilokId,
                'seleksi_id'     => $seleksi_id,
                'jenis_tes_id'   => $jenis_tes_id,
                'instansi_id'    => is_numeric($insVal) ? (int) $insVal : $insVal,
                'period_date'    => $tglVal,
                'sesi'           => (int) $sesiVal,
                'hadir'          => (int) ($hadir[$i] ?? 0),
                'tidak_hadir'    => (int) ($tidak_hadir[$i] ?? 0),
                'reschedule'     => (int) ($reschedule[$i] ?? 0),
                'nilai_min'      => (float) ($nilai_min[$i] ?? 0),
                'nilai_max'      => (float) ($nilai_max[$i] ?? 0),
                'memenuhi'       => (int) ($memenuhi[$i] ?? 0),
                'tidak_memenuhi' => (int) ($tidak_memenuhi[$i] ?? 0),
                'created_by'     => $username,
            ];
        }

        $this->apps->db->transStart();
        $uniqueInstansi = array_unique(array_filter(array_map('strval', $instansi)));
        foreach ($uniqueInstansi as $insId) {
            $existIns = $this->apps->db->table('txn_cat_tilok_instansi')
                ->where('tilok_id', $realTilokId)
                ->where('instansi_id', $insId)
                ->get()->getRow();
            if (!$existIns) {
                $this->apps->db->table('txn_cat_tilok_instansi')->insert([
                    'tilok_id'    => $realTilokId,
                    'instansi_id' => $insId,
                    'created_at'  => date('Y-m-d H:i:s')
                ]);
            }
        }

        if (!empty($dataBatch)) {
            $this->apps->insertBatchData($dataBatch, 'txn_cat_hasil');
            $this->apps->storeData([
                'layanan_id' => 28,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $username,
            ], 'activity_daily_logs');
        }
        $this->apps->db->transComplete();

        if ($this->apps->db->transStatus() === false) {
            return $this->response->setStatusCode(500)->setJSON([
                'status'  => 'error',
                'message' => 'Transaksi database gagal saat menyimpan rekap sesi CAT.'
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Data berhasil disimpan.',
            'total_saved' => count($dataBatch),
        ]);
    }

    public function removeDataTilok(){
        $key  = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }

        $this->catmodel->deleteTilokByKey($key);
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function removeDataRekap(){
        $sess = session()->get();
        $key  = trim((string) ($this->request->getPost('key') ?? $this->request->getPost('id') ?? ''));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }

        $builder = $this->apps->db->table('txn_cat_hasil');
        if (is_numeric($key)) {
            $builder->groupStart()->where('id', (int) $key)->orWhere('uid', $key)->groupEnd();
        } else {
            $builder->where('uid', $key);
        }
        $row = $builder->get()->getRowArray();
        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => false,
                'message' => 'Data sesi ujian tidak ditemukan',
            ]);
        }

        $this->apps->removeData((int) $row['id'], 'txn_cat_hasil');
        $this->apps->storeData([
            'layanan_id' => 28,
            'tanggal'    => date('Y-m-d'),
            'created_by' => $sess['username'] ?? 'operator_cat',
        ], 'activity_daily_logs');

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data berhasil dihapus',
        ]);
    }

    public function removeDataTilokInstansi()
    {
        $sess = session()->get();
        $tilokInput  = trim((string) ($this->request->getPost('tilok_id') ?: $this->request->getPost('tilok_uid') ?: $this->request->getPost('key')));
        $instansi_id = trim((string) $this->request->getPost('instansi_id'));

        if ($tilokInput === '' || $instansi_id === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Parameter tilok dan instansi tidak valid'
            ]);
        }

        $tilokBuilder = $this->apps->db->table('txn_cat_tilok')->select('id');
        if (is_numeric($tilokInput)) {
            $tilokBuilder->groupStart()->where('id', (int) $tilokInput)->orWhere('uid', $tilokInput)->groupEnd();
        } else {
            $tilokBuilder->where('uid', $tilokInput);
        }
        $tilok = $tilokBuilder->get()->getRowArray();

        if (!$tilok) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => false,
                'message' => 'Titik lokasi tidak ditemukan'
            ]);
        }

        $tilokId = (int) $tilok['id'];

        // Hapus data dari txn_cat_tilok_instansi
        $this->apps->db->table('txn_cat_tilok_instansi')
            ->where('tilok_id', $tilokId)
            ->where('instansi_id', $instansi_id)
            ->delete();

        // Hapus juga rekap hasil sesi instansi ini pada tilok terkait
        $this->apps->db->table('txn_cat_hasil')
            ->where('tilok_id', $tilokId)
            ->where('instansi_id', $instansi_id)
            ->delete();

        $this->apps->storeData(
            [
                'layanan_id' => 28,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $sess['username'] ?? 'system'
            ],
            'activity_daily_logs'
        );

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Instansi dan data rekap terkait berhasil dihapus dari titik lokasi.',
        ]);
    }

    public function storeKegiatanSeleksi()
    {
        $sess = session()->get();
        $nama_seleksi = trim((string) $this->request->getPost('nama_seleksi'));
        $jenis_tes_id = (int) $this->request->getPost('jenis_tes_id');
        $periode      = trim((string) $this->request->getPost('periode')) ?: date('Y');

        if ($nama_seleksi === '' || $jenis_tes_id <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Nama kegiatan seleksi dan jenis tes wajib diisi.'
            ]);
        }

        $duplicate = $this->apps->db->table('txn_cat_seleksi')
            ->where('jenis_tes_id', $jenis_tes_id)
            ->where('periode', $periode)
            ->where('LOWER(TRIM(nama_seleksi))', strtolower($nama_seleksi))
            ->get()->getRowArray();

        if ($duplicate) {
            return $this->response->setStatusCode(409)->setJSON([
                'status'  => 'error',
                'message' => 'Kegiatan seleksi dengan nama, jenis tes, dan periode yang sama sudah terdaftar.',
                'id'      => (int) $duplicate['id'],
            ]);
        }

        $now = date('Y-m-d H:i:s');
        $data = [
            'uid'          => bin2hex(random_bytes(16)),
            'nama_seleksi' => $nama_seleksi,
            'jenis_tes_id' => $jenis_tes_id,
            'periode'      => $periode,
            'created_by'   => $sess['username'] ?? 'operator',
            'created_at'   => $now,
            'updated_at'   => $now,
        ];

        $this->apps->db->table('txn_cat_seleksi')->insert($data);
        $insertId = $this->apps->db->insertID();

        $this->apps->storeData([
            'layanan_id' => 28,
            'tanggal'    => date('Y-m-d'),
            'created_by' => $sess['username'] ?? 'operator',
        ], 'activity_daily_logs');

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Kegiatan seleksi berhasil ditambahkan.',
            'id'      => $insertId,
        ]);
    }

    public function getSeleksiOptions()
    {
        $search = trim((string) ($this->request->getGet('search') ?? $this->request->getPost('search') ?? ''));
        $jenis_tes_id = trim((string) ($this->request->getGet('jenis_tes_id') ?? $this->request->getPost('jenis_tes_id') ?? ''));
        $periode = trim((string) ($this->request->getGet('periode') ?? $this->request->getPost('periode') ?? ''));
        
        $builder = $this->apps->db->table('txn_cat_seleksi s')
            ->select('s.id, s.uid, s.nama_seleksi, s.periode, s.jenis_tes_id, jt.kode as jenis_tes_kode')
            ->join('data_support_jenis_tes jt', 'jt.id = s.jenis_tes_id', 'left');
            
        if ($search !== '') {
            $builder->like('s.nama_seleksi', $search);
        }
        
        if ($jenis_tes_id !== '') {
            $builder->where('s.jenis_tes_id', $jenis_tes_id);
        }

        if ($periode !== '') {
            $builder->where('s.periode', $periode);
        }
        
        $builder->orderBy('s.periode', 'DESC');
        $builder->orderBy('s.nama_seleksi', 'ASC');
        $builder->limit(100);
        
        $rows = $builder->get()->getResultArray();
        
        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $rows,
        ]);
    }

    public function getDataSeleksi(){
        $tahun = $this->request->getPost('tahun');
        if (!is_array($tahun)) { $tahun = []; }
        $tahun = array_values(array_filter(array_map('intval', $tahun), static function ($item) {
            return $item >= 2000 && $item <= 2100;
        }));

        $builder = $this->catmodel->getBuilder('recap-seleksi', [
            'tahun' => $tahun
        ]);

        $columns = [
            ['data' => 'id', 'search' => false, 'order' => 'a.id'],
            ['data' => 'uid', 'search' => false, 'order' => false],
            ['data' => 'jenis_tes_id', 'search' => false, 'order' => false],
            ['data' => 'jenis_tes_kode', 'search' => 'b.kode', 'order' => 'b.kode'],
            ['data' => 'jenis_tes_nama', 'search' => 'b.nama', 'order' => 'b.nama'],
            ['data' => 'nama_seleksi', 'search' => 'a.nama_seleksi', 'order' => 'a.nama_seleksi'],
            ['data' => 'periode', 'search' => 'a.periode', 'order' => 'a.periode'],
            ['data' => 'created_at', 'search' => 'a.created_at', 'order' => 'a.created_at'],
            ['data' => 'created_by', 'search' => false, 'order' => false],
            ['data' => 'updated_at', 'search' => false, 'order' => false],
        ];
        $result = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);   
    }

    public function removeDataSeleksi(){
        $key  = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }
        $this->catmodel->deleteJenisPeriodeByUid($key);
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getDataTilok(){
        $sess             = session()->get();
        $jenis_periode_id = $this->request->getPost('jenis_periode_id');
        $jenis_tes_id     = $this->request->getPost('jenis_tes_id');
        $periode          = $this->request->getPost('periode') ?? $this->request->getPost('period');

        $builder = $this->catmodel->getBuilder('recap-tilok', [
            'jenis_periode_id' => $jenis_periode_id,
            'jenis_tes_id'     => $jenis_tes_id,
            'period'           => $periode,
            'seleksi_id'       => $this->request->getPost('seleksi_id') ?? $this->request->getGet('seleksi_id'),
        ]);

        $columns = [
            [
                'data' => 'id',
                'search' => false,
                'order' => 'a.id',
            ],
            [
                'data' => 'uid',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'jenis_tes_id',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'jenis_tes',
                'search' => ['b.kode', 'b.nama'],
                'order' => 'b.kode',
            ],
            [
                'data' => 'period',
                'search' => 'a.period',
                'order' => 'a.period',
            ],
            [
                'data' => 'period_start_date',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'period_end_date',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'nama_tilok',
                'search' => 'a.nama_tilok',
                'order' => 'a.nama_tilok',
            ],
            [
                'data' => 'kapasitas',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'created_at',
                'search' => 'a.created_at',
                'order' => 'a.created_at',
            ],
            [
                'data' => 'created_by',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'updated_at',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'total_instansi',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'total_event',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'total_rekap',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'total_peserta',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'total_hadir',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'last_rekap_date',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'last_rekap_updated',
                'search' => false,
                'order' => false,
            ],
        ];
        $result     = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);   
    } 

    public function getDataDetailTilok(){
        $sess = session()->get();
        $bulan = $this->request->getPost('bulan');        
        $key = trim((string) ($this->request->getPost('key') ?? $this->request->getPost('id') ?? $this->request->getGet('key') ?? $this->request->getGet('id') ?? ''));

        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Kunci data tidak valid'
            ]);
        }

        if (!is_array($bulan)) {
            $bulan = [];
        }

        if (count($bulan) > 6) {
            return $this->response->setJSON([
                'error' => 'Maksimal 6 bulan diperbolehkan'
            ])->setStatusCode(400);
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $instansi_id = $this->request->getPost('instansi_id') ?? $this->request->getPost('instansi_id[]');
        if (is_array($instansi_id)) {
            $filter_instansi = array_values(array_filter(array_map('trim', $instansi_id)));
        } else {
            $trimmedIns = trim((string) $instansi_id);
            $filter_instansi = $trimmedIns !== '' ? [$trimmedIns] : [];
        }

        $seleksi_id = $this->request->getPost('seleksi_id');
        $tanggal     = trim((string)$this->request->getPost('tanggal'));
        $tgl_mulai   = trim((string)($this->request->getPost('tgl_mulai') ?? $this->request->getGet('tgl_mulai')));
        $tgl_selesai = trim((string)($this->request->getPost('tgl_selesai') ?? $this->request->getGet('tgl_selesai')));
        $sesi       = trim((string)$this->request->getPost('sesi'));

        $builder    = $this->catmodel->getBuilder('recap-hasil', [
            'id'          => $key,
            'bulan'       => $bulan,
            'instansi_id' => $filter_instansi,
            'seleksi_id'  => $seleksi_id,
            'tanggal'     => $tanggal,
            'tgl_mulai'   => $tgl_mulai,
            'tgl_selesai' => $tgl_selesai,
            'sesi'        => $sesi,
        ]);
        $columns = [
            [
                'data' => 'id',
                'search' => false,
                'order' => 'a.id',
            ],
            [
                'data' => 'uid',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'seleksi_id',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'jenis_tes_id',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'nama_seleksi',
                'search' => 's.nama_seleksi',
                'order' => 's.nama_seleksi',
            ],
            [
                'data' => 'instansi_logo',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'instansi_kodeins',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'period',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'nama_tilok',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'jenis_tes',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'instansi_nama',
                'search' => 'd.nama',
                'order' => 'd.nama',
            ],
            [
                'data' => 'instansi_id',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'period_date',
                'search' => 'a.period_date',
                'order' => 'a.period_date',
            ],
            [
                'data' => 'sesi',
                'search' => 'a.sesi',
                'order' => 'a.sesi',
            ],
            [
                'data' => 'nilai_min',
                'search' => false,
                'order' => 'a.nilai_min',
            ],
            [
                'data' => 'nilai_max',
                'search' => false,
                'order' => 'a.nilai_max',
            ],
            [
                'data' => 'hadir',
                'search' => false,
                'order' => 'a.hadir',
            ],
            [
                'data' => 'tidak_hadir',
                'search' => false,
                'order' => 'a.tidak_hadir',
            ],
            [
                'data' => 'reschedule',
                'search' => false,
                'order' => 'a.reschedule',
            ],
            [
                'data' => 'memenuhi',
                'search' => false,
                'order' => 'a.memenuhi',
            ],
            [
                'data' => 'tidak_memenuhi',
                'search' => false,
                'order' => 'a.tidak_memenuhi',
            ],
            [
                'data' => 'created_by',
                'search' => 'a.created_by',
                'order' => 'a.created_by',
            ],
            [
                'data' => 'created_at',
                'search' => 'a.created_at',
                'order' => 'a.created_at',
            ],
            [
                'data' => 'updated_at',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'scema_group',
                'search' => false,
                'order' => false,
            ],
            [
                'data' => 'tilok_id',
                'search' => false,
                'order' => false,
            ],
        ];

        $lastUpdateVal = $this->catmodel->getInstansiLastUpdate($key, $filter_instansi, $seleksi_id);

        $summaryBuilder = $this->catmodel->db->table('txn_cat_hasil a')
            ->select('
                COUNT(a.id) AS total_sesi,
                SUM(COALESCE(a.hadir, 0)) AS total_hadir,
                SUM(COALESCE(a.tidak_hadir, 0)) AS total_tidak_hadir,
                SUM(COALESCE(a.reschedule, 0)) AS total_reschedule,
                SUM(COALESCE(a.hadir, 0) + COALESCE(a.tidak_hadir, 0)) AS total_peserta,
                MIN(a.nilai_min) AS min_nilai,
                MAX(a.nilai_max) AS max_nilai,
                MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
            ')
            ->join('txn_cat_tilok b', 'b.id = a.tilok_id', 'inner');
        if (is_numeric($key)) {
            $summaryBuilder->groupStart()->where('b.id', (int)$key)->orWhere('b.uid', $key)->groupEnd();
        } else {
            $summaryBuilder->where('b.uid', $key);
        }

        if (!empty($filter_instansi)) {
            $summaryBuilder->whereIn('a.instansi_id', $filter_instansi);
        }
        if (!empty($seleksi_id)) {
            $summaryBuilder->where('a.seleksi_id', $seleksi_id);
        }
        if (!empty($bulan)) {
            $summaryBuilder->whereIn('MONTH(a.period_date)', $bulan);
        }
        if (!empty($tanggal)) {
            $summaryBuilder->where('a.period_date', $tanggal);
        }
        if (!empty($tgl_mulai)) {
            $summaryBuilder->where('a.period_date >=', $tgl_mulai);
        }
        if (!empty($tgl_selesai)) {
            $summaryBuilder->where('a.period_date <=', $tgl_selesai);
        }
        if (!empty($sesi)) {
            $summaryBuilder->where('a.sesi', $sesi);
        }

        $summaryStat = $summaryBuilder->get()->getRowArray() ?? [];

        $result = $this->dataTables->render($builder, $columns);
        $result['last_update'] = $lastUpdateVal;
        $result['summary_stat'] = $summaryStat;
        return $this->response->setJSON($result);   
    }

    public function getMetaDetailTilok()
    {
        $uid = trim((string) $this->request->getPost('key'));
        if ($uid === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Kunci data tidak valid'
            ]);
        }

        $meta = $this->catmodel->getDetailMeta($uid);
        if (!$meta) {
            return $this->response->setStatusCode(404)->setJSON([
                'error' => 'Data tilok tidak ditemukan'
            ]);
        }

        return $this->response->setJSON([
            'status' => true,
            'meta' => $meta,
        ]);
    }

    public function getSummaryDetailTilok()
    {
        $uid         = trim((string) ($this->request->getPost('key') ?? $this->request->getPost('id') ?? ''));
        $bulan       = $this->request->getPost('bulan');
        $seleksi_id  = $this->request->getPost('seleksi_id');
        $instansi_id = $this->request->getPost('instansi_id') ?? $this->request->getPost('instansi_id[]');
        $tgl_mulai   = trim((string) ($this->request->getPost('tgl_mulai') ?? '')) ?: null;
        $tgl_selesai = trim((string) ($this->request->getPost('tgl_selesai') ?? '')) ?: null;

        if ($uid === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Kunci data tidak valid'
            ]);
        }

        if (!is_array($bulan)) {
            $bulan = [];
        }

        if (count($bulan) > 6) {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Maksimal 6 bulan diperbolehkan'
            ]);
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status' => true,
            'summary' => $this->catmodel->getSummaryDetail($uid, $bulan, $seleksi_id, $instansi_id, $tgl_mulai, $tgl_selesai),
        ]);
    }

    public function getSummaryTilok()
    {
        $jenis_tes_id = $this->request->getPost('jenis_tes_id');

        return $this->response->setJSON([
            'status' => true,
            'summary' => $this->catmodel->getSummaryTilok($jenis_tes_id),
        ]);
    }

    public function getInstansiTilok()
    {
        $uid   = trim((string) ($this->request->getPost('key') ?? $this->request->getPost('id') ?? ''));
        $bulan = $this->request->getPost('bulan');

        if ($uid === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid'
            ]);
        }

        if (!is_array($bulan)) {
            $bulan = [];
        }

        if (count($bulan) > 6) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Maksimal 6 bulan diperbolehkan'
            ]);
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $seleksi_id = $this->request->getPost('seleksi_id');
        $data = $this->catmodel->getInstansiTilokGrouped($uid, $bulan, $seleksi_id);

        return $this->response->setJSON([
            'status' => true,
            'data'   => $data,
        ]);
    }

    public function getEventsByInstansi()
    {
        $tilokUid = trim((string) ($this->request->getPost('tilok_uid') ?? $this->request->getPost('key') ?? $this->request->getPost('id') ?? ''));
        $instansiId = trim((string) $this->request->getPost('instansi_id'));

        if ($tilokUid === '' || $instansiId === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Parameter tidak lengkap'
            ]);
        }

        $builder = $this->catmodel->db->table('txn_cat_hasil a');
        $builder->select('
            s.id AS seleksi_id, 
            s.uid AS seleksi_uid, 
            s.nama_seleksi, 
            s.periode, 
            jt.kode AS jenis_tes,
            COUNT(a.id) AS total_sesi,
            SUM(COALESCE(a.hadir, 0)) AS hadir,
            SUM(COALESCE(a.tidak_hadir, 0)) AS tidak_hadir,
            SUM(COALESCE(a.reschedule, 0)) AS reschedule,
            SUM(COALESCE(a.hadir, 0) + COALESCE(a.tidak_hadir, 0)) AS total_peserta,
            MIN(a.nilai_min) AS min_nilai,
            MAX(a.nilai_max) AS max_nilai,
            MAX(COALESCE(a.updated_at, a.created_at)) AS last_update
        ');
        $builder->join('txn_cat_tilok b', 'b.id = a.tilok_id', 'inner');
        $builder->join('txn_cat_seleksi s', 's.id = a.seleksi_id', 'inner');
        $builder->join('data_support_jenis_tes jt', 'jt.id = a.jenis_tes_id', 'left');
        if (is_numeric($tilokUid)) {
            $builder->groupStart()->where('b.id', (int)$tilokUid)->orWhere('b.uid', $tilokUid)->groupEnd();
        } else {
            $builder->where('b.uid', $tilokUid);
        }
        $builder->where('a.instansi_id', $instansiId);
        $builder->groupBy('s.id, s.uid, s.nama_seleksi, s.periode, jt.kode');
        $builder->orderBy('last_update', 'DESC');

        $events = $builder->get()->getResultArray();

        return $this->response->setJSON([
            'status' => true,
            'data'   => $events
        ]);
    }

    public function updateEventSeleksi()
    {
        $sess = session()->get();
        $tilokInput     = trim((string) ($this->request->getPost('tilok_uid') ?: $this->request->getPost('tilok_id')));
        $instansiId     = trim((string) $this->request->getPost('instansi_id'));
        $oldSeleksiId   = (int) $this->request->getPost('old_seleksi_id');
        $newSeleksiId   = (int) $this->request->getPost('new_seleksi_id');

        if ($tilokInput === '' || $instansiId === '' || $oldSeleksiId <= 0 || $newSeleksiId <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Parameter tidak lengkap untuk mengubah event seleksi.'
            ]);
        }

        if ($oldSeleksiId === $newSeleksiId) {
            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Tidak ada perubahan pada event seleksi.'
            ]);
        }

        // Resolve tilok_id
        $tilokBuilder = $this->apps->db->table('txn_cat_tilok')->select('id');
        if (is_numeric($tilokInput)) {
            $tilokBuilder->groupStart()->where('id', (int) $tilokInput)->orWhere('uid', $tilokInput)->groupEnd();
        } else {
            $tilokBuilder->where('uid', $tilokInput);
        }
        $tilok = $tilokBuilder->get()->getRowArray();

        if (!$tilok) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Titik lokasi tidak ditemukan.'
            ]);
        }

        $tilokId = (int) $tilok['id'];

        // Ambil data event seleksi baru
        $newSeleksi = $this->apps->db->table('txn_cat_seleksi')
            ->where('id', $newSeleksiId)
            ->get()->getRowArray();

        if (!$newSeleksi) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Event seleksi tujuan tidak ditemukan.'
            ]);
        }

        $newJenisTesId = !empty($newSeleksi['jenis_tes_id']) ? (int) $newSeleksi['jenis_tes_id'] : null;

        // Update data rekap hasil sesi pada tilok dan instansi terkait
        $updateData = [
            'seleksi_id' => $newSeleksiId,
            'updated_at' => date('Y-m-d H:i:s')
        ];
        if ($newJenisTesId !== null) {
            $updateData['jenis_tes_id'] = $newJenisTesId;
        }

        $affected = $this->apps->db->table('txn_cat_hasil')
            ->where('tilok_id', $tilokId)
            ->where('instansi_id', $instansiId)
            ->where('seleksi_id', $oldSeleksiId)
            ->update($updateData);

        $this->apps->storeData(
            [
                'layanan_id' => 28,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $sess['username'] ?? 'system'
            ],
            'activity_daily_logs'
        );

        return $this->response->setJSON([
            'status'   => 'success',
            'message'  => 'Event seleksi berhasil diperbarui.',
            'affected' => $affected
        ]);
    }

    // =========================================================================
    // PENGELOLA CAT: HUB SUMMARY, MANAJEMEN JADWAL, MANAJEMEN TIM, REKAP PEGAWAI
    // =========================================================================

    private function getPengelolaJsonOrPost(): array
    {
        $post = $this->request->getPost() ?: [];
        $json = $this->request->getJSON(true);
        if (is_array($json) && !empty($json)) {
            return array_merge($json, $post);
        }
        return $post;
    }

    public function getPengelolaSummary()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->pengelolaModel->getSummaryMetrics(),
        ]);
    }

    public function getPengelolaJadwal()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $filters = [
            'jenis_tes_id'     => $this->request->getGet('jenis_tes_id'),
            'jenis_periode_id' => $this->request->getGet('jenis_periode_id'),
            'seleksi_id'       => $this->request->getGet('seleksi_id'),
            'tilok_id'         => $this->request->getGet('tilok_id'),
            'instansi_id'      => $this->request->getGet('instansi_id'),
            'status'           => $this->request->getGet('status'),
            'st_status'        => $this->request->getGet('st_status'),
            'tahun'            => $this->request->getGet('tahun'),
            'search'           => $this->request->getGet('search'),
        ];

        $rows = $this->pengelolaModel->getJadwalList($filters);

        return $this->response->setJSON([
            'status'  => 'success',
            'data'    => $rows,
            'summary' => $this->pengelolaModel->getSummaryMetrics(),
        ]);
    }

    public function getPengelolaJadwalDetail(string $idOrUid)
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $row = $this->pengelolaModel->getJadwalDetail($idOrUid);
        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Jadwal tidak ditemukan.',
            ]);
        }

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $row,
        ]);
    }

    public function storePengelolaJadwal()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $res   = $this->pengelolaModel->saveJadwal($input, $this->resolveAuthenticatedNip());
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $res['data'] ?? null,
        ]);
    }

    public function linkStToJadwal()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input        = $this->getPengelolaJsonOrPost();
        $jadwalId     = $this->pengelolaModel->resolveJadwalId($input['jadwal_id'] ?? $input['jadwal_uid'] ?? 0);
        $stDocumentId = !empty($input['st_document_id']) ? (int) $input['st_document_id'] : null;
        $nomorSt      = isset($input['nomor_st']) ? (string) $input['nomor_st'] : null;
        $tanggalSt    = isset($input['tanggal_st']) ? (string) $input['tanggal_st'] : null;
        $timIds       = is_array($input['tim_ids'] ?? null) ? $input['tim_ids'] : [];
        $res          = $this->pengelolaModel->linkStToJadwal($jadwalId, $stDocumentId, $nomorSt, $tanggalSt, $timIds);
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $res['data'] ?? null,
        ]);
    }

    public function deletePengelolaJadwal()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input   = $this->getPengelolaJsonOrPost();
        $idOrUid = trim((string) ($input['uid'] ?? $input['id'] ?? $input['key'] ?? ''));
        $res     = $this->pengelolaModel->deleteJadwal($idOrUid);
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
        ]);
    }

    public function getPengelolaTim()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $filters = [
            'jadwal_id'    => $this->request->getGet('jadwal_id'),
            'jenis_tes_id' => $this->request->getGet('jenis_tes_id'),
            'seleksi_id'   => $this->request->getGet('seleksi_id'),
            'tilok_id'      => $this->request->getGet('tilok_id'),
            'instansi_id'   => $this->request->getGet('instansi_id'),
            'unit_kerja_id' => $this->request->getGet('unit_kerja_id'),
            'peran'         => $this->request->getGet('peran'),
            'st_status'    => $this->request->getGet('st_status'),
            'search'       => $this->request->getGet('search'),
        ];

        $rows = $this->pengelolaModel->getTimList($filters);

        return $this->response->setJSON([
            'status'  => 'success',
            'data'    => $rows,
            'summary' => $this->pengelolaModel->getSummaryMetrics(),
        ]);
    }

    public function storePengelolaTim()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $res   = $this->pengelolaModel->saveTim($input, $this->resolveAuthenticatedNip());
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
                'conflicts' => $res['conflicts'] ?? [],
            ]);
        }

        return $this->response->setJSON([
            'status'    => 'success',
            'message'   => $res['message'],
            'conflicts' => $res['conflicts'] ?? [],
            'data'      => $res['data'] ?? [],
        ]);
    }

    public function deletePengelolaTim()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $id    = (int) ($input['id'] ?? $input['key'] ?? 0);
        $res   = $this->pengelolaModel->deleteTimMember($id);
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
        ]);
    }

    public function getPengelolaRekapPegawai()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $filters = [
            'jenis_tes_id' => $this->request->getGet('jenis_tes_id'),
            'tahun'        => $this->request->getGet('tahun'),
            'peran'        => $this->request->getGet('peran'),
            'search'       => $this->request->getGet('search'),
        ];

        $result = $this->pengelolaModel->getRekapPegawai($filters);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $result,
        ]);
    }

    public function getPengelolaPegawaiOptions()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $search      = trim((string) $this->request->getGet('search'));
        $unitKerjaId = trim((string) $this->request->getGet('unit_kerja_id'));
        $limit       = (int) ($this->request->getGet('limit') ?? 50);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->pengelolaModel->getPegawaiOptions($search, max(5, min(500, $limit)), $unitKerjaId),
        ]);
    }

    public function getPengelolaUnitKerjaOptions()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->pengelolaModel->getUnitKerjaOptions(),
        ]);
    }

    public function getPengelolaSigners()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->pengelolaModel->getSignersList(),
        ]);
    }

    public function storePengelolaSigner()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $res   = $this->pengelolaModel->saveSigner($input);
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $this->pengelolaModel->getSignersList(),
        ]);
    }

    public function deletePengelolaSigner()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $res   = $this->pengelolaModel->deleteSigner((int) ($input['id'] ?? 0));
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $this->pengelolaModel->getSignersList(),
        ]);
    }

    public function getPengelolaMasterJenisPeriode()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $filters = [
            'tahun'        => $this->request->getGet('tahun') ?? $this->request->getGet('periode'),
            'jenis_tes_id' => $this->request->getGet('jenis_tes_id'),
            'search'       => $this->request->getGet('search'),
        ];

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->pengelolaModel->getMasterJenisPeriodeList($filters),
        ]);
    }

    public function storePengelolaMasterJenisPeriode()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $res   = $this->pengelolaModel->saveMasterJenisPeriode($input, $this->resolveAuthenticatedNip() ?: 'system');
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $this->pengelolaModel->getMasterJenisPeriodeList(),
        ]);
    }

    public function deletePengelolaMasterJenisPeriode()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $res   = $this->pengelolaModel->deleteMasterJenisPeriode($input['id'] ?? $input['uid'] ?? $input['key'] ?? '');
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $this->pengelolaModel->getMasterJenisPeriodeList(),
        ]);
    }

    public function getPengelolaMasterKegiatan()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $filters = [
            'jenis_periode_id' => $this->request->getGet('jenis_periode_id'),
            'jenis_tes_id'     => $this->request->getGet('jenis_tes_id'),
            'periode'          => $this->request->getGet('periode') ?? $this->request->getGet('tahun'),
            'search'           => $this->request->getGet('search'),
        ];

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->pengelolaModel->getMasterKegiatanList($filters),
        ]);
    }

    public function storePengelolaMasterKegiatan()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $res   = $this->pengelolaModel->saveMasterKegiatan($input, $this->resolveAuthenticatedNip() ?: 'system');
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $this->pengelolaModel->getMasterKegiatanList(),
        ]);
    }

    public function deletePengelolaMasterKegiatan()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getPengelolaJsonOrPost();
        $res   = $this->pengelolaModel->deleteMasterKegiatan($input['id'] ?? $input['uid'] ?? $input['key'] ?? '');
        if (!$res['ok']) {
            return $this->response->setStatusCode((int) $res['code'])->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $res['message'],
            'data'    => $this->pengelolaModel->getMasterKegiatanList(),
        ]);
    }

    public function getPengelolaMasterTilok()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $filters = [
            'jenis_periode_id' => $this->request->getGet('jenis_periode_id'),
            'seleksi_id'       => $this->request->getGet('seleksi_id'),
            'jenis_tes_id'     => $this->request->getGet('jenis_tes_id'),
            'periode'          => $this->request->getGet('periode') ?? $this->request->getGet('tahun'),
            'search'           => $this->request->getGet('search'),
        ];

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->pengelolaModel->getMasterTilokList($filters),
        ]);
    }
}
