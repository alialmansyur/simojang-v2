<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use App\Models\Apps\Services\TKHModel;
use App\Models\Apps\AppsModel;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

class TakahData extends BaseController
{
    public function __construct()
    {
        $this->takahmodel = new TKHModel();
        $this->apps = new AppsModel();
        $this->uploader = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
    }

    public function importData()
    {
        $session    = session()->get();
        $file       = $this->request->getFile('file');
        $period     = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $syncdate1  = trim((string) ($this->request->getPost('syncdate1') ?: ($this->request->getPost('startdate') ?: date('Y-m-d'))));
        $syncdate2  = trim((string) ($this->request->getPost('syncdate2') ?: ($this->request->getPost('enddate') ?: $syncdate1)));

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows      = $this->uploader->parseExcel($localPath);
        } catch (\Throwable $e) {
            return $this->apiException($e, $e instanceof \RuntimeException ? $e->getMessage() : 'Berkas Excel tidak valid atau gagal dibaca.', 422, 'TakahData::importData');
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

        $insertID = $this->apps->storeData($dataLog, 'txn_takah');

        $syncDate        = date('Y-m-d H:i:s');
        $mappingFunction = $this->getMapperForJenis('Takah', $insertID, $syncDate);

        $dataBatch = [];
        foreach (array_slice($rows, 2) as $row) {
            if (empty($row[0])) {
                continue;
            }
            $dataBatch[] = $mappingFunction($row);
        }

        if (!empty($dataBatch)) {
            $this->apps->insertBatchData($dataBatch, 'txn_takah_detail');
            $this->apps->storeData(
                [
                    'layanan_id' => 25,
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

    private function getMapperForJenis($jenis, $insertID, $syncdate)
    {
        switch ($jenis) {
            case 'Takah':
                return function ($row) use ($insertID, $syncdate) {
                    $instansiID = $this->apps->getInstansiID($row[2] ?? '');
                    return [
                        'takah_log_id'  => $insertID,
                        'instansi_id'   => $instansiID ?: 0,
                        'nip'           => $row[0] ?? '',
                        'nama'          => substr((string) ($row[1] ?? ''), 0, 100),
                        'd2nip'         => !empty($row[3]) ? 1 : 0,
                        'ijazah'        => !empty($row[4]) ? 1 : 0,
                        'akta'          => !empty($row[5]) ? 1 : 0,
                        'drh'           => !empty($row[6]) ? 1 : 0,
                        'cpns'          => !empty($row[7]) ? 1 : 0,
                        'pns'           => !empty($row[8]) ? 1 : 0,
                        'perubahan'     => !empty($row[9]) ? 1 : 0,
                        'kp'            => !empty($row[10]) ? 1 : 0,
                        'jabatan'       => !empty($row[11]) ? 1 : 0,
                        'berhenti'      => !empty($row[12]) ? 1 : 0,
                        'pensiun'       => !empty($row[13]) ? 1 : 0,
                    ];
                };

            default:
                throw new \Exception('Jenis tidak dikenali.');
        }
    }

    public function saveData()
    {
        $session   = session()->get();
        $key       = (int) ($this->request->getPost('key') ?? 0);
        $nip       = trim((string) $this->request->getPost('nip'));
        $nama      = trim((string) $this->request->getPost('nama'));
        $instansi  = $this->request->getPost('instansi');
        $period    = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $startDate = trim((string) ($this->request->getPost('startdate') ?: date('Y-m-01')));
        $endDate   = trim((string) ($this->request->getPost('enddate') ?: date('Y-m-t')));

        if (!$nip || !$nama || !$instansi) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'NIP, Nama Pegawai, dan Instansi wajib diisi.'
            ]);
        }

        $instansiID = $this->apps->getInstansiID($instansi) ?: (int) $instansi;
        $username   = substr((string) ($session['username'] ?? 'admin'), 0, 18);

        $detailData = [
            'instansi_id' => $instansiID,
            'nip'         => substr($nip, 0, 30),
            'nama'        => substr($nama, 0, 100),
            'd2nip'       => (int) ($this->request->getPost('d2nip') ? 1 : 0),
            'ijazah'      => (int) ($this->request->getPost('ijazah') ? 1 : 0),
            'akta'        => (int) ($this->request->getPost('akta') ? 1 : 0),
            'drh'         => (int) ($this->request->getPost('drh') ? 1 : 0),
            'cpns'        => (int) ($this->request->getPost('cpns') ? 1 : 0),
            'pns'         => (int) ($this->request->getPost('pns') ? 1 : 0),
            'perubahan'   => (int) ($this->request->getPost('perubahan') ? 1 : 0),
            'kp'          => (int) ($this->request->getPost('kp') ? 1 : 0),
            'jabatan'     => (int) ($this->request->getPost('jabatan') ? 1 : 0),
            'berhenti'    => (int) ($this->request->getPost('berhenti') ? 1 : 0),
            'pensiun'     => (int) ($this->request->getPost('pensiun') ? 1 : 0),
        ];

        if ($key > 0) {
            $this->apps->updateData([
                'period'            => substr($period, 0, 30),
                'period_date'       => $startDate,
                'period_start_date' => $startDate,
                'period_end_date'   => $endDate,
                'file_name'         => substr('Manual Entry Takah (' . $nip . ')', 0, 50),
                'updated_at'        => date('Y-m-d H:i:s'),
            ], $key, 'txn_takah');

            $this->apps->updateDataByField('takah_log_id', $key, $detailData, 'txn_takah_detail');

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Data Takah berkas fisik berhasil diperbarui.',
                'id'      => $key,
            ]);
        }

        $dataLog = [
            'action'             => 'manual',
            'period'             => substr($period, 0, 30),
            'period_date'        => $startDate,
            'period_start_date'  => $startDate,
            'period_end_date'    => $endDate,
            'file_name'          => substr('Manual Entry Takah (' . $nip . ')', 0, 50),
            'file_size'          => 0,
            'file_type'          => 'direct_entry',
            'file_hash'          => bin2hex(random_bytes(16)),
            'ip_address'         => substr((string) $this->request->getIPAddress(), 0, 50),
            'user_agent'         => 'Web Browser',
            'created_by'         => $username,
        ];

        $insertID = $this->apps->storeData($dataLog, 'txn_takah');

        $detailData['takah_log_id'] = $insertID;
        $this->apps->storeData($detailData, 'txn_takah_detail');

        $this->apps->storeData([
            'layanan_id' => 25,
            'tanggal'    => date('Y-m-d'),
            'created_by' => $username,
        ], 'activity_daily_logs');

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Data Takah berkas fisik berhasil disimpan.',
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

        $this->apps->removeData($key, 'txn_takah');
        $this->apps->removeDataLogTakah($key, 'txn_takah_detail');
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getData()
    {
        $bulan = $this->request->getPost('bulan');

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $params = [
            'bulan' => $bulan,
        ];

        $builder = $this->takahmodel->getBuilder('recap', $params);
        $columns = $this->takahmodel->getColumns('recap', $params);
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

        $builder = $this->takahmodel->getBuilder('detail', $key);
        $columns = $this->takahmodel->getColumns('detail', $key);
        $result  = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $bulan = $this->request->getPost('bulan');
        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status'  => true,
            'summary' => $this->takahmodel->getSummary($bulan),
        ]);
    }
}
