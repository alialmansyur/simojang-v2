<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;
use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\DSPModel;

class DisparitasData extends BaseController
{
    protected $dspModel;
    protected $apps;
    protected $uploader;
    protected $dataTables;

    public function __construct()
    {
        $this->dspModel   = new DSPModel();
        $this->apps       = new AppsModel();
        $this->uploader   = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
    }

    public function storeData()
    {
        $session   = session()->get();
        $file      = $this->request->getFile('file');
        $period    = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $syncdate1 = trim((string) ($this->request->getPost('syncdate1') ?: ($this->request->getPost('startdate') ?: date('Y-m-d'))));
        $syncdate2 = trim((string) ($this->request->getPost('syncdate2') ?: ($this->request->getPost('enddate') ?: $syncdate1)));

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows      = $this->uploader->parseExcel($localPath);
        } catch (\Throwable $e) {
            return $this->apiException($e, $e instanceof \RuntimeException ? $e->getMessage() : 'Berkas Excel tidak valid atau gagal dibaca.', 422, 'DisparitasData::storeData');
        }

        if (!is_array($rows) || empty($rows)) {
            return $this->apiError('Data kosong atau format salah.', 422);
        }

        $fileSize  = filesize($localPath);
        $mimeType  = substr((string) $file->getMimeType(), 0, 30);
        $checksum  = substr((string) hash_file('sha256', $localPath), 0, 50);
        $ipAddress = substr((string) $this->request->getIPAddress(), 0, 50);
        $userAgent = $this->request->getUserAgent()
                        ? substr((string) $this->request->getUserAgent()->getAgentString(), 0, 50)
                        : 'Web Browser';
        $username  = substr((string) ($session['username'] ?? 'admin'), 0, 18);

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

        $insertID = $this->apps->storeData($dataLog, 'txn_disparitas');

        $syncDate        = date('Y-m-d H:i:s');
        $mappingFunction = $this->getMapperForJenis('Disparitas', $insertID, $syncDate);

        $dataBatch = [];
        foreach (array_slice($rows, 2) as $row) {
            if (empty($row[0])) {
                continue;
            }
            $dataBatch[] = $mappingFunction($row);
        }

        if (!empty($dataBatch)) {
            $this->apps->insertBatchData($dataBatch, 'txn_disparitas_detail');
            $this->apps->storeData(
                [
                    'layanan_id' => 23,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $username,
                ],
                'activity_daily_logs'
            );
        }

        return $this->response->setJSON([
            'status'   => 'success',
            'message'  => 'Upload dan import data berhasil.',
            'datalist' => $dataBatch
        ]);
    }

    private function getMapperForJenis($jenis, $insertID, $syncdate)
    {
        switch ($jenis) {
            case 'Disparitas':
                return function ($row) use ($insertID, $syncdate) {
                    $instansiID = $this->apps->getInstansiID($row[1] ?? '');
                    return [
                        'disparitas_log_id' => $insertID,
                        'instansi_id'       => $instansiID ?: 0,
                        'jenis_anomali'     => substr((string) ($row[2] ?? ''), 0, 50),
                        'jumlah'            => (int) ExcelUploader::cleanNumber($row[3] ?? 0),
                    ];
                };

            default:
                throw new \Exception('Jenis tidak dikenali.');
        }
    }

    public function saveData()
    {
        $sess         = session()->get();
        $key          = (int) ($this->request->getPost('key') ?? 0);
        $instansi     = $this->request->getPost('instansi');
        $jenisAnomali = trim((string) $this->request->getPost('jenis_anomali'));
        $jumlah       = (int) $this->request->getPost('jumlah');
        $period       = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $startDate    = trim((string) ($this->request->getPost('startdate') ?: date('Y-m-01')));
        $endDate      = trim((string) ($this->request->getPost('enddate') ?: date('Y-m-t')));

        if (!$instansi || !$jenisAnomali || $jumlah <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Instansi, jenis anomali, dan jumlah wajib diisi.'
            ]);
        }

        $instansiID = $this->apps->getInstansiID($instansi) ?: (int) $instansi;
        $username   = substr((string) ($sess['username'] ?? 'admin'), 0, 18);

        if ($key > 0) {
            $this->apps->updateData([
                'period'            => substr($period, 0, 30),
                'period_date'       => $startDate,
                'period_start_date' => $startDate,
                'period_end_date'   => $endDate,
                'file_name'         => substr('Manual Entry (' . $period . ')', 0, 50),
                'updated_at'        => date('Y-m-d H:i:s'),
            ], $key, 'txn_disparitas');

            $this->apps->updateDataByField('disparitas_log_id', $key, [
                'instansi_id'   => $instansiID,
                'jenis_anomali' => substr($jenisAnomali, 0, 50),
                'jumlah'        => $jumlah,
            ], 'txn_disparitas_detail');

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Data disparitas anomali berhasil diperbarui.',
                'id'      => $key,
            ]);
        }

        $dataLog = [
            'action'             => 'manual',
            'period'             => substr($period, 0, 30),
            'period_date'        => $startDate,
            'period_start_date'  => $startDate,
            'period_end_date'    => $endDate,
            'file_name'          => substr('Manual Entry (' . $period . ')', 0, 50),
            'file_size'          => 0,
            'file_type'          => 'direct_entry',
            'file_hash'          => bin2hex(random_bytes(16)),
            'ip_address'         => substr((string) $this->request->getIPAddress(), 0, 50),
            'user_agent'         => 'Web Browser',
            'created_by'         => $username,
        ];

        $insertID = $this->apps->storeData($dataLog, 'txn_disparitas');

        $this->apps->storeData([
            'disparitas_log_id' => $insertID,
            'instansi_id'       => $instansiID,
            'jenis_anomali'     => substr($jenisAnomali, 0, 50),
            'jumlah'            => $jumlah,
        ], 'txn_disparitas_detail');

        $this->apps->storeData([
            'layanan_id' => 23,
            'tanggal'    => date('Y-m-d'),
            'created_by' => $username,
        ], 'activity_daily_logs');

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Data disparitas anomali berhasil disimpan.',
            'id'      => $insertID
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

        $this->apps->removeData($key, 'txn_disparitas');
        $this->apps->removeDataLogDisparitas($key, 'txn_disparitas_detail');
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

        $builder = $this->dspModel->getBuilder('recap', $params);
        $columns = $this->dspModel->getColumns('recap', $params);
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

        $builder = $this->dspModel->getBuilder('detail', $key);
        $columns = $this->dspModel->getColumns('detail', $key);
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
            'summary' => $this->dspModel->getSummary($bulan, $jenis),
        ]);
    }
}
