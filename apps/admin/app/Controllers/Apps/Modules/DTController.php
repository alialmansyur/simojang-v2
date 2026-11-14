<?php

namespace App\Controllers\Apps\Modules;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\Apps\Modules\FetchModel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

class DTController extends BaseController
{
    public function __construct()
    {
        $this->fetchdata = new FetchModel();
        $this->uploader = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
        $sess = session()->get();
    }

    public function getData()
    {
        $layanan = (int) ($this->request->getPost('layanan') ?: $this->request->getPost('layanan_id'));
        $bulan = $this->request->getPost('bulan');
        $docCategory = trim((string) $this->request->getPost('doc_category'));

        if ($layanan <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Layanan tidak valid'
            ]);
        }

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $builder = $this->fetchdata->getDataUploader($layanan, $bulan, $docCategory);
        $columns = ['id','uid','layanan_id','period','period_date','period_start_date','period_end_date','remarks','doc_type','doc_category','file_name','file_size','mime_type','path_local','total_instansi','total_usul','created_by','created_at','updated_at'];

        $result = $this->dataTables->render($builder, $columns);
        if (!empty($result['data']) && is_array($result['data'])) {
            $storage = new \App\Services\Storage\FileStorageService();
            foreach ($result['data'] as &$row) {
                $docTypeRow = strtoupper(trim((string) ($row['doc_type'] ?? '')));
                $pathLocalRow = (string) ($row['path_local'] ?? '');
                if ($docTypeRow === 'MANUAL_ENTRY' || stripos($pathLocalRow, 'Manual Entry') !== false) {
                    $row['file_url'] = null;
                    continue;
                }
                $targetPath = !empty($pathLocalRow) && str_starts_with($pathLocalRow, 'public/')
                    ? $pathLocalRow
                    : (string) ($row['file_name'] ?? '');
                $row['file_url'] = $targetPath !== '' ? $storage->toPublicUrl($targetPath, 'excel') : null;
            }
            unset($row);
        }
        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $layanan = (int) ($this->request->getPost('layanan') ?: $this->request->getPost('layanan_id'));
        $bulan = $this->request->getPost('bulan');
        $docCategory = trim((string) $this->request->getPost('doc_category'));

        if ($layanan <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Layanan tidak valid'
            ]);
        }

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status' => 'success',
            'summary' => $this->fetchdata->getUploaderSummary($layanan, $bulan, $docCategory)
        ]);
    }

    public function getDataDetail()
    {
        $key = (int) $this->request->getPost('key');
        if ($key <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Kunci data detail tidak valid'
            ]);
        }

        $builder = $this->fetchdata->getDataUploaderDetail($key);
        $columns = ['id','upload_id','instansi_id','nama','logo','target_tahun','target_bulan','formasi','usul_masuk','ms','bts','tms','sisa','sudah_cetak','belum_cetak','belum_terisi','pembatalan_pertek','sk_cpppk_proses','sk_cpppk_done','usul_input','ni_proses','ni_done','sk_cetak_proses','sk_cetak_done','jadwal_wait','sk_pppk_done','sla_bawah','sla_atas','keterangan','created_by','created_at'];
        $result = $this->dataTables->render($builder, $columns);
        if (!empty($result['data']) && is_array($result['data'])) {
            $storage = new \App\Services\Storage\FileStorageService();
            foreach ($result['data'] as &$row) {
                $targetPath = !empty($row['path_local']) && str_starts_with((string) $row['path_local'], 'public/')
                    ? (string) $row['path_local']
                    : (string) ($row['file_name'] ?? '');
                $row['file_url'] = $targetPath !== '' ? $storage->toPublicUrl($targetPath, 'excel') : null;
            }
            unset($row);
        }
        return $this->response->setJSON($result);
    }

    public function saveManualEntry()
    {
        $db = \Config\Database::connect();
        $sess = session()->get();
        $username = (string) ($sess['username'] ?? $this->request->getPost('created_by') ?? 'admin');

        $layananId = (int) $this->request->getPost('layanan_id');
        $instansiId = trim((string) $this->request->getPost('instansi_id'));
        $period = trim((string) ($this->request->getPost('period') ?? date('Y-m')));
        $periodStartDate = trim((string) ($this->request->getPost('period_start_date') ?? ''));
        $periodEndDate = trim((string) ($this->request->getPost('period_end_date') ?? ''));
        $docCategory = trim((string) ($this->request->getPost('doc_category') ?? ''));
        $remarks = trim((string) ($this->request->getPost('remarks') ?? ''));
        $customFileName = trim((string) ($this->request->getPost('file_name') ?? ''));

        if ($layananId <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'ID Layanan tidak valid.'
            ]);
        }

        if ($instansiId === '') {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'Instansi wajib dipilih.'
            ]);
        }

        $instansiRow = $db->table('data_instansi')
            ->select('kodeins, nama')
            ->where('kodeins', $instansiId)
            ->get()
            ->getRowArray();

        $instansiNama = $instansiRow['nama'] ?? ('Instansi #' . $instansiId);

        $usulMasuk = max(0, (int) $this->request->getPost('usul_masuk'));
        $ms = max(0, (int) $this->request->getPost('ms'));
        $bts = max(0, (int) $this->request->getPost('bts'));
        $tms = max(0, (int) $this->request->getPost('tms'));
        $sisaPost = $this->request->getPost('sisa');
        $sisa = ($sisaPost !== null && $sisaPost !== '')
            ? max(0, (int) $sisaPost)
            : max(0, $usulMasuk - ($ms + $bts + $tms));

        $sudahCetak = $this->request->getPost('sudah_cetak') !== null && $this->request->getPost('sudah_cetak') !== ''
            ? max(0, (int) $this->request->getPost('sudah_cetak'))
            : $ms;
        $belumCetak = $this->request->getPost('belum_cetak') !== null && $this->request->getPost('belum_cetak') !== ''
            ? max(0, (int) $this->request->getPost('belum_cetak'))
            : $sisa;
        $targetTahun = $this->request->getPost('target_tahun') !== null && $this->request->getPost('target_tahun') !== ''
            ? (int) $this->request->getPost('target_tahun')
            : null;
        $targetBulan = $this->request->getPost('target_bulan') !== null && $this->request->getPost('target_bulan') !== ''
            ? (int) $this->request->getPost('target_bulan')
            : null;
        $slaBawah = $this->request->getPost('sla_bawah') !== null && $this->request->getPost('sla_bawah') !== ''
            ? (int) preg_replace('/[^0-9]/', '', (string) $this->request->getPost('sla_bawah'))
            : null;
        $slaAtas = $this->request->getPost('sla_atas') !== null && $this->request->getPost('sla_atas') !== ''
            ? (int) preg_replace('/[^0-9]/', '', (string) $this->request->getPost('sla_atas'))
            : null;
        $formasi = trim((string) ($this->request->getPost('formasi') ?? ''));
        $keterangan = trim((string) ($this->request->getPost('keterangan') ?? $remarks));

        $now = date('Y-m-d H:i:s');
        $defaultDate = ($period !== '' && preg_match('/^\d{4}-\d{2}$/', $period)) ? ($period . '-01') : date('Y-m-d');
        $resolvedStartDate = $periodStartDate !== '' ? $periodStartDate : $defaultDate;
        $resolvedEndDate = $periodEndDate !== '' ? $periodEndDate : $resolvedStartDate;
        $fileName = $customFileName !== '' ? $customFileName : ("Input Manual - {$instansiNama} ({$period})");

        $db->transStart();

        $logData = [
            'period' => $period !== '' ? $period : date('Y-m'),
            'period_date' => $resolvedStartDate,
            'period_start_date' => $resolvedStartDate,
            'period_end_date' => $resolvedEndDate,
            'layanan_id' => $layananId,
            'doc_type' => 'MANUAL_ENTRY',
            'doc_category' => $docCategory !== '' ? $docCategory : null,
            'file_name' => $fileName,
            'file_size' => 1024,
            'mime_type' => 'application/json',
            'path_local' => 'Manual Entry (Sistem)',
            'checksum' => md5($fileName . $now . $username),
            'ip_address' => $this->request->getIPAddress(),
            'user_agent' => $this->request->getUserAgent() ? $this->request->getUserAgent()->getAgentString() : null,
            'remarks' => $remarks !== '' ? $remarks : "Entri manual data {$instansiNama}",
            'created_by' => $username,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $db->table('txn_activity_upload_logs')->insert($logData);
        $uploadId = (int) $db->insertID();

        $detailData = [
            'upload_id' => $uploadId,
            'instansi_id' => $instansiId,
            'formasi' => $formasi !== '' ? $formasi : null,
            'target_tahun' => $targetTahun,
            'target_bulan' => $targetBulan,
            'usul_masuk' => $usulMasuk,
            'ms' => $ms,
            'bts' => $bts,
            'tms' => $tms,
            'sisa' => $sisa,
            'sudah_cetak' => $sudahCetak,
            'belum_cetak' => $belumCetak,
            'sla_bawah' => $slaBawah,
            'sla_atas' => $slaAtas,
            'keterangan' => $keterangan !== '' ? $keterangan : null,
            'created_by' => $username,
            'created_at' => $now,
        ];

        $db->table('txn_activity_upload_detail')->insert($detailData);

        $db->table('activity_daily_logs')->insert([
            'layanan_id' => $layananId,
            'tanggal' => date('Y-m-d'),
            'created_by' => $username,
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->response->setStatusCode(500)->setJSON([
                'status' => 'error',
                'message' => 'Gagal menyimpan data input manual ke database.'
            ]);
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data layanan berhasil disimpan.',
            'id' => $uploadId,
        ]);
    }

    public function updateLog()
    {
        $db = \Config\Database::connect();
        $sess = session()->get();
        $username = (string) ($sess['username'] ?? $this->request->getPost('updated_by') ?? 'admin');

        $id = (int) $this->request->getPost('id');
        if ($id <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 'error',
                'message' => 'ID log tidak valid.'
            ]);
        }

        $existingLog = $db->table('txn_activity_upload_logs')
            ->where('id', $id)
            ->get()
            ->getRowArray();

        if (!$existingLog) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 'error',
                'message' => 'Data log tidak ditemukan.'
            ]);
        }

        $period = trim((string) ($this->request->getPost('period') ?? $existingLog['period'] ?? ''));
        $periodStartDate = trim((string) ($this->request->getPost('period_start_date') ?? $existingLog['period_start_date'] ?? ''));
        $periodEndDate = trim((string) ($this->request->getPost('period_end_date') ?? $existingLog['period_end_date'] ?? ''));
        $docCategory = $this->request->getPost('doc_category');
        $remarks = $this->request->getPost('remarks');
        $fileName = trim((string) ($this->request->getPost('file_name') ?? ''));

        $updateLogData = [
            'period' => $period !== '' ? $period : $existingLog['period'],
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if ($periodStartDate !== '') {
            $updateLogData['period_date'] = $periodStartDate;
            $updateLogData['period_start_date'] = $periodStartDate;
        }
        if ($periodEndDate !== '') {
            $updateLogData['period_end_date'] = $periodEndDate;
        }
        if ($docCategory !== null) {
            $updateLogData['doc_category'] = trim((string) $docCategory) !== '' ? trim((string) $docCategory) : null;
        }
        if ($remarks !== null) {
            $updateLogData['remarks'] = trim((string) $remarks);
        }
        if ($fileName !== '') {
            $updateLogData['file_name'] = $fileName;
        }

        $db->transStart();
        $db->table('txn_activity_upload_logs')->where('id', $id)->update($updateLogData);

        $detailId = (int) ($this->request->getPost('detail_id') ?? 0);
        $instansiId = trim((string) ($this->request->getPost('instansi_id') ?? ''));

        if ($detailId > 0 || $instansiId !== '') {
            $usulMasuk = max(0, (int) $this->request->getPost('usul_masuk'));
            $ms = max(0, (int) $this->request->getPost('ms'));
            $bts = max(0, (int) $this->request->getPost('bts'));
            $tms = max(0, (int) $this->request->getPost('tms'));
            $sisaPost = $this->request->getPost('sisa');
            $sisa = ($sisaPost !== null && $sisaPost !== '')
                ? max(0, (int) $sisaPost)
                : max(0, $usulMasuk - ($ms + $bts + $tms));

            $detailPayload = [
                'usul_masuk' => $usulMasuk,
                'ms' => $ms,
                'bts' => $bts,
                'tms' => $tms,
                'sisa' => $sisa,
            ];

            if ($instansiId !== '') {
                $detailPayload['instansi_id'] = $instansiId;
            }
            if ($this->request->getPost('sudah_cetak') !== null && $this->request->getPost('sudah_cetak') !== '') {
                $detailPayload['sudah_cetak'] = max(0, (int) $this->request->getPost('sudah_cetak'));
            }
            if ($this->request->getPost('belum_cetak') !== null && $this->request->getPost('belum_cetak') !== '') {
                $detailPayload['belum_cetak'] = max(0, (int) $this->request->getPost('belum_cetak'));
            }
            if ($this->request->getPost('target_tahun') !== null) {
                $detailPayload['target_tahun'] = $this->request->getPost('target_tahun') !== '' ? (int) $this->request->getPost('target_tahun') : null;
            }
            if ($this->request->getPost('target_bulan') !== null) {
                $detailPayload['target_bulan'] = $this->request->getPost('target_bulan') !== '' ? (int) $this->request->getPost('target_bulan') : null;
            }
            if ($this->request->getPost('sla_bawah') !== null) {
                $rawSlaBawah = preg_replace('/[^0-9]/', '', (string) $this->request->getPost('sla_bawah'));
                $detailPayload['sla_bawah'] = $rawSlaBawah !== '' ? (int) $rawSlaBawah : null;
            }
            if ($this->request->getPost('sla_atas') !== null) {
                $rawSlaAtas = preg_replace('/[^0-9]/', '', (string) $this->request->getPost('sla_atas'));
                $detailPayload['sla_atas'] = $rawSlaAtas !== '' ? (int) $rawSlaAtas : null;
            }
            if ($this->request->getPost('formasi') !== null) {
                $detailPayload['formasi'] = trim((string) $this->request->getPost('formasi')) ?: null;
            }
            if ($this->request->getPost('keterangan') !== null) {
                $detailPayload['keterangan'] = trim((string) $this->request->getPost('keterangan')) ?: null;
            }

            if ($detailId > 0) {
                $db->table('txn_activity_upload_detail')
                    ->where('id', $detailId)
                    ->where('upload_id', $id)
                    ->update($detailPayload);
            } else {
                $existingDetail = $db->table('txn_activity_upload_detail')
                    ->where('upload_id', $id)
                    ->orderBy('id', 'ASC')
                    ->limit(1)
                    ->get()
                    ->getRowArray();

                if ($existingDetail) {
                    $db->table('txn_activity_upload_detail')
                        ->where('id', $existingDetail['id'])
                        ->update($detailPayload);
                } else {
                    $detailPayload['upload_id'] = $id;
                    $detailPayload['created_by'] = $username;
                    $detailPayload['created_at'] = date('Y-m-d H:i:s');
                    $db->table('txn_activity_upload_detail')->insert($detailPayload);
                }
            }
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->response->setStatusCode(500)->setJSON([
                'status' => 'error',
                'message' => 'Gagal memperbarui data log layanan.'
            ]);
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data log layanan berhasil diperbarui.',
            'id' => $id,
        ]);
    }
}
