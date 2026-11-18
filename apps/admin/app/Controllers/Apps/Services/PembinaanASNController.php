<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use App\Libraries\DataTablesLib;
use App\Libraries\ExcelUploader;
use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\PembinaanDisiplinBudayaCitraModel;
use App\Models\Apps\Services\PembinaanKompetensiKarierModel;
use App\Models\Apps\Services\PembinaanKinerjaModel;

class PembinaanASNController extends BaseController
{
    protected $appsModel;
    protected $dataTables;
    protected $kinerjaModel;
    protected $disiplinModel;
    protected $kompetensiModel;
    protected $layananId = 14;

    public function __construct()
    {
        $this->appsModel = new AppsModel();
        $this->dataTables = new DataTablesLib();
        $this->uploader = new ExcelUploader();
        $this->kinerjaModel = new PembinaanKinerjaModel();
        $this->disiplinModel = new PembinaanDisiplinBudayaCitraModel();
        $this->kompetensiModel = new PembinaanKompetensiKarierModel();
    }

    private function normalizeMonthsFromPost(string $key = 'period_months'): array
    {
        $raw = $this->request->getPost($key);
        if ($raw === null || $raw === '') {
            return [];
        }

        if (!is_array($raw)) {
            $raw = explode(',', (string) $raw);
        }

        $months = array_map(static fn($v) => (int) $v, (array) $raw);
        $months = array_values(array_filter(array_unique($months), static fn($m) => $m >= 1 && $m <= 12));
        sort($months);

        return $months;
    }

    public function getKinerjaOptions()
    {
        return $this->response->setJSON([
            'status' => 'success',
            'kategori' => $this->kinerjaModel->getKategoriOptions(),
            'years' => $this->kinerjaModel->getPeriodYears(),
        ]);
    }

    public function getKinerjaData()
    {

        $kategori = (int) ($this->request->getPost('kategori_id') ?? 0);
        $tahun = (int) ($this->request->getPost('period_year') ?? date('Y'));
        $months = $this->normalizeMonthsFromPost('period_months');

        $builder = $this->kinerjaModel->getBuilder('recap', [
            'kategori_id' => $kategori,
            'period_year' => $tahun,
            'period_months' => $months,
        ]);

        $columns = $this->kinerjaModel->getColumns('recap', [
            'kategori_id' => $kategori,
            'period_year' => $tahun,
        ]);

        $result = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getKinerjaSummary()
    {

        $kategori = (int) ($this->request->getPost('kategori_id') ?? 0);
        $tahun = (int) ($this->request->getPost('period_year') ?? date('Y'));
        $months = $this->normalizeMonthsFromPost('period_months');

        return $this->response->setJSON([
            'status' => 'success',
            'summary' => $this->kinerjaModel->getSummary([
                'kategori_id' => $kategori,
                'period_year' => $tahun,
                'period_months' => $months,
            ]),
            'kategori_breakdown' => $this->kinerjaModel->getKategoriBreakdown([
                'period_year' => $tahun,
                'period_months' => $months,
            ]),
        ]);
    }

    public function storeKinerjaData()
    {
        $this->layananId = $this->appsModel->getLayananIdByUrl('apps-pembinaan-kinerja', 14);

        $sess = session()->get();
        $key = (int) ($this->request->getPost('key') ?? 0);

        $rules = [
            'instansi' => 'required',
            'kategori_id' => 'required|integer',
            'period_year' => 'required|integer|greater_than[2000]',
            'period_date' => 'required',
            'capaian_percent' => 'required|decimal',
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => implode(', ', $this->validator->getErrors()),
            ]);
        }

        $capaian = (float) $this->request->getPost('capaian_percent');
        $kategoriId = (int) $this->request->getPost('kategori_id');
        $periodDate = trim((string) $this->request->getPost('period_date')) ?: date('Y-m-d');
        $statusId = $this->kinerjaModel->resolveStatusId($capaian);
        $kegiatanEnum = $this->kinerjaModel->resolveKegiatanEnum(
            $kategoriId,
            $this->request->getPost('kegiatan_code') ?: $this->request->getPost('kegiatan')
        );
        $aplikasiEnum = $this->kinerjaModel->resolveAplikasiEnum(
            $kegiatanEnum,
            $this->request->getPost('aplikasi_code') ?: $this->request->getPost('aplikasi')
        );
        $kategoriCapaianEnum = $this->kinerjaModel->resolveKategoriCapaianEnum($capaian);
        $now = date('Y-m-d H:i:s');

