<?php

namespace App\Controllers\Apps\Services;
use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\NSPKModel;

class NSPKController extends BaseController
{
    protected $appsModel;
    protected $nspkModel;
    protected $uploader;
    protected $dataTables;

    public function __construct(){
        $this->appsModel    = new AppsModel();
        $this->nspkModel      = new NSPKModel();
        $this->uploader     = new ExcelUploader();
        $this->dataTables   = new DataTablesLib();        
        $sess = session()->get();
    }




    public function storeData(){
        $sess       = session()->get();
        $key        = trim((string) $this->request->getPost('key'));
        $instansi   = trim((string) $this->request->getPost('instansi'));
        $period     = trim((string) $this->request->getPost('period'));
        $syncdate1  = trim((string) $this->request->getPost('syncdate1'));
        $syncdate2  = trim((string) $this->request->getPost('syncdate2'));
        $level      = strtoupper(trim((string) $this->request->getPost('level')));
        $nilaiRaw   = trim((string) ($this->request->getPost('nilai') ?? ''));

        $rules = [
            'instansi'      => 'required',
            'syncdate1'     => 'required',
            'syncdate2'     => 'required',
            'level'         => 'required|in_list[A,B,C,D]',
            'period'        => 'required'
        ];

        if (!$this->validate($rules)) {
            $errorsArray = $this->validator->getErrors();
            $message = implode(', ', $errorsArray); 
            return $this->response->setStatusCode(422)->setJSON([
                'data'    => $this->request->getPost(),
                'status'  => 'error',
                'message' => $message
            ]);
        }

        if ($syncdate2 < $syncdate1) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.',
            ]);
        }

        $nilaiClean = str_replace(',', '.', $nilaiRaw);
        $nilaiVal = ($nilaiClean !== '' && is_numeric($nilaiClean)) ? (float) $nilaiClean : null;
        if ($nilaiVal !== null && ($nilaiVal < 0 || $nilaiVal > 100)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Nilai indeks NSPK harus berada pada rentang 0 hingga 100.',
            ]);
        }

        $cek = $this->nspkModel->isDuplicateNSPK($instansi, $period, $key !== '' ? $key : null);
        if ($cek) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Data NSPK untuk instansi dan periode ini sudah terdaftar.'
            ]);
        }

        $now = date('Y-m-d H:i:s');
        $username = $sess['username'] ?? 'admin';

        $dataPayload = [
            'period'            => $period,
            'period_date'       => $syncdate1,
            'period_start_date' => $syncdate1,
            'period_end_date'   => $syncdate2,
            'instansi_id'       => $instansi,
            'level'             => $level,
            'nilai'             => $nilaiVal,
            'updated_at'        => $now,
        ];

        if (!empty($key)) {
            $dataPayload['action'] = 'update';
            $this->nspkModel->saveData($dataPayload, $key);
        } else {
            $dataPayload['action']     = 'create';
            $dataPayload['created_by'] = $username;
            $dataPayload['created_at'] = $now;
            $this->nspkModel->saveData($dataPayload);
            $this->nspkModel->logActivity([
                'layanan_id' => 19,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $username
            ]);
        }

        return $this->response->setStatusCode(200)->setJSON([
            'status'    => 'success',
            'message'   => 'Data NSPK berhasil disimpan.'
        ]);
    }

    public function removeData(){
        $key = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }

        $this->nspkModel->deleteData($key);
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getData(){
        $bulan = $this->request->getPost('bulan');
        $level = trim((string) ($this->request->getPost('level') ?? $this->request->getPost('category') ?? $this->request->getPost('kategori') ?? ''));

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $builder = $this->nspkModel->getBuilder('recap', [
            'bulan' => $bulan,
            'level' => $level,
        ]);

        $columns    = $this->nspkModel->getColumns('recap');
        $result     = $this->dataTables->render($builder, $columns);
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
            'status' => 'success',
            'summary' => $this->nspkModel->getSummary($bulan),
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
            $username = $sess['username'] ?? 'admin';
            $now = date('Y-m-d H:i:s');

            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0])) {
                    continue;
                }

                $rawInstansi = trim((string) $row[0]);
                $instansiId = $this->appsModel->getInstansiID($rawInstansi);
                if (empty($instansiId)) {
                    $instansiId = $rawInstansi;
                }

                $period = trim((string) ($row[1] ?? date('Y-m')));
                $startDate = ExcelUploader::excelDate($row[2] ?? null);
                $endDate = ExcelUploader::excelDate($row[3] ?? null);
                $level = strtoupper(trim((string) ($row[4] ?? 'B')));
                if (!in_array($level, ['A', 'B', 'C', 'D'])) {
                    $level = 'B';
                }

                $nilaiCell = isset($row[5]) ? str_replace(',', '.', trim((string) $row[5])) : '';
                $nilaiVal = ($nilaiCell !== '' && is_numeric($nilaiCell)) ? (float) $nilaiCell : null;

                $dataBatch[] = [
                    'action'            => 'create',
                    'period'            => $period,
                    'period_date'       => $startDate ?: date('Y-m-d'),
                    'period_start_date' => $startDate ?: date('Y-m-d'),
                    'period_end_date'   => $endDate ?: ($startDate ?: date('Y-m-d')),
                    'instansi_id'       => $instansiId,
                    'level'             => $level,
                    'nilai'             => $nilaiVal,
                    'created_by'        => $username,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ];
            }

            if (empty($dataBatch)) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status'  => 'error',
                    'message' => 'Tidak ada baris data valid yang dapat diimpor.'
                ]);
            }

            $db = \Config\Database::connect();
            $db->table('txn_nspk')->insertBatch($dataBatch);

            $this->nspkModel->logActivity([
                'layanan_id' => 19,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $username
            ]);

            return $this->response->setJSON([
                'status'       => 'success',
                'message'      => 'Import batch data Indeks NSPK berhasil diproses.',
                'total_import' => count($dataBatch)
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal memproses file Excel Indeks NSPK.',
                $e instanceof \RuntimeException ? 422 : 500,
                'NSPKController::importBatch'
            );
        }
    }
}
