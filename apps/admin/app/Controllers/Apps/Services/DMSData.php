<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use App\Models\Apps\Services\DMSModel;
use App\Models\Apps\AppsModel;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

class DMSData extends BaseController
{
    public function __construct()
    {
        $this->dmsmodel = new DMSModel();
        $this->apps = new AppsModel();
        $this->uploader = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
    }

    public function importData()
    {
        $session    = session()->get();
        $file       = $this->request->getFile('file');
        $instansi   = $this->request->getPost('instansi');
        $period     = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $syncdate1  = trim((string) ($this->request->getPost('syncdate1') ?: ($this->request->getPost('startdate') ?: date('Y-m-d'))));
        $syncdate2  = trim((string) ($this->request->getPost('syncdate2') ?: ($this->request->getPost('enddate') ?: $syncdate1)));

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows      = $this->uploader->parseExcel($localPath);
        } catch (\Throwable $e) {
            return $this->apiException($e, $e instanceof \RuntimeException ? $e->getMessage() : 'Berkas Excel tidak valid atau gagal dibaca.', 422, 'DMSData::importData');
        }

        if (!is_array($rows) || count($rows) < 1) {
            return $this->apiError('Data kosong atau format salah.', 422);
        }

        $fileSize   = filesize($localPath);
        $mimeType   = substr((string) $file->getMimeType(), 0, 30);
        $checksum   = substr((string) hash_file('sha256', $localPath), 0, 50);
        $ipAddress  = substr((string) $this->request->getIPAddress(), 0, 50);
        $userAgent  = $this->request->getUserAgent()
                        ? substr((string) $this->request->getUserAgent()->getAgentString(), 0, 50)
                        : 'Web Browser';
        $username   = substr((string) ($session['username'] ?? 'admin'), 0, 18);

        $dataLog = [
            'action'            => 'upload',
            'period'            => substr($period, 0, 30),
            'period_date'       => $syncdate1,
            'period_start_date' => $syncdate1,
            'period_end_date'   => $syncdate2,
            'file_name'         => substr((string) $file->getClientName(), 0, 50),
            'file_size'         => $fileSize,
            'file_type'         => $mimeType,
            'file_hash'         => $checksum,
            'ip_address'        => $ipAddress,
            'user_agent'        => $userAgent,
            'created_by'        => $username,
        ];

        $insertID = $this->apps->storeData($dataLog, 'txn_dms');

        $syncDate        = date('Y-m-d H:i:s');
        $mappingFunction = $this->getMapperForJenis('DMS', $insertID, $syncDate, $instansi);

        $dataBatch = [];
        $instansiTotals = [];
        foreach (array_slice($rows, 2) as $row) {
            if (empty($row[0])) {
                continue;
            }
            $mapped = $mappingFunction($row);
            $dataBatch[] = $mapped;
            $insId = (int) ($mapped['instansi_id'] ?? 0);
            if ($insId > 0) {
                $docCount = (int) ($mapped['total_doc'] ?? 0);
                if ($docCount <= 0) {
                    $docCount = (int) $mapped['d2nip'] + (int) $mapped['ijazah'] + (int) $mapped['drh']
                        + (int) $mapped['cpns'] + (int) $mapped['pns'] + (int) $mapped['kp']
                        + (int) $mapped['jabatan'] + (int) $mapped['perubahan'] + (int) $mapped['berhenti'] + (int) $mapped['pensiun'];
                }
                $instansiTotals[$insId] = ($instansiTotals[$insId] ?? 0) + $docCount;
            }
        }

        if (!empty($dataBatch)) {
            $this->apps->insertBatchData($dataBatch, 'txn_dms_detail');

            $entryBatch = [];
            foreach ($instansiTotals as $insId => $totDocs) {
                $entryBatch[] = [
                    'action'            => 'upload',
                    'scema_group'       => substr('dms_log_' . $insertID, 0, 18),
                    'instansi_id'       => $insId,
                    'period'            => substr($period, 0, 30),
                    'period_date'       => $syncdate1,
                    'period_start_date' => $syncdate1,
                    'period_end_date'   => $syncdate2,
                    'jenis'             => 'Arsip Elektronik (PNS)',
                    'total'             => $totDocs,
                    'created_by'        => $username,
                ];
            }
            if (!empty($entryBatch)) {
                $this->apps->insertBatchData($entryBatch, 'txn_dms_entry');
            }

            $this->apps->storeData(
                [
                    'layanan_id' => 26,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $username,
                ],
                'activity_daily_logs'
            );
        }