        $payload = [
            'layanan_id' => $this->layananId,
            'instansi_id' => trim((string) $this->request->getPost('instansi')),
            'kategori_id' => $kategoriId,
            'status_id' => $statusId,
            'period_year' => (int) $this->request->getPost('period_year'),
            'period_date' => $periodDate,
            'tanggal_data' => $periodDate,
            'capaian_percent' => $capaian,
            'pendampingan_date' => $this->request->getPost('pendampingan_date') ?: null,
            'catatan' => $this->request->getPost('catatan') ?: null,
            'kegiatan' => $kegiatanEnum,
            'aplikasi' => $aplikasiEnum,
            'kategori' => $kategoriCapaianEnum,
            'capaian_persen' => $capaian,
            'updated_by' => $sess['username'] ?? null,
            'updated_at' => $now,
        ];

        $existingId = $this->kinerjaModel->findExistingTxnId(
            $payload['instansi_id'],
            (int) $payload['kategori_id'],
            (int) $payload['period_year']
        );
        if ($existingId && $existingId !== $key) {
            $key = $existingId;
        }

        if ($key > 0) {
            $this->appsModel->updateData($payload, $key, 'txn_pembinaan_kinerja');
        } else {
            $payload['created_by'] = $sess['username'] ?? null;
            $payload['created_at'] = $now;
            $key = (int) $this->appsModel->storeData($payload, 'txn_pembinaan_kinerja');
        }

