<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use CodeIgniter\Exceptions\PageNotFoundException;
use App\Models\Apps\Services\PNBPDocumentModel;
use App\Models\Apps\Services\PNBPDocTypeModel;
use App\Models\Apps\Services\PNBPPersonelModel;
use App\Models\Apps\Services\PNBPItemModel;
use App\Models\Apps\Services\PNBPSignatureModel;
use App\Models\Apps\Services\PNBPSignerModel;
use App\Services\PNBP\PNBPPdfService;
use App\Services\PNBP\PNBPHelper;
use App\Libraries\DataTablesLib;
use App\Models\Apps\Services\CATModel;
use App\Models\Apps\Services\CATPengelolaModel;
use CodeIgniter\HTTP\ResponseInterface;

class PNBPDocumentController extends BaseController
{
    protected PNBPDocumentModel $pnbpModel;
    protected PNBPDocTypeModel $docTypeModel;
    protected PNBPPersonelModel $personelModel;
    protected PNBPItemModel $itemModel;
    protected PNBPSignatureModel $signatureModel;
    protected PNBPSignerModel $signerModel;
    protected PNBPPdfService $pdfService;
    protected DataTablesLib $dataTables;
    protected CATModel $catModel;
    protected CATPengelolaModel $pengelolaModel;

    public function __construct()
    {
        $this->pnbpModel      = new PNBPDocumentModel();
        $this->docTypeModel   = new PNBPDocTypeModel();
        $this->personelModel  = new PNBPPersonelModel();
        $this->itemModel      = new PNBPItemModel();
        $this->signatureModel = new PNBPSignatureModel();
        $this->signerModel    = new PNBPSignerModel();
        $this->pdfService     = new PNBPPdfService();
        $this->dataTables     = new DataTablesLib();
        $this->catModel       = new CATModel();
        $this->pengelolaModel = new CATPengelolaModel();
    }

    /**
     * Endpoint AJAX: Data List Dokumen (Card / DataTable)
     */
    public function getData()
    {
        $params = [
            'keyword'     => $this->request->getPost('keyword') ?? $this->request->getPost('search[value]'),
            'doc_type'    => $this->request->getPost('doc_type'),
            'status'      => $this->request->getPost('status'),
            'seleksi_id'  => $this->request->getPost('seleksi_id'),
            'instansi_id' => $this->request->getPost('instansi_id'),
            'tilok_id'    => $this->request->getPost('tilok_id'),
            'tahun'       => $this->request->getPost('tahun'),
        ];

        $builder = $this->pnbpModel->getListBuilder($params);

        $columns = [
            ['data' => 'id', 'search' => false, 'order' => 'a.id'],
            ['data' => 'uid', 'search' => false, 'order' => false],
            ['data' => 'doc_type', 'search' => 'a.doc_type', 'order' => 'a.doc_type'],
            ['data' => 'doc_number', 'search' => 'a.doc_number', 'order' => 'a.doc_number'],
            ['data' => 'doc_date', 'search' => 'a.doc_date', 'order' => 'a.doc_date'],
            ['data' => 'title', 'search' => 'a.title', 'order' => 'a.title'],
            ['data' => 'status', 'search' => 'a.status', 'order' => 'a.status'],
            ['data' => 'nama_seleksi', 'search' => 's.nama_seleksi', 'order' => 's.nama_seleksi'],
            ['data' => 'nama_tilok', 'search' => 't.nama_tilok', 'order' => 't.nama_tilok'],
            ['data' => 'instansi_nama', 'search' => 'i.nama', 'order' => 'i.nama'],
            ['data' => 'created_at', 'search' => 'a.created_at', 'order' => 'a.created_at'],
            ['data' => 'updated_at', 'search' => 'a.updated_at', 'order' => 'a.updated_at'],
            ['data' => 'total_personel', 'search' => false, 'order' => false],
            ['data' => 'total_items', 'search' => false, 'order' => false],
            ['data' => 'total_signatures', 'search' => false, 'order' => false],
            ['data' => 'total_signed', 'search' => false, 'order' => false],
        ];

        $result = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    /**
     * Endpoint AJAX: Summary Metrik Status
     */
    public function getSummary()
    {
        $seleksiId = $this->request->getPost('seleksi_id');
        $tilokId   = $this->request->getPost('tilok_id');

        $summary = $this->pnbpModel->getSummaryMetrics([
            'seleksi_id' => $seleksiId,
            'tilok_id'   => $tilokId,
        ]);

        return $this->response->setJSON([
            'status'  => true,
            'summary' => $summary,
        ]);
    }

    /**
     * Endpoint AJAX: Lookup Titik Lokasi berdasarkan Seleksi
     */
    public function getTilokOptions()
    {
        $seleksiId = (int) $this->request->getPost('seleksi_id');
        if ($seleksiId <= 0) {
            return $this->response->setJSON(['status' => false, 'data' => []]);
        }

        $rows = $this->pnbpModel->getTilokOptionsBySeleksi($seleksiId);
        return $this->response->setJSON(['status' => true, 'data' => $rows]);
    }

    /**
     * Endpoint AJAX: Lookup Master Instansi
     */
    public function getInstansiOptions()
    {
        $q = (string) ($this->request->getGet('q') ?? $this->request->getPost('q') ?? '');
        $rows = $this->pnbpModel->getInstansiOptions($q, 50);

        return $this->response->setJSON([
            'status' => true,
            'data'   => $rows,
        ]);
    }

    /**
     * Endpoint AJAX: Search Master Pegawai untuk Select2
     */
    public function getPegawaiOptions()
    {
        $q = (string) ($this->request->getGet('q') ?? $this->request->getPost('q') ?? '');
        $rows = $this->pnbpModel->searchPegawai($q, 25);

        return $this->response->setJSON([
            'status' => true,
            'items'  => $rows,
        ]);
    }

    /**
     * Endpoint AJAX: Simpan / Update Header Dokumen
     */
    public function storeDocument()
    {
        $sess = session()->get();
        $key        = trim((string) $this->request->getPost('key'));
        $docType    = trim((string) $this->request->getPost('doc_type'));
        $docNumber  = trim((string) $this->request->getPost('doc_number'));
        $docDate    = trim((string) $this->request->getPost('doc_date'));
        $seleksiId  = (int) $this->request->getPost('seleksi_id');
        $instansiId = trim((string) $this->request->getPost('instansi_id'));
        $tilokId    = (int) $this->request->getPost('tilok_id');
        $title      = trim((string) $this->request->getPost('title'));
        $notes      = trim((string) $this->request->getPost('notes'));
        $mak        = trim((string) $this->request->getPost('mak'));
        $vendorName = trim((string) $this->request->getPost('vendor_name'));
        $vendorNpwp = trim((string) $this->request->getPost('vendor_npwp'));

        if ($docType === '' || $title === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Tipe dokumen dan judul/perihal wajib diisi.',
            ]);
        }

        $metaData = [
            'notes'       => $notes,
            'mak'         => $mak,
            'vendor_name' => $vendorName,
            'vendor_npwp' => $vendorNpwp,
        ];

        $dataPayload = [
            'doc_type'    => $docType,
            'doc_number'  => $docNumber ?: null,
            'doc_date'    => $docDate ?: date('Y-m-d'),
            'seleksi_id'  => $seleksiId > 0 ? $seleksiId : null,
            'instansi_id' => $instansiId !== '' ? $instansiId : null,
            'tilok_id'    => $tilokId > 0 ? $tilokId : null,
            'title'       => $title,
            'meta_data'   => json_encode($metaData),
        ];