        return $this->response->setJSON([
            'status'   => 'success',
            'message'  => 'Upload dan import data berhasil.',
        ]);
    }

    public function storeData()
    {
        $sess       = session()->get();
        $key        = (int) ($this->request->getPost('key') ?? 0);
        $instansi   = $this->request->getPost('instansi');
        $periode    = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $startdate  = trim((string) ($this->request->getPost('startdate') ?: date('Y-m-01')));
        $enddate    = trim((string) ($this->request->getPost('enddate') ?: date('Y-m-t')));
        $jenis      = (array) $this->request->getPost('jenis');
        $acc        = (array) $this->request->getPost('total');
        $username   = substr((string) ($sess['username'] ?? 'admin'), 0, 50);

        if (!$periode || !$instansi || !$startdate || !$enddate || empty($jenis)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Data tidak lengkap. Semua kolom wajib diisi.'
            ]);
        }

        if ($key > 0) {
            $firstJenis = trim((string) ($jenis[0] ?? 'Arsip Elektronik (PNS)'));
            $firstTotal = (int) ($acc[0] ?? 0);
            if ($firstJenis === '' || $firstTotal < 0) {
                return $this->response->setJSON([
                    'status'  => 'error',
                    'message' => 'Jenis dan jumlah dokumen wajib diisi dengan benar.'
                ]);
            }

            $this->apps->updateData([
                'instansi_id'       => $instansi,
                'period'            => substr($periode, 0, 30),
                'period_date'       => $startdate,
                'period_start_date' => $startdate,
                'period_end_date'   => $enddate,
                'jenis'             => $firstJenis,
                'total'             => $firstTotal,
                'updated_at'        => date('Y-m-d H:i:s'),
            ], $key, 'txn_dms_entry');

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Data DMS berhasil diperbarui.',
                'key'     => $key,
            ]);
        }

        $scema_group = bin2hex(random_bytes(8));

        $dataBatch = [];
        foreach ($jenis as $i => $n) {
            $n = trim((string) $n);
            $val = isset($acc[$i]) && $acc[$i] !== '' ? (int) $acc[$i] : -1;
            if ($n === '' || $val < 0) {
                return $this->response->setJSON([
                    'status'  => 'error',
                    'message' => "Baris ke-" . ($i + 1) . " tidak lengkap. Kolom 'jenis' dan jumlah dokumen wajib diisi."
                ]);
            }

            $dataBatch[] = [
                'action'            => 'manual',
                'scema_group'       => $scema_group,
                'instansi_id'       => $instansi,
                'period'            => substr($periode, 0, 30),
                'period_date'       => $startdate,
                'period_start_date' => $startdate,
                'period_end_date'   => $enddate,
                'jenis'             => $n,
                'total'             => $val,
                'created_by'        => $username,
            ];
        }

        if ($dataBatch) {
            $this->apps->insertBatchData($dataBatch, 'txn_dms_entry');
            $this->apps->storeData(
                [
                    'layanan_id' => 26,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => substr($username, 0, 18),
                ],
                'activity_daily_logs'
            );
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Data berhasil disimpan.'
        ]);
    }

    private function getMapperForJenis($jenis, $insertID, $syncdate, $fallbackInstansi = null)
    {
        switch ($jenis) {
            case 'DMS':
                return function ($row) use ($insertID, $syncdate, $fallbackInstansi) {
                    $instansiID = !empty($row[13]) ? $this->apps->getInstansiID($row[13]) : null;
                    if (!$instansiID && $fallbackInstansi) {
                        $instansiID = $this->apps->getInstansiID($fallbackInstansi);
                    }
                    return [
                        'dms_log_id'     => $insertID,
                        'nip'            => $row[0] ?? null,
                        'instansi_id'    => $instansiID ?: 0,
                        'd2nip'          => ExcelUploader::boolFromExcel($row[1] ?? 0),
                        'ijazah'         => ExcelUploader::boolFromExcel($row[2] ?? 0),
                        'drh'            => ExcelUploader::boolFromExcel($row[3] ?? 0),
                        'cpns'           => ExcelUploader::boolFromExcel($row[4] ?? 0),
                        'pns'            => ExcelUploader::boolFromExcel($row[5] ?? 0),
                        'kp'             => ExcelUploader::boolFromExcel($row[6] ?? 0),
                        'jabatan'        => ExcelUploader::boolFromExcel($row[7] ?? 0),
                        'perubahan'      => ExcelUploader::boolFromExcel($row[8] ?? 0),
                        'berhenti'       => ExcelUploader::boolFromExcel($row[9] ?? 0),
                        'pensiun'        => ExcelUploader::boolFromExcel($row[10] ?? 0),
                        'total_doc'      => isset($row[12]) ? (int) ExcelUploader::cleanNumber($row[12]) : 0,
                        'tanggal_proses' => !empty($row[11]) ? ExcelUploader::excelDate($row[11]) : date('Y-m-d'),
                        'pic'            => isset($row[14]) ? substr((string) $row[14], 0, 30) : null,
                    ];
                };

            default:
                throw new \Exception('Jenis tidak dikenali.');
        }
    }

    public function removeData()
    {
        $key = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }

        $removed = $this->apps->removeData($key, 'txn_dms_entry');
        if (!$removed) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => false,
                'message' => 'Data DMS tidak ditemukan atau gagal dihapus',
            ]);
        }

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getData()
    {
        $bulan = $this->request->getPost('bulan');
        $jenis = trim((string) ($this->request->getPost('jenis') ?? ''));

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $params = [
            'bulan' => $bulan,
            'jenis' => $jenis,
        ];

        $builder = $this->dmsmodel->getBuilder('recap', $params);
        $columns = $this->dmsmodel->getColumns('recap', $params);
        $result  = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getDataDetail()
    {
        $key = (int) $this->request->getPost('key');
        if ($key <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Kunci detail tidak valid'
            ]);
        }

        $builder = $this->dmsmodel->getBuilder('detail', $key);
        $columns = $this->dmsmodel->getColumns('detail', $key);
        $result  = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $bulan = $this->request->getPost('bulan');
        $jenis = trim((string) ($this->request->getPost('jenis') ?? ''));

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status'  => true,
            'summary' => $this->dmsmodel->getSummary($bulan, $jenis),
        ]);
    }
}
