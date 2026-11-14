<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;
use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\ITGModel;

class IntegrasiData extends BaseController
{
    protected $itgmodel;
    protected $apps;
    protected $uploader;
    protected $dataTables;

    public function __construct()
    {
        $this->itgmodel   = new ITGModel();
        $this->apps       = new AppsModel();
        $this->uploader   = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
    }

    public function storeData()
    {
        $sess      = session()->get();
        $key       = (int) ($this->request->getPost('key') ?? 0);
        $instansi  = $this->request->getPost('instansi');
        $period    = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $startdate = trim((string) ($this->request->getPost('startdate') ?: date('Y-m-d')));
        $riwayat   = (array) $this->request->getPost('riwayat');
        $remarks   = trim((string) $this->request->getPost('remarks'));
        $video_url = trim((string) $this->request->getPost('video_url'));
        $username  = substr((string) ($sess['username'] ?? 'admin'), 0, 50);

        $rules = [
            'instansi'  => 'required',
            'period'    => 'required',
            'startdate' => 'required|valid_date[Y-m-d]',
            'riwayat'   => 'required',
            'remarks'   => 'required',
            'video_url' => 'required|valid_url',
        ];

        if (!$this->validate($rules)) {
            $errorsArray = $this->validator->getErrors();
            $message = implode(', ', $errorsArray);
            return $this->response->setJSON([
                'data'    => $this->request->getPost(),
                'status'  => 'error',
                'message' => $message
            ]);
        }

        if ($key > 0) {
            $firstRw = (int) ($riwayat[0] ?? 0);
            if ($firstRw <= 0) {
                return $this->response->setJSON([
                    'status'  => 'error',
                    'message' => 'Tahapan/jenis riwayat integrasi wajib dipilih.'
                ]);
            }

            if ($this->itgmodel->isDuplicateIntegrasi($instansi, $firstRw, $key)) {
                return $this->response->setJSON([
                    'status'  => 'error',
                    'message' => 'Data untuk instansi dan jenis riwayat ini sudah terdaftar.'
                ]);
            }

            $this->apps->updateData([
                'period'          => substr($period, 0, 30),
                'period_date'     => $startdate,
                'instansi_id'     => $instansi,
                'rw_integrasi_id' => $firstRw,
                'remarks'         => substr($remarks, 0, 50),
                'bukti_dukung'    => $video_url,
                'updated_at'      => date('Y-m-d H:i:s'),
            ], $key, 'txn_integrasi');

            return $this->response->setStatusCode(200)->setJSON([
                'status'  => 'success',
                'message' => 'Data integrasi berhasil diperbarui.',
                'key'     => $key
            ]);
        }

        $dataBatch = [];
        foreach ($riwayat as $rw) {
            $rwId = (int) $rw;
            if ($rwId <= 0) {
                continue;
            }
            if ($this->itgmodel->isDuplicateIntegrasi($instansi, $rwId)) {
                continue;
            }

            $dataBatch[] = [
                'action'          => 'manual',
                'period'          => substr($period, 0, 30),
                'period_date'     => $startdate,
                'instansi_id'     => $instansi,
                'rw_integrasi_id' => $rwId,
                'remarks'         => substr($remarks, 0, 50),
                'bukti_dukung'    => $video_url,
                'created_by'      => $username,
                'created_at'      => date('Y-m-d H:i:s')
            ];
        }

        if (empty($dataBatch)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Semua data sudah terdaftar (duplikat).'
            ]);
        }

        $this->apps->insertBatchData($dataBatch, 'txn_integrasi');
        $this->apps->storeData(
            [
                'layanan_id' => 24,
                'tanggal'    => date('Y-m-d'),
                'created_by' => substr($username, 0, 18)
            ],
            'activity_daily_logs'
        );

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Data berhasil disimpan.',
            'key'     => $key
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

        $this->apps->removeData($key, 'txn_integrasi');
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getData()
    {
        $jenis = $this->request->getPost('jenis') ?? 0;
        $bulan = $this->request->getPost('bulan');
        if (!is_array($bulan)) {
            $bulan = [];
        }
        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $params = [
            'jenis' => $jenis,
            'bulan' => $bulan,
        ];

        $builder = $this->itgmodel->getBuilder('recap', $params);
        $columns = $this->itgmodel->getColumns('recap', $params);
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

        $builder = $this->itgmodel->getBuilder('detail', $key);
        $columns = $this->itgmodel->getColumns('detail', $key);
        $result  = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $jenis = $this->request->getPost('jenis') ?? 0;
        $bulan = $this->request->getPost('bulan');
        if (!is_array($bulan)) {
            $bulan = [];
        }
        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status'  => true,
            'summary' => $this->itgmodel->getSummary($jenis, $bulan),
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
            $now = date('Y-m-d H:i:s');

            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0])) {
                    continue;
                }

                $instansiRef = trim((string) $row[0]);
                $instansiID = $this->apps->getInstansiID($instansiRef);
                if (!$instansiID && !empty($row[1])) {
                    $instansiID = $this->apps->getInstansiID(trim((string) $row[1]));
                }
                if (!$instansiID) {
                    continue;
                }

                $period = !empty($row[2]) ? trim((string) $row[2]) : date('Y-m');
                $startDate = !empty($row[3]) ? ExcelUploader::excelDate($row[3]) : date('Y-m-d');
                $tahap = !empty($row[4]) ? (int) ExcelUploader::cleanNumber($row[4]) : 1;
                $tahap = max(1, min(8, $tahap));
                $remarks = !empty($row[5]) ? trim((string) $row[5]) : 'Progres Integrasi Web Service SIASN';
                $buktiDukung = !empty($row[6]) ? trim((string) $row[6]) : 'https://siasn.bkn.go.id';

                if ($this->itgmodel->isDuplicateIntegrasi($instansiID, $tahap)) {
                    continue;
                }

                $dataBatch[] = [
                    'action'          => 'upload',
                    'period'          => substr($period, 0, 30),
                    'period_date'     => $startDate,
                    'instansi_id'     => $instansiID,
                    'rw_integrasi_id' => $tahap,
                    'remarks'         => substr($remarks, 0, 50),
                    'bukti_dukung'    => $buktiDukung,
                    'created_by'      => $username,
                    'created_at'      => $now,
                ];
            }

            if (!empty($dataBatch)) {
                $this->apps->insertBatchData($dataBatch, 'txn_integrasi');
                $this->apps->storeData([
                    'layanan_id' => 24,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => substr($username, 0, 18),
                ], 'activity_daily_logs');
            }

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Import batch integrasi SIASN berhasil. ' . count($dataBatch) . ' status instansi diproses.',
                'total'   => count($dataBatch)
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal memproses file Excel integrasi SIASN.',
                $e instanceof \RuntimeException ? 422 : 500,
                'IntegrasiData::importBatch'
            );
        }
    }
}
