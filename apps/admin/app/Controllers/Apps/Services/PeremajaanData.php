<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;
use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\PDMModel;

class PeremajaanData extends BaseController
{
    protected $pdmmodel;
    protected $apps;
    protected $uploader;
    protected $dataTables;

    public function __construct()
    {
        $this->pdmmodel   = new PDMModel();
        $this->apps       = new AppsModel();
        $this->uploader   = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
    }

    public function storeData()
    {
        $sess      = session()->get();
        $key       = (int) ($this->request->getPost('key') ?? 0);
        $periode   = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $startdate = trim((string) ($this->request->getPost('startdate') ?: date('Y-m-01')));
        $enddate   = trim((string) ($this->request->getPost('enddate') ?: date('Y-m-t')));
        $jenis     = (array) $this->request->getPost('jenis');
        $acc       = (array) $this->request->getPost('acc');
        $btl       = (array) $this->request->getPost('btl');
        $tms       = (array) $this->request->getPost('tms');
        $username  = substr((string) ($sess['username'] ?? 'admin'), 0, 50);

        if (!$periode || !$startdate || !$enddate || empty($jenis)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Data tidak lengkap. Semua kolom wajib diisi.'
            ]);
        }

        if ($key > 0) {
            $firstJenis = trim((string) ($jenis[0] ?? ''));
            $valAcc = (int) ($acc[0] ?? 0);
            $valBtl = (int) ($btl[0] ?? 0);
            $valTms = (int) ($tms[0] ?? 0);

            if ($firstJenis === '' || ($valAcc === 0 && $valBtl === 0 && $valTms === 0)) {
                return $this->response->setJSON([
                    'status'  => 'error',
                    'message' => 'Jenis riwayat wajib diisi dan minimal salah satu dari ACC / BTL / TMS harus lebih dari 0.'
                ]);
            }

            $this->apps->updateData([
                'period'            => substr($periode, 0, 30),
                'period_date'       => $startdate,
                'period_start_date' => $startdate,
                'period_end_date'   => $enddate,
                'jenis'             => substr($firstJenis, 0, 50),
                'total_acc'         => $valAcc,
                'total_btl'         => $valBtl,
                'total_tms'         => $valTms,
                'updated_at'        => date('Y-m-d H:i:s'),
            ], $key, 'txn_pdm');

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Data peremajaan berhasil diperbarui.',
                'key'     => $key,
            ]);
        }

        $scema_group = bin2hex(random_bytes(8));

        $dataBatch = [];
        foreach ($jenis as $i => $n) {
            $n = trim((string) $n);
            $vAcc = (int) ($acc[$i] ?? 0);
            $vBtl = (int) ($btl[$i] ?? 0);
            $vTms = (int) ($tms[$i] ?? 0);

            if ($n === '' || ($vAcc === 0 && $vBtl === 0 && $vTms === 0)) {
                return $this->response->setJSON([
                    'status'  => 'error',
                    'message' => "Baris ke-" . ($i + 1) . " tidak lengkap. Kolom 'jenis' tidak boleh kosong dan minimal salah satu dari ACC / BTL / TMS harus diisi."
                ]);
            }

            $dataBatch[] = [
                'action'            => 'manual',
                'scema_group'       => $scema_group,
                'period'            => substr($periode, 0, 30),
                'period_date'       => $startdate,
                'period_start_date' => $startdate,
                'period_end_date'   => $enddate,
                'jenis'             => substr($n, 0, 50),
                'total_acc'         => $vAcc,
                'total_btl'         => $vBtl,
                'total_tms'         => $vTms,
                'created_by'        => $username,
            ];
        }

        if ($dataBatch) {
            $this->apps->insertBatchData($dataBatch, 'txn_pdm');
            $this->apps->storeData(
                [
                    'layanan_id' => 22,
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

    public function removeData()
    {
        $key = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }

        $this->apps->removeData($key, 'txn_pdm');
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getData()
    {
        return $this->getDataV2();
    }

    public function getDataV2()
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

        $builder = $this->pdmmodel->getBuilder('recap', $params);
        $columns = $this->pdmmodel->getColumns('recap', $params);
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

        $builder = $this->pdmmodel->getBuilder('detail', $key);
        $columns = $this->pdmmodel->getColumns('detail', $key);
        $result  = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getResume()
    {
        $sess   = session()->get();
        $resume = $this->pdmmodel->getResumeData($sess['username'] ?? '');
        $daily  = $this->pdmmodel->getDailyData($sess['username'] ?? '');
        return $this->response->setJSON([
            'resume' => $resume,
            'daily'  => $daily,
        ]);
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
            'summary' => $this->pdmmodel->getSummary($bulan, $jenis),
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
            $this->uploader->validateFile($file);
            $filePath = $file->getTempName();
            $rows = $this->uploader->parseExcel($filePath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status'  => 'error',
                    'message' => 'File Excel kosong atau format tidak sesuai.'
                ]);
            }

            $dataBatch = [];
            $username = substr((string) ($sess['username'] ?? 'admin'), 0, 50);
            $scema_group = bin2hex(random_bytes(8));

            foreach (array_slice($rows, 2) as $row) {
                if (empty($row[0]) && empty($row[3])) {
                    continue;
                }

                if (stripos((string) ($row[0] ?? ''), 'PERIODE') !== false || stripos((string) ($row[3] ?? ''), 'JENIS') !== false) {
                    continue;
                }

                $period = trim((string) ($row[0] ?? date('Y-m')));
                $startDate = ExcelUploader::excelDate($row[1] ?? date('Y-m-01'));
                $endDate = ExcelUploader::excelDate($row[2] ?? date('Y-m-t'));
                $jenis = trim((string) ($row[3] ?? 'Riwayat PDM'));
                $acc = (int) ExcelUploader::cleanNumber($row[4] ?? 0);
                $btl = (int) ExcelUploader::cleanNumber($row[5] ?? 0);
                $tms = (int) ExcelUploader::cleanNumber($row[6] ?? 0);

                $dataBatch[] = [
                    'action'             => 'upload',
                    'scema_group'        => $scema_group,
                    'period'             => substr($period, 0, 30),
                    'period_date'        => $startDate,
                    'period_start_date'  => $startDate,
                    'period_end_date'    => $endDate,
                    'jenis'              => substr($jenis, 0, 50),
                    'total_acc'          => $acc,
                    'total_btl'          => $btl,
                    'total_tms'          => $tms,
                    'created_by'         => $username,
                ];
            }

            if (!empty($dataBatch)) {
                $this->apps->insertBatchData($dataBatch, 'txn_pdm');
                $this->apps->storeData([
                    'layanan_id' => 22,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => substr($username, 0, 18),
                ], 'activity_daily_logs');
            }

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Import batch peremajaan data berhasil. ' . count($dataBatch) . ' baris diproses.',
                'total'   => count($dataBatch)
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal memproses file Excel peremajaan data.',
                $e instanceof \RuntimeException ? 422 : 500,
                'PeremajaanData::importBatch'
            );
        }
    }
}