        $this->appsModel->storeData(
            [
                'layanan_id' => $this->layananId,
                'tanggal' => date('Y-m-d'),
                'created_by' => $sess['username'] ?? null,
            ],
            'activity_daily_logs'
        );

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data pembinaan kinerja berhasil disimpan.',
            'id' => $key,
        ]);
    }

    public function removeKinerjaData()
    {
        $key = (int) $this->request->getPost('key');
        if ($key <= 0) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Data tidak valid.',
            ]);
        }

        $this->appsModel->removeData($key, 'txn_pembinaan_kinerja');

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data berhasil dihapus.',
        ]);
    }

    public function getDisiplinOptions()
    {
        return $this->response->setJSON([
            'status' => 'success',
            'kategori' => $this->disiplinModel->getKategoriOptions(true),
            'pegawai' => $this->disiplinModel->getPegawaiOptions(),
            'years' => $this->disiplinModel->getPeriodYears(),
        ]);
    }

    public function getDisiplinData()
    {

        $kategori = (int) ($this->request->getPost('kategori_id') ?? 0);
        $rawTahun = $this->request->getPost('period_year');
        $tahun = ($rawTahun !== null && $rawTahun !== '' && strtoupper(trim((string)$rawTahun)) !== 'ALL' && is_numeric($rawTahun))
            ? (int) $rawTahun
            : 0;
        $jenis = strtoupper(trim((string) ($this->request->getPost('jenis_layanan') ?? 'ALL')));
        $months = $this->normalizeMonthsFromPost('period_months');

        $builder = $this->disiplinModel->getBuilder('list', [
            'kategori_id' => $kategori,
            'period_year' => $tahun,
            'jenis_layanan' => $jenis,
            'period_months' => $months,
        ]);

        $columns = $this->disiplinModel->getColumns('list');
        $result = $this->dataTables->render($builder, $columns);

        return $this->response->setJSON($result);
    }

    public function getDisiplinSummary()
    {

        $kategori = (int) ($this->request->getPost('kategori_id') ?? 0);
        $rawTahun = $this->request->getPost('period_year');
        $tahun = ($rawTahun !== null && $rawTahun !== '' && strtoupper(trim((string)$rawTahun)) !== 'ALL' && is_numeric($rawTahun))
            ? (int) $rawTahun
            : 0;
        $jenis = strtoupper(trim((string) ($this->request->getPost('jenis_layanan') ?? 'ALL')));
        $months = $this->normalizeMonthsFromPost('period_months');

        return $this->response->setJSON([
            'status' => 'success',
            'summary' => $this->disiplinModel->getSummary([
                'kategori_id' => $kategori,
                'period_year' => $tahun,
                'jenis_layanan' => $jenis,
                'period_months' => $months,
            ]),
            'jenis_breakdown' => $this->disiplinModel->getJenisBreakdown([
                'period_year' => $tahun,
                'kategori_id' => $kategori,
                'jenis_layanan' => $jenis,
                'period_months' => $months,
            ]),
            'kategori_breakdown' => $this->disiplinModel->getKategoriBreakdown([
                'period_year' => $tahun,
                'jenis_layanan' => $jenis,
                'period_months' => $months,
            ]),
        ]);
    }

    public function getDisiplinDetail()
    {

        $instansiId = trim((string) ($this->request->getPost('instansi_id') ?? ''));
        $rawTahun = $this->request->getPost('period_year');
        $tahun = ($rawTahun !== null && $rawTahun !== '' && strtoupper(trim((string)$rawTahun)) !== 'ALL' && is_numeric($rawTahun))
            ? (int) $rawTahun
            : 0;
        $jenis = strtoupper(trim((string) ($this->request->getPost('jenis_layanan') ?? 'ALL')));
        $kategori = (int) ($this->request->getPost('kategori_id') ?? 0);
        $months = $this->normalizeMonthsFromPost('period_months');

        if ($instansiId === '') {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Instansi tidak valid.',
                'list' => [],
            ]);
        }

        return $this->response->setJSON([
            'status' => 'success',
            'list' => $this->disiplinModel->getDetailByInstansi([
                'instansi_id' => $instansiId,
                'period_year' => $tahun,
                'jenis_layanan' => $jenis,
                'kategori_id' => $kategori,
                'period_months' => $months,
            ]),
        ]);
    }

    public function storeDisiplinData()
    {
        $this->layananId = $this->appsModel->getLayananIdByUrl('apps-pembinaan-disiplin-budaya-citra', 15);

        $sess = session()->get();
        $key = (int) ($this->request->getPost('key') ?? 0);

        $rules = [
            'instansi' => 'required',
            'kategori_id' => 'required|integer',
            'period_year' => 'required|integer|greater_than[2000]',
            'period_date' => 'required',
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => implode(', ', $this->validator->getErrors()),
            ]);
        }

        $kategoriId = (int) $this->request->getPost('kategori_id');
        $kategori = $this->disiplinModel->getKategoriById($kategoriId);
        if (!$kategori || (int) ($kategori['is_active'] ?? 0) !== 1) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Kategori tidak valid atau nonaktif.',
            ]);
        }

        $jenis = strtoupper((string) ($kategori['jenis_layanan'] ?? ''));
        $sourceKonsultasi = strtoupper(trim((string) ($this->request->getPost('source_konsultasi') ?? '')));
        $tempat = trim((string) ($this->request->getPost('tempat_kegiatan') ?? ''));
        $judul = trim((string) ($this->request->getPost('judul_kegiatan') ?? ''));
        $noSurat = trim((string) ($this->request->getPost('no_surat_kegiatan') ?? ''));
        $pegawaiIdsRaw = $this->request->getPost('pegawai_ids') ?? [];
        if (is_string($pegawaiIdsRaw)) {
            $pegawaiIdsRaw = explode(',', $pegawaiIdsRaw);
        }
        $pegawaiIds = [];
        foreach ((array) $pegawaiIdsRaw as $rawId) {
            foreach (explode(',', (string) $rawId) as $part) {
                $val = (int) trim($part);
                if ($val > 0) {
                    $pegawaiIds[] = $val;
                }
            }
        }
        $pegawaiIds = array_values(array_unique($pegawaiIds));

        if ($jenis === 'KONSULTASI' && !in_array($sourceKonsultasi, ['SURAT_MASUK', 'ZOOM', 'PPT'], true)) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Sumber konsultasi wajib dipilih (Surat Masuk, Zoom, atau PPT).',
            ]);
        }

        if (in_array($jenis, ['ASISTENSI', 'PEMBINAAN'], true)) {
            if ($tempat === '' || $judul === '' || $noSurat === '') {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Tempat, judul kegiatan, dan nomor surat wajib diisi.',
                ]);
            }
            if (empty($pegawaiIds)) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Minimal satu pegawai wajib dipilih.',
                ]);
            }
        }

        if ($jenis === 'REGULASI') {
            if ($judul === '' || $noSurat === '') {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Nomor surat/regulasi dan judul regulasi wajib diisi.',
                ]);
            }
        }

        $now = date('Y-m-d H:i:s');

        $payload = [
            'layanan_id' => $this->layananId,
            'instansi_id' => trim((string) $this->request->getPost('instansi')),
            'kategori_id' => $kategoriId,
            'period_year' => (int) $this->request->getPost('period_year'),
            'period_date' => $this->request->getPost('period_date'),
            'source_konsultasi' => $jenis === 'KONSULTASI' ? $sourceKonsultasi : null,
            'tempat_kegiatan' => in_array($jenis, ['ASISTENSI', 'PEMBINAAN', 'REGULASI'], true) ? ($tempat !== '' ? $tempat : null) : null,
            'judul_kegiatan' => in_array($jenis, ['ASISTENSI', 'PEMBINAAN', 'REGULASI'], true) ? $judul : null,
            'no_surat_kegiatan' => in_array($jenis, ['ASISTENSI', 'PEMBINAAN', 'REGULASI'], true) ? $noSurat : null,
            'catatan' => $this->request->getPost('catatan') ?: null,
            'updated_by' => $sess['username'] ?? null,
            'updated_at' => $now,
        ];

        if ($key > 0) {
            $this->appsModel->updateData($payload, $key, 'txn_pembinaan_disiplin_budaya_citra');
        } else {
            $payload['created_by'] = $sess['username'] ?? null;
            $payload['created_at'] = $now;
            $key = (int) $this->appsModel->storeData($payload, 'txn_pembinaan_disiplin_budaya_citra');
        }

        $this->disiplinModel->syncPegawaiByTxn($key, in_array($jenis, ['ASISTENSI', 'PEMBINAAN', 'REGULASI'], true) ? $pegawaiIds : []);

        $this->appsModel->storeData(
            [
                'layanan_id' => $this->layananId,
                'tanggal' => date('Y-m-d'),
                'created_by' => $sess['username'] ?? null,
            ],
            'activity_daily_logs'
        );

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data pembinaan disiplin berhasil disimpan.',
            'id' => $key,
        ]);
    }

    public function removeDisiplinData()
    {
        $key = (int) ($this->request->getPost('key') ?? 0);
        if ($key <= 0) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Data tidak valid.',
            ]);
        }

        $this->disiplinModel->removePegawaiByTxn($key);
        $this->appsModel->removeData($key, 'txn_pembinaan_disiplin_budaya_citra');
        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data berhasil dihapus.',
        ]);
    }

    public function getDisiplinKategoriData()
    {
        return $this->response->setJSON([
            'status' => 'success',
            'list' => $this->disiplinModel->getKategoriOptions(false),
        ]);
    }

    public function storeDisiplinKategori()
    {
        $sess = session()->get();
        $key = (int) ($this->request->getPost('key') ?? 0);

        $rules = [
            'nama' => 'required|min_length[3]',
            'jenis_layanan' => 'required',
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => implode(', ', $this->validator->getErrors()),
            ]);
        }

        $nama = trim((string) $this->request->getPost('nama'));
        $jenis = strtoupper(trim((string) $this->request->getPost('jenis_layanan')));
        $code = strtoupper(trim((string) ($this->request->getPost('code') ?? '')));
        if ($code === '') {
            $code = preg_replace('/[^A-Z0-9_]/', '', str_replace(' ', '_', strtoupper($nama)));
        }
        if ($code === '') {
            $code = 'KATEGORI_' . date('YmdHis');
        }

        $payload = [
            'code' => $code,
            'nama' => $nama,
            'jenis_layanan' => in_array($jenis, ['ASISTENSI', 'KONSULTASI', 'PEMBINAAN', 'REGULASI'], true) ? $jenis : 'ASISTENSI',
            'deskripsi' => $this->request->getPost('deskripsi') ?: null,
            'sort_order' => (int) ($this->request->getPost('sort_order') ?? 0),
            'is_active' => (int) (($this->request->getPost('is_active') ?? 1) ? 1 : 0),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if ($key > 0) {
            if ($this->disiplinModel->kategoriCodeExists($code, $key)) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Kode kategori sudah digunakan.',
                ]);
            }

            $this->appsModel->updateData($payload, $key, 'data_support_pembinaan_disiplin_kategori');
        } else {
            if ($this->disiplinModel->kategoriCodeExists($code)) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Kode kategori sudah digunakan.',
                ]);
            }

            $payload['created_at'] = date('Y-m-d H:i:s');
            $payload['updated_at'] = date('Y-m-d H:i:s');
            $key = (int) $this->appsModel->storeData($payload, 'data_support_pembinaan_disiplin_kategori');
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Kategori berhasil disimpan.',
            'id' => $key,
            'updated_by' => $sess['username'] ?? null,
        ]);
    }

    public function removeDisiplinKategori()
    {
        $key = (int) ($this->request->getPost('key') ?? 0);
        if ($key <= 0) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Kategori tidak valid.',
            ]);
        }

        if ($this->disiplinModel->countUsageByKategoriId($key) > 0) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Kategori sudah digunakan pada data transaksi.',
            ]);
        }

        $this->appsModel->removeData($key, 'data_support_pembinaan_disiplin_kategori');
        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }

    public function getKompetensiOptions()
    {
        return $this->response->setJSON([
            'status' => 'success',
            'years' => $this->kompetensiModel->getPeriodYears(),
        ]);
    }

    public function getKompetensiData()
    {

        $tahun = (int) ($this->request->getPost('period_year') ?? date('Y'));
        $category = trim((string) ($this->request->getPost('category') ?? $this->request->getPost('metode') ?? ''));
        $months = $this->normalizeMonthsFromPost('period_months');
        if (empty($months)) {
            $single = (int) ($this->request->getPost('period_month') ?? 0);
            if ($single >= 1 && $single <= 12) {
                $months = [$single];
            }
        }

        $builder = $this->kompetensiModel->getBuilder('recap', [
            'period_year' => $tahun,
            'category' => $category,
            'period_months' => $months,
        ]);

        $columns = $this->kompetensiModel->getColumns('recap');
        $result = $this->dataTables->render($builder, $columns);

        return $this->response->setJSON($result);
    }

    public function getKompetensiSummary()
    {

        $tahun = (int) ($this->request->getPost('period_year') ?? date('Y'));
        $months = $this->normalizeMonthsFromPost('period_months');
        if (empty($months)) {
            $single = (int) ($this->request->getPost('period_month') ?? 0);
            if ($single >= 1 && $single <= 12) {
                $months = [$single];
            }
        }

        return $this->response->setJSON([
            'status' => 'success',
            'summary' => $this->kompetensiModel->getSummary([
                'period_year' => $tahun,
                'period_months' => $months,
            ]),
        ]);
    }

    public function storeKompetensiData()
    {
        $this->layananId = $this->appsModel->getLayananIdByUrl('apps-pembinaan-kompetensi-karier', 16);

        $sess = session()->get();
        $key = (int) ($this->request->getPost('key') ?? 0);

        $rules = [
            'period_year' => 'required|integer|greater_than[2000]',
            'tanggal_kegiatan' => 'required',
            'judul_kegiatan' => 'required|min_length[5]',
            'materi' => 'required|min_length[5]',
            'total_partisipan' => 'required|integer',
            'metode' => 'required',
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => implode(', ', $this->validator->getErrors()),
            ]);
        }

        $now = date('Y-m-d H:i:s');
        $payload = [
            'layanan_id' => $this->layananId,
            'period_year' => (int) $this->request->getPost('period_year'),
            'tanggal_kegiatan' => $this->request->getPost('tanggal_kegiatan'),
            'judul_kegiatan' => trim((string) $this->request->getPost('judul_kegiatan')),
            'materi' => trim((string) $this->request->getPost('materi')),
            'total_partisipan' => max(0, (int) $this->request->getPost('total_partisipan')),
            'metode' => trim((string) $this->request->getPost('metode')),
            'lokasi' => $this->request->getPost('lokasi') ?: null,
            'penyelenggara' => $this->request->getPost('penyelenggara') ?: null,
            'eviden_link' => $this->request->getPost('eviden_link') ?: null,
            'catatan' => $this->request->getPost('catatan') ?: null,
            'updated_by' => $sess['username'] ?? null,
            'updated_at' => $now,
        ];

        if ($key > 0) {
            $this->appsModel->updateData($payload, $key, 'txn_pembinaan_kompetensi_karier');
        } else {
            $payload['created_by'] = $sess['username'] ?? null;
            $payload['created_at'] = $now;
            $key = (int) $this->appsModel->storeData($payload, 'txn_pembinaan_kompetensi_karier');
        }

        $this->appsModel->storeData(
            [
                'layanan_id' => $this->layananId,
                'tanggal' => date('Y-m-d'),
                'created_by' => $sess['username'] ?? null,
            ],
            'activity_daily_logs'
        );

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data pembinaan kompetensi berhasil disimpan.',
            'id' => $key,
        ]);
    }

    public function removeKompetensiData()
    {
        $key = (int) ($this->request->getPost('key') ?? 0);
        if ($key <= 0) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Data tidak valid.',
            ]);
        }

        $this->appsModel->removeData($key, 'txn_pembinaan_kompetensi_karier');
        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data berhasil dihapus.',
        ]);
    }

    public function importKinerjaBatch()
    {
        $session = session()->get();
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Berkas Excel wajib diunggah.',
            ]);
        }

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows = $this->uploader->parseExcel($localPath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Berkas Excel kosong atau format tidak sesuai.',
                ]);
            }

            $imported = 0;
            $now = date('Y-m-d H:i:s');
            $user = $session['username'] ?? 'system';

            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0])) continue;

                $instansiId = $this->appsModel->getInstansiID($row[0]);
                if (!$instansiId) {
                    $instansiId = is_numeric($row[0]) ? (int) $row[0] : 6100;
                }

                $kategoriId = !empty($row[1]) ? (int) $row[1] : 1;
                $periodYear = !empty($row[2]) ? (int) $row[2] : (int) date('Y');
                $periodDate = !empty($row[3]) ? ExcelUploader::excelDate($row[3]) : date('Y-m-d');
                $capaian = !empty($row[4]) ? (float) $row[4] : 0.0;
                $statusId = $this->kinerjaModel->resolveStatusId($capaian);
                $kegiatanEnum = $this->kinerjaModel->resolveKegiatanEnum($kategoriId);
                $aplikasiEnum = $this->kinerjaModel->resolveAplikasiEnum($kegiatanEnum);
                $kategoriCapaianEnum = $this->kinerjaModel->resolveKategoriCapaianEnum($capaian);
                $catatan = !empty($row[5]) ? trim((string) $row[5]) : null;

                $this->appsModel->storeData([
                    'layanan_id' => 14,
                    'instansi_id' => $instansiId,
                    'kategori_id' => $kategoriId,
                    'status_id' => $statusId,
                    'period_year' => $periodYear,
                    'period_date' => $periodDate,
                    'tanggal_data' => $periodDate,
                    'kegiatan' => $kegiatanEnum,
                    'aplikasi' => $aplikasiEnum,
                    'kategori' => $kategoriCapaianEnum,
                    'capaian_percent' => $capaian,
                    'capaian_persen' => $capaian,
                    'catatan' => $catatan,
                    'created_by' => $user,
                    'updated_by' => $user,
                    'created_at' => $now,
                    'updated_at' => $now,
                ], 'txn_pembinaan_kinerja');

                $imported++;
            }

            return $this->response->setJSON([
                'status' => 'success',
                'message' => "Berhasil mengimpor {$imported} data pembinaan kinerja.",
                'total_imported' => $imported,
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal membaca berkas Excel pembinaan kinerja.',
                $e instanceof \RuntimeException ? 422 : 500,
                'PembinaanASNController::importKinerjaBatch'
            );
        }
    }

    public function importKompetensiBatch()
    {
        $session = session()->get();
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Berkas Excel wajib diunggah.',
            ]);
        }

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows = $this->uploader->parseExcel($localPath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Berkas Excel kosong atau format tidak sesuai.',
                ]);
            }

            $imported = 0;
            $now = date('Y-m-d H:i:s');
            $user = $session['username'] ?? 'system';

            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0])) continue;

                $periodYear = !empty($row[0]) ? (int) $row[0] : (int) date('Y');
                $tanggal = !empty($row[1]) ? ExcelUploader::excelDate($row[1]) : date('Y-m-d');
                $judul = !empty($row[2]) ? trim((string) $row[2]) : 'Pelatihan / Bimtek ASN';
                $materi = !empty($row[3]) ? trim((string) $row[3]) : 'Materi Pembinaan Kompetensi';
                $totalPartisipan = !empty($row[4]) ? (int) $row[4] : 0;
                $metode = !empty($row[5]) ? trim((string) $row[5]) : 'Klasikal';
                $lokasi = !empty($row[6]) ? trim((string) $row[6]) : null;
                $penyelenggara = !empty($row[7]) ? trim((string) $row[7]) : null;
                $evidenLink = !empty($row[8]) ? trim((string) $row[8]) : null;
                $catatan = !empty($row[9]) ? trim((string) $row[9]) : null;

                $this->appsModel->storeData([
                    'layanan_id' => 15,
                    'period_year' => $periodYear,
                    'tanggal_kegiatan' => $tanggal,
                    'judul_kegiatan' => $judul,
                    'materi' => $materi,
                    'total_partisipan' => $totalPartisipan,
                    'metode' => $metode,
                    'lokasi' => $lokasi,
                    'penyelenggara' => $penyelenggara,
                    'eviden_link' => $evidenLink,
                    'catatan' => $catatan,
                    'created_by' => $user,
                    'updated_by' => $user,
                    'created_at' => $now,
                    'updated_at' => $now,
                ], 'txn_pembinaan_kompetensi_karier');

                $imported++;
            }

            return $this->response->setJSON([
                'status' => 'success',
                'message' => "Berhasil mengimpor {$imported} agenda pengembangan kompetensi.",
                'total_imported' => $imported,
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal membaca berkas Excel pembinaan kompetensi.',
                $e instanceof \RuntimeException ? 422 : 500,
                'PembinaanASNController::importKompetensiBatch'
            );
        }
    }

    public function importDisiplinBatch()
    {
        $session = session()->get();
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Berkas Excel wajib diunggah.',
            ]);
        }

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows = $this->uploader->parseExcel($localPath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Berkas Excel kosong atau format tidak sesuai.',
                ]);
            }

            $imported = 0;
            $now = date('Y-m-d H:i:s');
            $user = $session['username'] ?? 'system';

            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0])) continue;

                $instansiId = $this->appsModel->getInstansiID($row[0]);
                if (!$instansiId) {
                    $instansiId = is_numeric($row[0]) ? (int) $row[0] : 6100;
                }

                $kategoriId = !empty($row[1]) ? (int) $row[1] : 1;
                $periodYear = !empty($row[2]) ? (int) $row[2] : (int) date('Y');
                $periodDate = !empty($row[3]) ? ExcelUploader::excelDate($row[3]) : date('Y-m-d');
                $source = !empty($row[4]) ? strtoupper(trim((string) $row[4])) : 'SURAT_MASUK';
                $tempat = !empty($row[5]) ? trim((string) $row[5]) : null;
                $judul = !empty($row[6]) ? trim((string) $row[6]) : 'Pembinaan Disiplin ASN';
                $noSurat = !empty($row[7]) ? trim((string) $row[7]) : '-';
                $catatan = !empty($row[8]) ? trim((string) $row[8]) : null;

                $this->appsModel->storeData([
                    'layanan_id' => 16,
                    'instansi_id' => $instansiId,
                    'kategori_id' => $kategoriId,
                    'period_year' => $periodYear,
                    'period_date' => $periodDate,
                    'source_konsultasi' => $source,
                    'tempat_kegiatan' => $tempat,
                    'judul_kegiatan' => $judul,
                    'no_surat_kegiatan' => $noSurat,
                    'catatan' => $catatan,
                    'created_by' => $user,
                    'updated_by' => $user,
                    'created_at' => $now,
                    'updated_at' => $now,
                ], 'txn_pembinaan_disiplin_budaya_citra');

                $imported++;
            }

            return $this->response->setJSON([
                'status' => 'success',
                'message' => "Berhasil mengimpor {$imported} data pembinaan disiplin & budaya kerja.",
                'total_imported' => $imported,
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal membaca berkas Excel pembinaan disiplin.',
                $e instanceof \RuntimeException ? 422 : 500,
                'PembinaanASNController::importDisiplinBatch'
            );
        }
    }
}