        if ($key !== '') {
            // Update Dokumen
            $existing = $this->pnbpModel->where('uid', $key)->first();
            if (!$existing) {
                return $this->response->setStatusCode(404)->setJSON([
                    'status'  => 'error',
                    'message' => 'Dokumen yang akan diupdate tidak ditemukan.',
                ]);
            }

            $this->pnbpModel->update($existing['id'], $dataPayload);
            $docUid = $key;
        } else {
            // Create Dokumen Baru
            $docUid = bin2hex(random_bytes(16));
            $dataPayload['uid']        = $docUid;
            $dataPayload['status']     = 'draft';
            $dataPayload['created_by'] = $sess['username'] ?? 'system';

            $insertId = $this->pnbpModel->insert($dataPayload);
            if (!$insertId) {
                return $this->response->setStatusCode(500)->setJSON([
                    'status'  => 'error',
                    'message' => 'Gagal menyimpan dokumen baru.',
                ]);
            }

            // Inisialisasi Tanda Tangan Default
            $this->signatureModel->initDefaultSignatures((int) $insertId, $docType);
        }

        return $this->response->setJSON([
            'status'   => 'success',
            'message'  => 'Data dokumen berhasil disimpan.',
            'uid'      => $docUid,
            'doc_type' => $docType,
        ]);
    }

    /**
     * Endpoint AJAX: Simpan / Update Keterangan Header Dokumen
     */
    public function storeHeader()
    {
        $docUid           = trim((string) $this->request->getPost('document_uid'));
        $headerKeterangan = trim((string) $this->request->getPost('header_keterangan'));
        $instansiIds      = $this->request->getPost('instansi_ids');
        $instansiNames    = $this->request->getPost('instansi_names');
        $tanggalKegiatan  = trim((string) $this->request->getPost('tanggal_kegiatan'));

        $doc = $this->pnbpModel->where('uid', $docUid)->first();
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }

        $meta = !empty($doc['meta_data']) ? json_decode($doc['meta_data'], true) : [];
        $meta['header_keterangan'] = $headerKeterangan;
        $meta['instansi_ids']      = is_array($instansiIds) ? $instansiIds : (!empty($instansiIds) ? explode(',', $instansiIds) : []);
        $meta['instansi_names']    = is_array($instansiNames) ? $instansiNames : (!empty($instansiNames) ? explode(',', $instansiNames) : []);
        $meta['tanggal_kegiatan']  = $tanggalKegiatan;

        $this->pnbpModel->update((int) $doc['id'], [
            'meta_data'  => json_encode($meta),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Keterangan header berhasil disimpan.',
            'meta'    => $meta,
        ]);
    }

    /**
     * Endpoint AJAX: Tambah / Update Personel pada Dokumen
     */
    public function storePersonel()
    {
        $docUid        = trim((string) $this->request->getPost('document_uid'));
        $personelId    = (int) $this->request->getPost('personel_id');
        $nip           = trim((string) $this->request->getPost('nip'));
        $nama          = trim((string) $this->request->getPost('nama'));
        $pangkatGol    = trim((string) $this->request->getPost('pangkat_gol'));
        $nik           = trim((string) $this->request->getPost('nik'));
        $jabatan       = trim((string) $this->request->getPost('jabatan'));
        $peran         = trim((string) $this->request->getPost('peran'));
        $statusPegawai = trim((string) $this->request->getPost('status_pegawai'));
        $bankNama      = trim((string) $this->request->getPost('bank_nama'));
        $noRekening    = trim((string) $this->request->getPost('no_rekening'));
        
        $jumlahHari    = (int) $this->request->getPost('jumlah_hari') ?: 1;
        $uangHarian    = (float) $this->request->getPost('uang_harian');
        $transport     = (float) $this->request->getPost('transport');
        
        $jumlah        = (float) $this->request->getPost('jumlah');
        $pajakPersen   = (float) $this->request->getPost('pajak_persen');

        $doc = $this->pnbpModel->where('uid', $docUid)->first();
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen induk tidak ditemukan.',
            ]);
        }

        if ($nama === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Nama personel wajib diisi.',
            ]);
        }

        // Kalkulasi otomatis pajak & jumlah diterima
        $pajakNominal   = round($jumlah * ($pajakPersen / 100), 2);
        $jumlahDiterima = $jumlah - $pajakNominal;

        if ($doc['doc_type'] === 'nominatif') {
            $totalBiaya = $jumlah;
        } else {
            $totalBiaya = ($uangHarian * $jumlahHari) + $transport;
        }

        $payload = [
            'document_id'     => (int) $doc['id'],
            'nip'             => $nip ?: null,
            'nama'            => $nama,
            'pangkat_gol'     => $pangkatGol ?: null,
            'nik'             => $nik ?: null,
            'jabatan'         => $jabatan ?: null,
            'peran'           => $peran ?: null,
            'status_pegawai'  => $statusPegawai ?: null,
            'jumlah'          => $jumlah,
            'pajak_persen'    => $pajakPersen,
            'pajak_nominal'   => $pajakNominal,
            'jumlah_diterima' => $jumlahDiterima,
            'jumlah_hari'     => $jumlahHari,
            'uang_harian'     => $uangHarian,
            'transport'       => $transport,
            'total_biaya'     => $totalBiaya,
            'bank_nama'       => $bankNama ?: null,
            'no_rekening'     => $noRekening ?: null,
        ];

        if ($personelId > 0) {
            $this->personelModel->update($personelId, $payload);
        } else {
            $this->personelModel->insert($payload);
        }

        // Invalidate cache dengan update timestamp dokumen
        $this->pnbpModel->update((int) $doc['id'], ['updated_at' => date('Y-m-d H:i:s')]);

        $totals = $this->personelModel->calculateTotalBudget((int) $doc['id']);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Data pegawai/personel berhasil disimpan.',
            'totals'  => $totals,
        ]);
    }

    /**
     * Endpoint AJAX: Hapus Personel
     */
    public function removePersonel()
    {
        $id = (int) $this->request->getPost('id');
        if ($id <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'ID personel tidak valid.',
            ]);
        }

        $row = $this->personelModel->find($id);
        if ($row && !empty($row['document_id'])) {
            $this->pnbpModel->update((int) $row['document_id'], ['updated_at' => date('Y-m-d H:i:s')]);
        }

        $this->personelModel->delete($id);
        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Personel berhasil dihapus.',
        ]);
    }

    /**
     * Endpoint AJAX: Tambah / Update Item Jamuan
     */
    public function storeItems()
    {
        $docUid      = trim((string) $this->request->getPost('document_uid'));
        $itemId      = (int) $this->request->getPost('item_id');
        $itemName    = trim((string) $this->request->getPost('item_name'));
        $spesifikasi = trim((string) $this->request->getPost('spesifikasi'));
        $quantity    = (int) $this->request->getPost('quantity') ?: 1;
        $satuan      = trim((string) $this->request->getPost('satuan')) ?: 'Box';
        $hargaSatuan = (float) $this->request->getPost('harga_satuan');

        $doc = $this->pnbpModel->where('uid', $docUid)->first();
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen induk tidak ditemukan.',
            ]);
        }

        if ($itemName === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Nama item jamuan wajib diisi.',
            ]);
        }

        $totalHarga = $quantity * $hargaSatuan;

        $payload = [
            'document_id'  => (int) $doc['id'],
            'item_name'    => $itemName,
            'spesifikasi'  => $spesifikasi ?: null,
            'quantity'     => $quantity,
            'satuan'       => $satuan,
            'harga_satuan' => $hargaSatuan,
            'total_harga'  => $totalHarga,
        ];

        if ($itemId > 0) {
            $this->itemModel->update($itemId, $payload);
        } else {
            $this->itemModel->insert($payload);
        }

        // Invalidate cache dengan update timestamp dokumen
        $this->pnbpModel->update((int) $doc['id'], ['updated_at' => date('Y-m-d H:i:s')]);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Item jamuan berhasil disimpan.',
        ]);
    }

    /**
     * Endpoint AJAX: Hapus Item Jamuan
     */
    public function removeItem()
    {
        $id = (int) $this->request->getPost('id');
        if ($id <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'ID item tidak valid.',
            ]);
        }

        $row = $this->itemModel->find($id);
        if ($row && !empty($row['document_id'])) {
            $this->pnbpModel->update((int) $row['document_id'], ['updated_at' => date('Y-m-d H:i:s')]);
        }

        $this->itemModel->delete($id);
        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Item jamuan berhasil dihapus.',
        ]);
    }

    /**
     * Endpoint AJAX: Simpan Parameter Tanda Tangan
     */
    public function storeSignatureParam()
    {
        $sigId     = (int) $this->request->getPost('signature_id');
        $nama      = trim((string) $this->request->getPost('nama'));
        $nip       = trim((string) $this->request->getPost('nip'));
        $pangkatGol= trim((string) $this->request->getPost('pangkat_gol'));
        $jabatan   = trim((string) $this->request->getPost('jabatan'));
        $signTitle = trim((string) $this->request->getPost('sign_title'));

        if ($sigId <= 0 || $nama === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Nama pejabat penandatangan wajib diisi.',
            ]);
        }

        $sigRow = $this->signatureModel->find($sigId);
        if ($sigRow && !empty($sigRow['document_id'])) {
            $this->pnbpModel->update((int) $sigRow['document_id'], ['updated_at' => date('Y-m-d H:i:s')]);
        }

        $this->signatureModel->update($sigId, [
            'nama'        => $nama,
            'nip'         => $nip ?: null,
            'pangkat_gol' => $pangkatGol ?: null,
            'jabatan'     => $jabatan ?: null,
            'sign_title'  => $signTitle ?: null,
        ]);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Parameter penandatangan berhasil diperbarui.',
        ]);
    }

    /**
     * Endpoint AJAX: Simpan Seluruh Parameter Tanda Tangan Sekaligus (Left & Right)
     */
    public function storeSignersAll()
    {
        $docUid    = trim((string) $this->request->getPost('document_uid'));
        $signLeft  = $this->request->getPost('sign_left');
        $signRight = $this->request->getPost('sign_right');

        $doc = $this->pnbpModel->where('uid', $docUid)->first();
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }

        $signers = [];
        if (!empty($signLeft) && is_array($signLeft)) {
            $signers[] = $signLeft;
        }
        if (!empty($signRight) && is_array($signRight)) {
            $signers[] = $signRight;
        }

        $this->signatureModel->updateDocumentSigners((int) $doc['id'], $doc['doc_type'], $signers);
        $this->pnbpModel->update((int) $doc['id'], ['updated_at' => date('Y-m-d H:i:s')]);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Parameter penandatangan berhasil disimpan dan diperbarui.',
        ]);
    }

    /**
     * Endpoint AJAX: Ambil data tabel personel dan total kalkulasi real-time
     */
    public function getNominatifTableData()
    {
        $docUid = trim((string) $this->request->getPost('document_uid'));
        $doc = $this->pnbpModel->where('uid', $docUid)->first();
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }

        $personel = $this->personelModel->getPersonelByDocumentId((int) $doc['id']);
        $totals   = $this->personelModel->calculateTotalBudget((int) $doc['id']);

        return $this->response->setJSON([
            'status'   => 'success',
            'personel' => $personel,
            'totals'   => $totals,
        ]);
    }

    /**
     * Endpoint AJAX: Hapus Dokumen
     */
    public function removeDocument()
    {
        $key = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci dokumen tidak valid.',
            ]);
        }

        $deleted = $this->pnbpModel->deleteDocumentWithChildren($key);
        if (!$deleted) {
            return $this->response->setStatusCode(500)->setJSON([
                'status'  => false,
                'message' => 'Gagal menghapus dokumen.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Dokumen dan seluruh data terkait berhasil dihapus.',
        ]);
    }

    /**
     * Endpoint AJAX: Generate Dokumen PDF
     */
    public function generatePdf()
    {
        $uid = trim((string) $this->request->getPost('uid'));
        if ($uid === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'UID dokumen tidak valid.',
            ]);
        }

        try {
            ini_set('memory_limit', '512M');
            set_time_limit(120);

            $result = $this->pdfService->getOrGeneratePdf($uid, true);

            return $this->response->setJSON([
                'status'   => 'success',
                'message'  => 'PDF berhasil dibuat.',
                'preview'  => base_url('apps-pnbp/preview-pdf/' . $uid),
                'download' => base_url('apps-pnbp/download-pdf/' . $uid),
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                'Gagal membuat PDF dokumen PNBP. Silakan periksa log server.',
                500,
                'PNBPDocumentController::generatePdf'
            );
        }
    }

    /**
     * Endpoint Streaming PDF Preview (Iframe / Browser Inline)
     * Menggunakan Smart Disk Caching untuk streaming instan (0% beban CPU mPDF berulang)
     */
    public function previewPdf(string $uid)
    {
        try {
            ini_set('memory_limit', '512M');
            set_time_limit(120);

            $result = $this->pdfService->getOrGeneratePdf($uid, false);
            $contentLength = strlen($result['binary']);

            return $this->response
                ->setHeader('Content-Type', 'application/pdf')
                ->setHeader('Content-Disposition', 'inline; filename="' . $result['filename'] . '"')
                ->setHeader('Content-Length', (string) $contentLength)
                ->setHeader('Accept-Ranges', 'bytes')
                ->setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
                ->setHeader('Pragma', 'public')
                ->setBody($result['binary']);
        } catch (\Throwable $e) {
            log_message('error', '[PNBP PDF Preview Error] ' . $e->getMessage());
            throw PageNotFoundException::forPageNotFound($e->getMessage());
        }
    }

    /**
     * Endpoint Download PDF File
     */
    public function downloadPdf(string $uid)
    {
        try {
            ini_set('memory_limit', '512M');
            set_time_limit(120);

            $result = $this->pdfService->getOrGeneratePdf($uid, false);
            $contentLength = strlen($result['binary']);

            return $this->response
                ->setHeader('Content-Type', 'application/pdf')
                ->setHeader('Content-Disposition', 'attachment; filename="' . $result['filename'] . '"')
                ->setHeader('Content-Length', (string) $contentLength)
                ->setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
                ->setHeader('Pragma', 'public')
                ->setBody($result['binary']);
        } catch (\Throwable $e) {
            log_message('error', '[PNBP PDF Download Error] ' . $e->getMessage());
            throw PageNotFoundException::forPageNotFound($e->getMessage());
        }
    }

    /**
     * Endpoint Diagnostic: Test server environment and mPDF health
     */
    public function diagnose()
    {
        $role = strtoupper(trim((string) (session()->get('role') ?? '')));
        if ((int) (session()->get('userid') ?? 0) <= 0 || $role !== 'ADM') {
            return $this->response->setStatusCode(403)->setJSON([
                'status'  => 'error',
                'message' => 'Hanya administrator sistem yang dapat mengakses diagnostik server.',
            ]);
        }

        $start = microtime(true);
        $tests = [];

        $tests['php_version'] = PHP_VERSION;
        $tests['ext_gd'] = extension_loaded('gd') ? 'OK' : 'MISSING';
        $tests['ext_mbstring'] = extension_loaded('mbstring') ? 'OK' : 'MISSING';
        $tests['ext_xml'] = extension_loaded('xml') ? 'OK' : 'MISSING';

        $cacheDir = WRITEPATH . 'cache/mpdf';
        if (!is_dir($cacheDir)) {
            @mkdir($cacheDir, 0775, true);
        }
        $tests['cache_mpdf_writable'] = is_writable($cacheDir) ? 'YES' : 'NO';

        $uploadDir = (new \App\Services\Storage\FileStorageService())->ensureDirectory('private/pnbp');
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0775, true);
        }
        $tests['uploads_pnbp_writable'] = is_writable($uploadDir) ? 'YES' : 'NO';

        try {
            $mpdfStart = microtime(true);
            $mpdf = $this->pdfService->createMpdfInstance('sp');
            $mpdf->WriteHTML('<div style="font-family:dejavusans; font-size:14pt; color:#1e293b;"><b>SIMOJANG PNBP mPDF Diagnostic Test</b><p>mPDF is working properly on this server!</p></div>');
            $pdf = $mpdf->Output('', 'S');
            $mpdfElapsed = round((microtime(true) - $mpdfStart), 3);

            $tests['mpdf_test'] = 'SUCCESS';
            $tests['mpdf_output_size'] = strlen($pdf) . ' bytes';
            $tests['mpdf_render_time'] = $mpdfElapsed . ' seconds';
        } catch (\Throwable $e) {
            log_message('error', '[PNBP Diagnose mPDF Error] {message}', ['message' => $e->getMessage()]);
            $tests['mpdf_test'] = 'FAILED';
        }

        $totalTime = round((microtime(true) - $start), 3);
        $tests['total_diagnostic_time'] = $totalTime . ' seconds';

        return $this->response->setJSON([
            'status' => ($tests['mpdf_test'] === 'SUCCESS' ? 'success' : 'error'),
            'diagnostics' => $tests,
        ]);
    }

    public function importBatch()
    {
        $sess = session()->get();
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'File tidak valid atau belum diunggah.'
            ]);
        }

        try {
            $uploader = new \App\Libraries\ExcelUploader();
            $uploader->validateFile($file);
            $filePath = $file->getTempName();
            $rows = $uploader->parseExcel($filePath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status'  => 'error',
                    'message' => 'File Excel kosong atau format tidak sesuai.'
                ]);
            }

            $count = 0;
            $username = $sess['username'] ?? 'admin';
            $now = date('Y-m-d H:i:s');
            $apps = new \App\Models\Apps\AppsModel();

            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0]) && empty($row[1])) {
                    continue;
                }

                $docType = strtolower(trim((string) $row[0]));
                if (!in_array($docType, ['sp', 'st', 'nominatif', 'kwitansi', 'hadir', 'kwitansi_jamuan', 'surat_jalan', 'hadir_jamuan'], true)) {
                    $docType = 'st';
                }

                $docNumber = trim((string) ($row[1] ?? 'DOC/' . date('Ymd') . '/' . rand(100, 999)));
                $docDate = !empty($row[2]) ? \App\Libraries\ExcelUploader::excelDate($row[2]) : date('Y-m-d');
                $instansiRef = trim((string) ($row[3] ?? ''));
                $instansiID = $instansiRef ? $apps->getInstansiID($instansiRef) : null;
                $tilok = trim((string) ($row[4] ?? 'Kantor Regional III BKN Bandung'));
                $keterangan = trim((string) ($row[8] ?? ($row[5] ?? 'Dokumen Pelaksanaan PNBP CAT')));

                $uid = bin2hex(random_bytes(16));
                $dataPayload = [
                    'uid'          => $uid,
                    'doc_type'     => $docType,
                    'doc_number'   => $docNumber,
                    'doc_date'     => $docDate,
                    'instansi_id'  => $instansiID,
                    'tilok_nama'   => $tilok,
                    'status'       => 'draft',
                    'keterangan'   => $keterangan,
                    'created_by'   => $username,
                    'created_at'   => $now,
                ];

                $insertId = $this->pnbpModel->insert($dataPayload);
                if ($insertId) {
                    $this->signatureModel->initDefaultSignatures((int) $insertId, $docType);
                    $count++;
                }
            }

            if ($count > 0) {
                $apps->storeData([
                    'layanan_id' => 42,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $username,
                ], 'activity_daily_logs');
            }

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Import batch dokumen PNBP CAT berhasil. ' . $count . ' dokumen terdaftar.',
                'total'   => $count
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal memproses file Excel dokumen PNBP CAT.',
                $e instanceof \RuntimeException ? 422 : 500,
                'PNBPDocumentController::importBatch'
            );
        }
    }

    // =========================================================================
    // API JSON PENGELOLA CAT: MANAJEMEN DOKUMEN (9 JENIS DOKUMEN PENDUKUNG)
    // =========================================================================

    private function requireCatPengelolaAccess(): ?ResponseInterface
    {
        $nip = trim((string) session()->get('username'));
        if ($nip === '') {
            $nip = $this->pengelolaModel->resolveUsernameByUserId((int) session()->get('userid'));
        }
        if ($nip === '' || !$this->catModel->isCatPengelolaNip($nip)) {
            return $this->response->setStatusCode(403)->setJSON([
                'status'  => 'error',
                'message' => 'Akses ditolak. NIP Anda (' . ($nip !== '' ? $nip : '-') . ') tidak terdaftar sebagai Pengelola CAT.',
            ]);
        }

        return null;
    }

    private function getJsonOrPostInput(): array
    {
        $post = $this->request->getPost() ?: [];
        $json = $this->request->getJSON(true);
        if (is_array($json) && !empty($json)) {
            return array_merge($json, $post);
        }
        return $post;
    }

    /**
     * GET /api/apps-cat/pengelola/dokumen/types
     */
    public function getDocTypesApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $rawRows = array_values($this->docTypeModel->getAllDocTypes());
        if (empty($rawRows)) {
            foreach (PNBPDocumentModel::$docTypeDetails as $docCode => $meta) {
                $rawRows[] = [
                    'doc_type'     => $docCode,
                    'number'       => $meta['number'] ?? 0,
                    'title'        => $meta['title'] ?? strtoupper($docCode),
                    'short_title'  => $meta['short'] ?? strtoupper($docCode),
                    'category'     => $meta['category'] ?? 'DOKUMEN CAT',
                    'category_key' => $meta['category_key'] ?? 'personel',
                    'description'  => $meta['desc'] ?? '',
                    'is_status'    => 1,
                ];
            }
        }

        $codes = array_values(array_filter(array_map(
            static fn($r) => (string) ($r['code'] ?? $r['doc_type'] ?? ''),
            $rawRows
        )));
        $stats = $this->pnbpModel->getDocTypeStats($codes);
        $summary = $this->pnbpModel->getSummaryMetrics([
            'seleksi_id' => $this->request->getGet('seleksi_id'),
            'tilok_id'   => $this->request->getGet('tilok_id'),
        ]);

        $items = [];
        foreach ($rawRows as $row) {
            $code = (string) ($row['code'] ?? $row['doc_type'] ?? '');
            if ($code === '') {
                continue;
            }
            $baseDetail = PNBPDocumentModel::$docTypeDetails[$code] ?? [];
            $title = (string) ($row['title'] ?? $row['name'] ?? $baseDetail['title'] ?? strtoupper($code));
            $detail = array_merge($baseDetail, [
                'number'       => (int) ($row['number'] ?? $baseDetail['number'] ?? 0),
                'title'        => $title,
                'short'        => (string) ($row['short_title'] ?? $baseDetail['short'] ?? strtoupper($code)),
                'category'     => (string) ($row['category'] ?? $baseDetail['category'] ?? 'DOKUMEN CAT'),
                'category_key' => (string) ($row['category_key'] ?? $baseDetail['category_key'] ?? 'personel'),
                'desc'         => (string) ($row['description'] ?? $baseDetail['desc'] ?? ''),
            ]);

            $items[] = [
                'id'             => (int) ($row['id'] ?? 0),
                'code'           => $code,
                'doc_type'       => $code,
                'name'           => $title,
                'title'          => $title,
                'is_status'      => (int) ($row['is_status'] ?? 1),
                'detail'         => $detail,
                'stats'          => $stats[$code] ?? [
                    'total'     => 0,
                    'draft'     => 0,
                    'generated' => 0,
                    'final'     => 0,
                ],
                'template_ready' => in_array($code, ['sp', 'st', 'nominatif', 'kwitansi', 'hadir', 'kwitansi_jamuan', 'surat_jalan', 'hadir_jamuan'], true),
            ];
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'data'    => array_values($items),
            'summary' => $summary,
        ]);
    }

    /**
     * GET /api/apps-cat/pengelola/dokumen
     */
    public function getDocumentsApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $docType = trim((string) $this->request->getGet('doc_type'));
        $params = [
            'doc_type'    => $docType ?: 'all',
            'status'      => trim((string) $this->request->getGet('status')),
            'source_mode' => trim((string) $this->request->getGet('source_mode')),
            'keyword'     => trim((string) $this->request->getGet('search')),
            'seleksi_id'  => $this->request->getGet('seleksi_id'),
            'tilok_id'    => $this->request->getGet('tilok_id'),
            'jadwal_id'   => $this->request->getGet('jadwal_id'),
            'tahun'       => $this->request->getGet('tahun'),
            'page'        => $this->request->getGet('page') ?? 1,
            'limit'       => $this->request->getGet('limit') ?? 50,
        ];

        $result = $this->pnbpModel->getApiDocumentList($params);
        $summary = $this->pnbpModel->getSummaryMetrics($params);
        $docTypeMeta = $docType !== '' && $docType !== 'all'
            ? [
                'type'   => $this->docTypeModel->getDocTypeByCode($docType),
                'detail' => PNBPDocumentModel::$docTypeDetails[$docType] ?? null,
            ]
            : null;

        return $this->response->setJSON([
            'status'        => 'success',
            'data'          => $result['rows'],
            'total'         => $result['total'],
            'page'          => $result['page'],
            'limit'         => $result['limit'],
            'summary'       => $summary,
            'doc_type_meta' => $docTypeMeta,
        ]);
    }

    /**
     * GET /api/apps-cat/pengelola/dokumen/detail/(:segment)
     */
    public function getDocumentDetailApi(string $uid)
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $doc = $this->pnbpModel->getFullDocumentDetail($uid);
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }

        $code = (string) ($doc['doc_type'] ?? '');
        $docTypeRow = $this->docTypeModel->getDocTypeByCode($code);

        return $this->response->setJSON([
            'status'        => 'success',
            'data'          => $doc,
            'doc_type_meta' => [
                'type'           => $docTypeRow,
                'detail'         => PNBPDocumentModel::$docTypeDetails[$code] ?? null,
                'template_ready' => in_array($code, ['sp', 'st', 'nominatif', 'kwitansi', 'hadir', 'kwitansi_jamuan', 'surat_jalan', 'hadir_jamuan'], true),
            ],
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen
     */
    public function storeDocumentApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input      = $this->getJsonOrPostInput();
        $key        = trim((string) ($input['key'] ?? $input['uid'] ?? ''));
        $docType    = trim((string) ($input['doc_type'] ?? ''));
        $docNumber  = trim((string) ($input['doc_number'] ?? ''));
        $docDate    = trim((string) ($input['doc_date'] ?? ''));
        $seleksiId  = (int) ($input['seleksi_id'] ?? 0);
        $instansiId = trim((string) ($input['instansi_id'] ?? ''));
        $tilokId    = (int) ($input['tilok_id'] ?? 0);
        $jadwalId   = $this->pengelolaModel->resolveJadwalId($input['jadwal_id'] ?? $input['jadwal_uid'] ?? '');
        $title      = trim((string) ($input['title'] ?? ''));
        $notes      = trim((string) ($input['notes'] ?? ''));
        $mak        = trim((string) ($input['mak'] ?? ''));
        $vendorName = trim((string) ($input['vendor_name'] ?? ''));
        $vendorNpwp = trim((string) ($input['vendor_npwp'] ?? ''));
        $status     = trim((string) ($input['status'] ?? ''));
        $sourceMode = trim((string) ($input['source_mode'] ?? ''));

        if ($docType === '' || $title === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Tipe dokumen dan judul/perihal wajib diisi.',
            ]);
        }

        // Auto-turunkan seleksi_id & tilok_id dari Jadwal jika dipilih
        if ($jadwalId > 0) {
            $jadwalRow = $this->pengelolaModel->find($jadwalId);
            if ($jadwalRow) {
                if ($seleksiId <= 0 && !empty($jadwalRow['seleksi_id'])) {
                    $seleksiId = (int) $jadwalRow['seleksi_id'];
                }
                if ($tilokId <= 0 && !empty($jadwalRow['tilok_id'])) {
                    $tilokId = (int) $jadwalRow['tilok_id'];
                }
            }
        }

        $metaData = [];
        $existing = null;
        if ($key !== '') {
            $existing = $this->pnbpModel->where('uid', $key)->first();
            if (!$existing) {
                return $this->response->setStatusCode(404)->setJSON([
                    'status'  => 'error',
                    'message' => 'Dokumen yang akan diperbarui tidak ditemukan.',
                ]);
            }
            $metaData = !empty($existing['meta_data']) ? (json_decode((string) $existing['meta_data'], true) ?: []) : [];
        }

        if (isset($input['meta_data']) && is_array($input['meta_data'])) {
            $metaData = array_merge($metaData, $input['meta_data']);
        }

        if (array_key_exists('notes', $input)) {
            $metaData['notes'] = $notes;
        }
        if (array_key_exists('mak', $input)) {
            $metaData['mak'] = $mak;
        }
        if (array_key_exists('vendor_name', $input)) {
            $metaData['vendor_name'] = $vendorName;
        }
        if (array_key_exists('vendor_npwp', $input)) {
            $metaData['vendor_npwp'] = $vendorNpwp;
        }
        if (isset($input['header_keterangan'])) {
            $metaData['header_keterangan'] = trim((string) $input['header_keterangan']);
        }
        if (isset($input['tanggal_kegiatan'])) {
            $metaData['tanggal_kegiatan'] = trim((string) $input['tanggal_kegiatan']);
        }

        // Dukungan multi-instansi manual dari form/builder
        if (array_key_exists('instansi_ids', $input)) {
            $rawIds = $input['instansi_ids'];
            $parsedIds = is_array($rawIds) ? array_values(array_filter(array_map(static fn($v) => trim((string) $v), $rawIds))) : [];
            $metaData['instansi_ids'] = $parsedIds;
            if ($instansiId === '' && !empty($parsedIds)) {
                $instansiId = (string) $parsedIds[0];
            }
        }
        if (array_key_exists('instansi_names', $input)) {
            $rawNames = $input['instansi_names'];
            $metaData['instansi_names'] = is_array($rawNames) ? array_values(array_filter(array_map(static fn($v) => trim((string) $v), $rawNames))) : [];
        }

        $dataPayload = [
            'doc_type'    => $docType,
            'doc_number'  => $docNumber !== '' ? $docNumber : null,
            'doc_date'    => $docDate !== '' ? $docDate : date('Y-m-d'),
            'seleksi_id'  => $seleksiId > 0 ? $seleksiId : null,
            'instansi_id' => $instansiId !== '' ? $instansiId : null,
            'tilok_id'    => $tilokId > 0 ? $tilokId : null,
            'jadwal_id'   => $jadwalId > 0 ? $jadwalId : null,
            'title'       => $title,
            'meta_data'   => json_encode($metaData),
        ];

        if ($sourceMode !== '' && in_array($sourceMode, ['builder', 'upload'], true)) {
            $dataPayload['source_mode'] = $sourceMode;
        }

        if ($status !== '' && in_array($status, ['draft', 'generated', 'final'], true)) {
            $dataPayload['status'] = $status;
        }

        $actor = trim((string) session()->get('username')) ?: $this->pengelolaModel->resolveUsernameByUserId((int) session()->get('userid'));

        if ($existing) {
            $this->pnbpModel->update((int) $existing['id'], $dataPayload);
            $docUid = $key;
            $docId  = (int) $existing['id'];
        } else {
            $docUid = bin2hex(random_bytes(16));
            $dataPayload['uid']         = $docUid;
            $dataPayload['status']      = $dataPayload['status'] ?? 'draft';
            $dataPayload['source_mode'] = $dataPayload['source_mode'] ?? 'builder';
            $dataPayload['created_by']  = $actor ?: 'system';

            $insertId = $this->pnbpModel->insert($dataPayload);
            if (!$insertId) {
                return $this->response->setStatusCode(500)->setJSON([
                    'status'  => 'error',
                    'message' => 'Gagal menyimpan dokumen baru.',
                ]);
            }
            $docId = (int) $insertId;
            $this->signatureModel->initDefaultSignatures($docId, $docType);
        }

        // Auto-sync nomor ST ke Jadwal & Tim jika tipe dokumen 'st' dan memiliki jadwal_id
        if ($docType === 'st' && $jadwalId > 0 && $docNumber !== '') {
            $this->pengelolaModel->linkStToJadwal($jadwalId, $docId, $docNumber, $dataPayload['doc_date'], []);
        }

        return $this->response->setJSON([
            'status'   => 'success',
            'message'  => 'Parameter dokumen berhasil disimpan.',
            'uid'      => $docUid,
            'doc_type' => $docType,
            'data'     => $this->pnbpModel->getFullDocumentDetail($docUid),
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/sync-tim
     */
    public function syncTimToDocumentApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input     = $this->getJsonOrPostInput();
        $docUid    = trim((string) ($input['document_uid'] ?? $input['uid'] ?? ''));
        $jadwalVal = $input['jadwal_id'] ?? $input['jadwal_uid'] ?? '';

        $doc = $docUid !== '' ? $this->pnbpModel->where('uid', $docUid)->first() : null;
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }

        $jadwalId = $this->pengelolaModel->resolveJadwalId($jadwalVal ?: ($doc['jadwal_id'] ?? 0));
        if ($jadwalId <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Silakan kaitkan dokumen dengan Jadwal CAT terlebih dahulu untuk menarik daftar tim.',
            ]);
        }

        $res = $this->pnbpModel->syncTimFromJadwal((int) $doc['id'], $jadwalId);
        if (!$res['ok']) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => $res['message'],
            ]);
        }

        return $this->response->setJSON([
            'status'   => 'success',
            'message'  => $res['message'],
            'inserted' => $res['inserted'],
            'skipped'  => $res['skipped'],
            'data'     => $this->pnbpModel->getFullDocumentDetail($docUid),
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/upload
     * Upload dokumen arsip/lama dalam mode upload (PDF).
     */
    public function uploadDocumentApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $key        = trim((string) ($this->request->getPost('key') ?? $this->request->getPost('uid') ?? ''));
        $docType    = trim((string) $this->request->getPost('doc_type'));
        $docNumber  = trim((string) $this->request->getPost('doc_number'));
        $docDate    = trim((string) $this->request->getPost('doc_date'));
        $title      = trim((string) $this->request->getPost('title'));
        $notes      = trim((string) $this->request->getPost('notes'));
        $jadwalId   = $this->pengelolaModel->resolveJadwalId($this->request->getPost('jadwal_id') ?? $this->request->getPost('jadwal_uid') ?? '');
        $seleksiId  = (int) $this->request->getPost('seleksi_id');
        $tilokId    = (int) $this->request->getPost('tilok_id');

        $rawIds   = $this->request->getPost('instansi_ids');
        $rawNames = $this->request->getPost('instansi_names');
        $instansiIds = is_array($rawIds)
            ? array_values(array_filter(array_map('trim', $rawIds)))
            : (is_string($rawIds) && trim($rawIds) !== '' ? array_values(array_filter(array_map('trim', explode(',', $rawIds)))) : []);
        $instansiNames = is_array($rawNames)
            ? array_values(array_filter(array_map('trim', $rawNames)))
            : (is_string($rawNames) && trim($rawNames) !== '' ? array_values(array_filter(array_map('trim', explode('||', $rawNames)))) : []);

        if ($docType === '' || !array_key_exists($docType, PNBPDocumentModel::$docTypeLabels)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Tipe dokumen tidak valid.',
            ]);
        }
        if ($title === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Keterangan / judul dokumen wajib diisi.',
            ]);
        }

        if ($jadwalId > 0) {
            $jadwalRow = $this->pengelolaModel->find($jadwalId);
            if ($jadwalRow) {
                if ($seleksiId <= 0 && !empty($jadwalRow['seleksi_id'])) {
                    $seleksiId = (int) $jadwalRow['seleksi_id'];
                }
                if ($tilokId <= 0 && !empty($jadwalRow['tilok_id'])) {
                    $tilokId = (int) $jadwalRow['tilok_id'];
                }
            }
        }

        $existing = null;
        $metaData = [];
        if ($key !== '') {
            $existing = $this->pnbpModel->where('uid', $key)->first();
            if (!$existing) {
                return $this->response->setStatusCode(404)->setJSON([
                    'status'  => 'error',
                    'message' => 'Dokumen yang akan diperbarui tidak ditemukan.',
                ]);
            }
            $metaData = !empty($existing['meta_data']) ? (json_decode((string) $existing['meta_data'], true) ?: []) : [];
        }

        $file = $this->request->getFile('file');
        $storedRelPath = $existing['pdf_file_path'] ?? null;
        $originalName  = $existing['original_filename'] ?? null;

        if ($file && $file->getError() !== UPLOAD_ERR_NO_FILE) {
            if (!$file->isValid()) {
                return $this->response->setStatusCode(422)->setJSON([
                    'status'  => 'error',
                    'message' => 'File tidak valid: ' . $file->getErrorString(),
                ]);
            }

            $storage      = new \App\Services\Storage\FileStorageService();
            $originalName = $file->getClientName();
            $newFileName  = $docType . '_' . bin2hex(random_bytes(8)) . '.pdf';

            try {
                $stored = $storage->storeUploadedFile($file, 'pnbp', [
                    'subDir'     => date('Y') . '/' . $docType,
                    'customName' => $newFileName,
                ]);
            } catch (\Throwable $e) {
                return $this->apiException(
                    $e,
                    $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal menyimpan berkas PDF PNBP.',
                    $e instanceof \RuntimeException ? 422 : 500,
                    'PNBPDocumentController::uploadSupportingDoc'
                );
            }

            // Hapus file lama bila mengganti dokumen arsip
            if (!empty($existing['pdf_file_path'])) {
                $storage->delete((string) $existing['pdf_file_path'], 'pnbp');
            }
            $storedRelPath = $stored['relative_path'];
        } elseif (!$existing) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Silakan pilih/seret file PDF dokumen lama terlebih dahulu.',
            ]);
        }

        $metaData['notes']          = $notes;
        $metaData['instansi_ids']   = $instansiIds;
        $metaData['instansi_names'] = $instansiNames;

        $actor = trim((string) session()->get('username')) ?: $this->pengelolaModel->resolveUsernameByUserId((int) session()->get('userid'));
        $payload = [
            'doc_type'          => $docType,
            'doc_number'        => $docNumber !== '' ? $docNumber : null,
            'doc_date'          => $docDate !== '' ? $docDate : date('Y-m-d'),
            'seleksi_id'        => $seleksiId > 0 ? $seleksiId : null,
            'tilok_id'          => $tilokId > 0 ? $tilokId : null,
            'instansi_id'       => !empty($instansiIds) ? $instansiIds[0] : ($existing['instansi_id'] ?? null),
            'jadwal_id'         => $jadwalId > 0 ? $jadwalId : null,
            'title'             => $title,
            'status'            => 'final',
            'source_mode'       => 'upload',
            'pdf_file_path'     => $storedRelPath,
            'original_filename' => $originalName,
            'generated_at'      => date('Y-m-d H:i:s'),
            'meta_data'         => json_encode($metaData),
        ];

        if ($existing) {
            $this->pnbpModel->update((int) $existing['id'], $payload);
            $docUid = $key;
        } else {
            $docUid = bin2hex(random_bytes(16));
            $payload['uid']        = $docUid;
            $payload['created_by'] = $actor ?: 'system';
            $this->pnbpModel->insert($payload);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Dokumen arsip PDF berhasil diunggah dan disimpan.',
            'uid'     => $docUid,
            'data'    => $this->pnbpModel->getFullDocumentDetail($docUid),
        ]);
    }

    /**
     * GET /api/apps-cat/pengelola/dokumen/file/(:segment)
     * Stream atau unduh PDF hasil upload maupun builder.
     */
    public function streamUploadedFileApi(string $uid)
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $doc = $this->pnbpModel->where('uid', $uid)->first();
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }

        $download = (string) $this->request->getGet('download') === '1';
        $relPath  = trim((string) ($doc['pdf_file_path'] ?? ''));

        if ($relPath !== '') {
            $realTarget = (new \App\Services\Storage\FileStorageService())->resolveAbsolutePath($relPath, 'pnbp');

            if ($realTarget !== null && is_file($realTarget)) {
                $downloadName = $doc['original_filename'] ?: ($doc['doc_type'] . '_' . $doc['uid'] . '.pdf');
                $disposition  = $download ? 'attachment' : 'inline';
                return $this->response
                    ->setHeader('Content-Type', 'application/pdf')
                    ->setHeader('Content-Disposition', $disposition . '; filename="' . addslashes($downloadName) . '"')
                    ->setHeader('Content-Length', (string) filesize($realTarget))
                    ->setBody((string) file_get_contents($realTarget));
            }
        }

        // Fallback untuk dokumen mode builder bila belum ada file cache
        try {
            $result = $this->pdfService->getOrGeneratePdf($uid, false);
            $disposition = $download ? 'attachment' : 'inline';
            return $this->response
                ->setHeader('Content-Type', 'application/pdf')
                ->setHeader('Content-Disposition', $disposition . '; filename="' . $result['filename'] . '"')
                ->setHeader('Content-Length', (string) strlen($result['binary']))
                ->setBody($result['binary']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Berkas PDF belum tersedia untuk dokumen ini.',
            ]);
        }
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/delete
     */
    public function deleteDocumentApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input = $this->getJsonOrPostInput();
        $uid   = trim((string) ($input['uid'] ?? $input['key'] ?? ''));
        if ($uid === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'UID dokumen wajib disertakan.',
            ]);
        }

        $doc = $this->pnbpModel->where('uid', $uid)->first();
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }

        if (!empty($doc['pdf_file_path'])) {
            (new \App\Services\Storage\FileStorageService())->delete((string) $doc['pdf_file_path'], 'pnbp');
        }

        $deleted = $this->pnbpModel->deleteDocumentWithChildren($uid);
        if (!$deleted) {
            return $this->response->setStatusCode(500)->setJSON([
                'status'  => 'error',
                'message' => 'Gagal menghapus dokumen.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Dokumen beserta seluruh rinciannya berhasil dihapus.',
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/personel
     * Simpan / perbarui personel dokumen (termasuk pegawai eksternal / luar instansi).
     */
    public function savePersonelApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input      = $this->getJsonOrPostInput();
        $docUid     = trim((string) ($input['document_uid'] ?? $input['uid'] ?? ''));
        $personelId = (int) ($input['id'] ?? $input['personel_id'] ?? 0);
        $isExternal = !empty($input['is_external']) ? 1 : 0;
        $nip        = trim((string) ($input['nip'] ?? ''));
        $nama       = trim((string) ($input['nama'] ?? ''));
        $instansiAsal = trim((string) ($input['instansi_asal'] ?? ''));
        $pangkatGol = trim((string) ($input['pangkat_gol'] ?? ''));
        $nik        = trim((string) ($input['nik'] ?? ''));
        $jabatan    = trim((string) ($input['jabatan'] ?? ''));
        $peran      = trim((string) ($input['peran'] ?? ''));
        $statusPegawai = trim((string) ($input['status_pegawai'] ?? ''));
        $bankNama   = trim((string) ($input['bank_nama'] ?? ''));
        $noRekening = trim((string) ($input['no_rekening'] ?? ''));

        $jumlahHari  = max(1, (int) ($input['jumlah_hari'] ?? 1));
        $uangHarian  = (float) ($input['uang_harian'] ?? 0);
        $transport   = (float) ($input['transport'] ?? 0);
        $jumlah      = (float) ($input['jumlah'] ?? 0);
        $pajakPersen = (float) ($input['pajak_persen'] ?? 0);

        $doc = $docUid !== '' ? $this->pnbpModel->where('uid', $docUid)->first() : null;
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }
        if ($nama === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Nama personel wajib diisi.',
            ]);
        }

        // Auto-lookup ke data_pegawai hanya bila bukan input manual eksternal & NIP terisi
        if (!$isExternal && $nip !== '' && $pangkatGol === '') {
            $peg = $this->db->table('data_pegawai p')
                ->select('p.nama, p.jabatan, g.nama AS golongan')
                ->join('data_pegawai_golongan g', 'g.id = p.gol_id', 'left')
                ->where('p.nip', $nip)
                ->get()
                ->getRowArray();
            if ($peg) {
                if ($pangkatGol === '' && !empty($peg['golongan'])) {
                    $pangkatGol = (string) $peg['golongan'];
                }
                if ($jabatan === '' && !empty($peg['jabatan'])) {
                    $jabatan = (string) $peg['jabatan'];
                }
            }
        }

        $pajakNominal   = round($jumlah * ($pajakPersen / 100), 2);
        $jumlahDiterima = $jumlah - $pajakNominal;
        $totalBiaya     = ($doc['doc_type'] === 'nominatif') ? $jumlah : (($uangHarian * $jumlahHari) + $transport);

        $payload = [
            'document_id'     => (int) $doc['id'],
            'nip'             => $nip !== '' ? $nip : null,
            'is_external'     => $isExternal,
            'nama'            => $nama,
            'instansi_asal'   => $instansiAsal !== '' ? $instansiAsal : null,
            'pangkat_gol'     => $pangkatGol !== '' ? $pangkatGol : null,
            'nik'             => $nik !== '' ? $nik : null,
            'jabatan'         => $jabatan !== '' ? $jabatan : null,
            'peran'           => $peran !== '' ? $peran : null,
            'status_pegawai'  => $statusPegawai !== '' ? $statusPegawai : ($isExternal ? 'Luar Instansi' : 'BKN'),
            'jumlah'          => $jumlah,
            'pajak_persen'    => $pajakPersen,
            'pajak_nominal'   => $pajakNominal,
            'jumlah_diterima' => $jumlahDiterima,
            'jumlah_hari'     => $jumlahHari,
            'uang_harian'     => $uangHarian,
            'transport'       => $transport,
            'total_biaya'     => $totalBiaya,
            'bank_nama'       => $bankNama !== '' ? $bankNama : null,
            'no_rekening'     => $noRekening !== '' ? $noRekening : null,
        ];

        if ($personelId > 0) {
            $existingP = $this->personelModel->where('id', $personelId)->where('document_id', (int) $doc['id'])->first();
            if (!$existingP) {
                return $this->response->setStatusCode(404)->setJSON([
                    'status'  => 'error',
                    'message' => 'Baris personel tidak ditemukan pada dokumen ini.',
                ]);
            }
            $this->personelModel->update($personelId, $payload);
        } else {
            $maxOrderRow = $this->db->table('txn_pnbp_doc_personel')
                ->selectMax('sort_order')
                ->where('document_id', (int) $doc['id'])
                ->get()
                ->getRowArray();
            $payload['sort_order'] = ((int) ($maxOrderRow['sort_order'] ?? 0)) + 1;
            $this->personelModel->insert($payload);
        }

        $this->pnbpModel->update((int) $doc['id'], ['updated_at' => date('Y-m-d H:i:s')]);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Data personel berhasil disimpan.',
            'data'    => $this->pnbpModel->getFullDocumentDetail($docUid),
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/personel/reorder
     * Perbarui urutan tampil personel hasil drag-and-drop.
     */
    public function reorderPersonelApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input      = $this->getJsonOrPostInput();
        $docUid     = trim((string) ($input['document_uid'] ?? $input['uid'] ?? ''));
        $orderedIds = $input['ordered_ids'] ?? [];

        $doc = $docUid !== '' ? $this->pnbpModel->where('uid', $docUid)->first() : null;
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }
        if (!is_array($orderedIds) || empty($orderedIds)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Daftar urutan personel tidak valid.',
            ]);
        }

        $docId = (int) $doc['id'];
        $now   = date('Y-m-d H:i:s');
        $this->db->transStart();
        foreach (array_values($orderedIds) as $index => $pid) {
            $idInt = (int) $pid;
            if ($idInt > 0) {
                $this->db->table('txn_pnbp_doc_personel')
                    ->where('id', $idInt)
                    ->where('document_id', $docId)
                    ->update(['sort_order' => $index + 1, 'updated_at' => $now]);
            }
        }
        $this->pnbpModel->update($docId, ['updated_at' => $now]);
        $this->db->transComplete();

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Urutan tampilan tim/personel berhasil diperbarui.',
            'data'    => $this->pnbpModel->getFullDocumentDetail($docUid),
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/personel/delete
     */
    public function deletePersonelApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input  = $this->getJsonOrPostInput();
        $id     = (int) ($input['id'] ?? 0);
        $docUid = trim((string) ($input['document_uid'] ?? $input['uid'] ?? ''));
        if ($id <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'ID personel tidak valid.',
            ]);
        }

        $row = $this->personelModel->find($id);
        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Personel tidak ditemukan.',
            ]);
        }

        $docId = (int) $row['document_id'];
        $this->personelModel->delete($id);
        $this->pnbpModel->update($docId, ['updated_at' => date('Y-m-d H:i:s')]);

        if ($docUid === '') {
            $docRow = $this->pnbpModel->find($docId);
            $docUid = (string) ($docRow['uid'] ?? '');
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Personel berhasil dihapus dari dokumen.',
            'data'    => $docUid !== '' ? $this->pnbpModel->getFullDocumentDetail($docUid) : null,
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/items
     */
    public function saveItemApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input       = $this->getJsonOrPostInput();
        $docUid      = trim((string) ($input['document_uid'] ?? $input['uid'] ?? ''));
        $itemId      = (int) ($input['id'] ?? $input['item_id'] ?? 0);
        $itemName    = trim((string) ($input['item_name'] ?? ''));
        $spesifikasi = trim((string) ($input['spesifikasi'] ?? ''));
        $quantity    = max(1, (int) ($input['quantity'] ?? 1));
        $satuan      = trim((string) ($input['satuan'] ?? '')) ?: 'Box';
        $hargaSatuan = (float) ($input['harga_satuan'] ?? 0);

        $doc = $docUid !== '' ? $this->pnbpModel->where('uid', $docUid)->first() : null;
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }
        if ($itemName === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Nama menu / item jamuan wajib diisi.',
            ]);
        }

        $payload = [
            'document_id'  => (int) $doc['id'],
            'item_name'    => $itemName,
            'spesifikasi'  => $spesifikasi !== '' ? $spesifikasi : null,
            'quantity'     => $quantity,
            'satuan'       => $satuan,
            'harga_satuan' => $hargaSatuan,
            'total_harga'  => $quantity * $hargaSatuan,
        ];

        if ($itemId > 0) {
            $this->itemModel->update($itemId, $payload);
        } else {
            $maxOrderRow = $this->db->table('txn_pnbp_doc_items')
                ->selectMax('sort_order')
                ->where('document_id', (int) $doc['id'])
                ->get()
                ->getRowArray();
            $payload['sort_order'] = ((int) ($maxOrderRow['sort_order'] ?? 0)) + 1;
            $this->itemModel->insert($payload);
        }

        $this->pnbpModel->update((int) $doc['id'], ['updated_at' => date('Y-m-d H:i:s')]);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Item jamuan berhasil disimpan.',
            'data'    => $this->pnbpModel->getFullDocumentDetail($docUid),
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/items/delete
     */
    public function deleteItemApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input  = $this->getJsonOrPostInput();
        $id     = (int) ($input['id'] ?? 0);
        $docUid = trim((string) ($input['document_uid'] ?? $input['uid'] ?? ''));
        if ($id <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'ID item tidak valid.',
            ]);
        }

        $row = $this->itemModel->find($id);
        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Item tidak ditemukan.',
            ]);
        }

        $docId = (int) $row['document_id'];
        $this->itemModel->delete($id);
        $this->pnbpModel->update($docId, ['updated_at' => date('Y-m-d H:i:s')]);

        if ($docUid === '') {
            $docRow = $this->pnbpModel->find($docId);
            $docUid = (string) ($docRow['uid'] ?? '');
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Item jamuan berhasil dihapus.',
            'data'    => $docUid !== '' ? $this->pnbpModel->getFullDocumentDetail($docUid) : null,
        ]);
    }

    /**
     * POST /api/apps-cat/pengelola/dokumen/signatures
     * Simpan konfigurasi 3 Kolom Penandatanganan Fleksibel (kiri, tengah, kanan).
     */
    public function saveSignaturesApi()
    {
        if ($denied = $this->requireCatPengelolaAccess()) {
            return $denied;
        }

        $input   = $this->getJsonOrPostInput();
        $docUid  = trim((string) ($input['document_uid'] ?? $input['uid'] ?? ''));
        $slots   = $input['signatures'] ?? $input['signers'] ?? [];

        $doc = $docUid !== '' ? $this->pnbpModel->where('uid', $docUid)->first() : null;
        if (!$doc) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Dokumen tidak ditemukan.',
            ]);
        }

        $docId = (int) $doc['id'];
        $meta  = !empty($doc['meta_data']) ? (json_decode((string) $doc['meta_data'], true) ?: []) : [];
        $meta['signatures_config'] = $slots;

        $this->db->transStart();
        $this->db->table('txn_pnbp_doc_signatures')->where('document_id', $docId)->delete();

        $posOrder  = ['left' => 1, 'center' => 2, 'right' => 3];
        $hasSigned = false;
        if (is_array($slots)) {
            foreach ($slots as $slot) {
                if (!is_array($slot)) {
                    continue;
                }
                $pos = trim((string) ($slot['sign_position'] ?? 'left'));
                if (!isset($posOrder[$pos])) {
                    continue;
                }
                $nama = trim((string) ($slot['nama'] ?? ''));
                $jabatan = trim((string) ($slot['jabatan'] ?? ''));
                $signTitle = trim((string) ($slot['sign_title'] ?? ''));
                $enabled = array_key_exists('enabled', $slot) ? (bool) $slot['enabled'] : ($nama !== '' || $jabatan !== '');
                if (!$enabled) {
                    continue;
                }

                $token = trim((string) ($slot['sign_token'] ?? ''));
                if ($token === '') {
                    $token = bin2hex(random_bytes(16));
                }

                $signStatus = trim((string) ($slot['sign_status'] ?? 'pending')) ?: 'pending';
                if ($signStatus === 'signed') {
                    $hasSigned = true;
                }

                $this->db->table('txn_pnbp_doc_signatures')->insert([
                    'document_id'          => $docId,
                    'sign_position'        => $pos,
                    'sign_role'            => trim((string) ($slot['sign_role'] ?? $pos)),
                    'sign_title'           => $signTitle !== '' ? $signTitle : null,
                    'nip'                  => trim((string) ($slot['nip'] ?? '')) ?: null,
                    'nama'                 => $nama !== '' ? $nama : '-',
                    'pangkat_gol'          => null,
                    'jabatan'              => $jabatan !== '' ? $jabatan : null,
                    'sign_token'           => $token,
                    'sign_status'          => $signStatus,
                    'signature_image_path' => trim((string) ($slot['signature_image_path'] ?? '')) ?: null,
                    'signed_at'            => !empty($slot['signed_at']) ? $slot['signed_at'] : null,
                    'sort_order'           => $posOrder[$pos],
                    'created_at'           => date('Y-m-d H:i:s'),
                    'updated_at'           => date('Y-m-d H:i:s'),
                ]);
            }
        }

        $nextStatus = ($doc['source_mode'] ?? 'builder') === 'upload'
            ? 'final'
            : ($hasSigned ? 'final' : 'draft');

        $this->pnbpModel->update($docId, [
            'status'     => $nextStatus,
            'meta_data'  => json_encode($meta),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        $this->db->transComplete();

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Pengesahan & penandatanganan dokumen berhasil disimpan.',
            'data'    => $this->pnbpModel->getFullDocumentDetail($docUid),
        ]);
    }
}
